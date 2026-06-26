import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// 1. CREA CARTELLA
export const createFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { name, parentId } = req.body;

        if (!name || String(name).trim() === '') {
            res.status(400).json({ error: 'Nome cartella obbligatorio.' });
            return;
        }

        const folder = await prisma.folder.create({
            data: {
                name: String(name).trim(),
                ownerId: userId!,
                parentId: parentId ? String(parentId) : null,
            },
        });

        res.status(201).json({ message: 'Cartella creata.', folder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nella creazione della cartella.' });
    }
};

// 2. LISTA CARTELLE DELL'UTENTE
export const getFolders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        const folders = await prisma.folder.findMany({
            where: { ownerId: userId, isDeleted: false },
            orderBy: { createdAt: 'asc' },
            include: {
                children: { orderBy: { createdAt: 'asc' } },
                _count: { select: { files: true } },
            },
        });

        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: 'Errore nel recupero delle cartelle.' });
    }
};

// 3. AGGIORNA CARTELLA (rinomina, sposta)
export const updateFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;
        const { name, parentId } = req.body;

        const folder = await prisma.folder.findFirst({ where: { id, ownerId: userId } });
        if (!folder) {
            res.status(404).json({ error: 'Cartella non trovata.' });
            return;
        }

        const updated = await prisma.folder.update({
            where: { id },
            data: {
                ...(name !== undefined && { name: String(name).trim() }),
                ...(parentId !== undefined && { parentId: parentId === null ? null : String(parentId) }),
            },
        });

        res.json({ message: 'Cartella aggiornata.', folder: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento della cartella.' });
    }
};

// 4. ELIMINA CARTELLA (SOFT DELETE)
export const deleteFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const folder = await prisma.folder.findFirst({ where: { id, ownerId: userId } });
        if (!folder) {
            res.status(404).json({ error: 'Cartella non trovata.' });
            return;
        }

        await prisma.folder.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });

        res.json({ message: 'Cartella spostata nel cestino.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione della cartella.' });
    }
};

// 4.1 HARD DELETE CARTELLA
export const hardDeleteFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const folder = await prisma.folder.findFirst({ where: { id, ownerId: userId } });
        if (!folder) {
            res.status(404).json({ error: 'Cartella non trovata.' });
            return;
        }

        // Sposta i file in root (oppure eliminali se si vuole svuotare il cestino completamente)
        await prisma.file.updateMany({
            where: { folderId: id, ownerId: userId },
            data: { folderId: null },
        });

        // Sposta sottocartelle in root
        await prisma.folder.updateMany({
            where: { parentId: id, ownerId: userId },
            data: { parentId: null },
        });

        await prisma.folder.delete({ where: { id } });

        res.json({ message: 'Cartella eliminata permanentemente. I file sono stati spostati nella root.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione permanente della cartella.' });
    }
};

// 4.2 RIPRISTINA CARTELLA
export const restoreFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const folder = await prisma.folder.findFirst({ where: { id, ownerId: userId } });
        if (!folder) {
            res.status(404).json({ error: 'Cartella non trovata.' });
            return;
        }

        await prisma.folder.update({
            where: { id },
            data: { isDeleted: false, deletedAt: null }
        });

        res.json({ message: 'Cartella ripristinata.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il ripristino della cartella.' });
    }
};

// 4.3 TOGGLE PREFERITI CARTELLA
export const toggleStarFolder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const folder = await prisma.folder.findFirst({ where: { id, ownerId: userId } });
        if (!folder) {
            res.status(404).json({ error: 'Cartella non trovata.' });
            return;
        }

        const updated = await prisma.folder.update({
            where: { id },
            data: { isStarred: !folder.isStarred }
        });

        res.json({ message: updated.isStarred ? 'Cartella aggiunta ai preferiti.' : 'Cartella rimossa dai preferiti.', folder: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento dei preferiti.' });
    }
};
