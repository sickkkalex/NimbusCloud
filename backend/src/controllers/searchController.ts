import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// 1. GET TRASH
export const getTrash = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const files = await prisma.file.findMany({
            where: { ownerId: userId, isDeleted: true },
            orderBy: { deletedAt: 'desc' },
        });

        const folders = await prisma.folder.findMany({
            where: { ownerId: userId, isDeleted: true },
            orderBy: { deletedAt: 'desc' },
        });

        res.json({ files, folders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nel recupero del cestino.' });
    }
};

// 2. GET STARRED
export const getStarred = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const files = await prisma.file.findMany({
            where: { ownerId: userId, isDeleted: false, isStarred: true },
            orderBy: { createdAt: 'desc' },
        });

        const folders = await prisma.folder.findMany({
            where: { ownerId: userId, isDeleted: false, isStarred: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ files, folders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nel recupero dei preferiti.' });
    }
};

// 3. GLOBAL SEARCH
export const globalSearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const query = req.query.q ? String(req.query.q).trim() : '';
        
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        if (!query) {
            res.json({ files: [], folders: [] });
            return;
        }

        const files = await prisma.file.findMany({
            where: {
                ownerId: userId,
                isDeleted: false,
                name: { contains: query, mode: 'insensitive' }
            },
            take: 20
        });

        const folders = await prisma.folder.findMany({
            where: {
                ownerId: userId,
                isDeleted: false,
                name: { contains: query, mode: 'insensitive' }
            },
            take: 20
        });

        res.json({ files, folders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante la ricerca.' });
    }
};

// 4. STORAGE STATS
export const getStorageStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { storageQuota: true }
        });

        if (!user) {
            res.status(404).json({ error: 'Utente non trovato' });
            return;
        }

        // Calcola totale usando raw query o aggregazione
        const totalSizeAggr = await prisma.file.aggregate({
            _sum: { size: true },
            where: { ownerId: userId, isDeleted: false }
        });

        const totalUsed = totalSizeAggr._sum.size || 0;

        // Esempi di tipi: Immagini, Video, Documenti, Altro
        const imageSizeAggr = await prisma.file.aggregate({
            _sum: { size: true },
            where: { ownerId: userId, isDeleted: false, mimeType: { startsWith: 'image/' } }
        });

        const videoSizeAggr = await prisma.file.aggregate({
            _sum: { size: true },
            where: { ownerId: userId, isDeleted: false, mimeType: { startsWith: 'video/' } }
        });

        // Convertiamo il BigInt in stringa prima di inviarlo
        res.json({
            storageQuota: user.storageQuota.toString(),
            totalUsed: totalUsed,
            details: {
                images: imageSizeAggr._sum.size || 0,
                videos: videoSizeAggr._sum.size || 0,
                // Si potrebbe estendere con altri tipi
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nel recupero delle statistiche di archiviazione.' });
    }
};
