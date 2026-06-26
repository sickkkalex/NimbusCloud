import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// 1. UPLOAD DI UN FILE
export const uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nessun file caricato.' });
            return;
        }

        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Utente non autorizzato.' });
            return;
        }

        const folderId = req.body.folderId || null;

        const newFile = await prisma.file.create({
            data: {
                name: req.file.originalname,
                systemPath: req.file.filename,
                size: req.file.size,
                mimeType: req.file.mimetype,
                ownerId: userId,
                folderId: folderId,
            },
        });

        res.status(201).json({ message: 'File caricato con successo!', file: newFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il salvataggio del file.' });
    }
};

// 2. LISTA DEI FILE DELL'UTENTE
export const getMyFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        const files = await prisma.file.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: 'desc' },
            include: { folder: { select: { id: true, name: true } } },
        });

        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Errore nel recupero dei file.' });
    }
};

// 3. AGGIORNA FILE (rinomina, sposta cartella)
export const updateFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;
        const { name, folderId } = req.body;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        const updated = await prisma.file.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(folderId !== undefined && { folderId: folderId === null ? null : folderId }),
            },
        });

        res.json({ message: 'File aggiornato.', file: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento del file.' });
    }
};

// 4. ELIMINA FILE
export const deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        await prisma.share.deleteMany({ where: { fileId: id } });
        await prisma.file.delete({ where: { id } });

        const filePath = path.join(UPLOAD_DIR, file.systemPath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'File eliminato con successo.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione del file.' });
    }
};

// 5. STREAM FILE (visualizza nel browser)
export const streamFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        const filePath = path.join(UPLOAD_DIR, file.systemPath);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File fisico non trovato.' });
            return;
        }

        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.name)}"`);
        res.setHeader('Content-Length', file.size.toString());
        fs.createReadStream(filePath).pipe(res as any);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante lo streaming del file.' });
    }
};

// 6. DOWNLOAD FILE (forza download)
export const downloadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        const filePath = path.join(UPLOAD_DIR, file.systemPath);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File fisico non trovato.' });
            return;
        }

        res.download(filePath, file.name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il download.' });
    }
};