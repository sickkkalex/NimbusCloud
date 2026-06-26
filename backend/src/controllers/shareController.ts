import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// 1. CREA UN LINK DI CONDIVISIONE
export const createShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { fileId, permission, expiresInDays } = req.body;
        const userId = req.user?.id;

        // Verifichiamo che il file esista e sia di proprietà dell'utente
        const file = await prisma.file.findFirst({
            where: { id: fileId, ownerId: userId },
        });

        if (!file) {
            res.status(404).json({ error: 'File non trovato o non sei il proprietario.' });
            return;
        }

        // Calcoliamo la scadenza opzionale
        let expiresAt: Date | null = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
        }

        // Creiamo il record di condivisione
        const share = await prisma.share.create({
            data: {
                fileId: file.id,
                permission: permission || 'READ',
                expiresAt: expiresAt,
            },
        });

        // Generiamo l'URL pubblico che punterà al nostro backend
        const shareUrl = `${req.protocol}://${req.get('host')}/api/shares/download/${share.token}`;

        res.status(201).json({
            message: 'Link di condivisione generato!',
            shareUrl,
            expiresAt,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nella creazione della condivisione.' });
    }
};

// 2. SCARICA IL FILE CONDIVISO TRAMITE TOKEN
export const downloadSharedFile = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;

        // Cerchiamo lo share includendo i dati del file associato
        const share = await prisma.share.findUnique({
            where: { token: token as string },
            include: { file: true },
        });

        if (!share) {
            res.status(404).json({ error: 'Link di condivisione non valido o inesistente.' });
            return;
        }

        // Controlliamo se il link è scaduto
        if (share.expiresAt && new Date() > share.expiresAt) {
            res.status(410).json({ error: 'Questo link di condivisione è scaduto fratm.' });
            return;
        }

        const filePhysicPath = path.join(__dirname, '../../uploads', share.file.systemPath);

        // Verifichiamo se il file esiste ancora fisicamente sul disco
        if (!fs.existsSync(filePhysicPath)) {
            res.status(404).json({ error: 'Il file fisico non è più presente sul server.' });
            return;
        }

        // Forza il download nel browser con il nome originale del file
        res.download(filePhysicPath, share.file.name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il download del file condiviso.' });
    }
};