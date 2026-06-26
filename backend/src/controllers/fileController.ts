import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbnails');

if (!fs.existsSync(THUMB_DIR)) {
    fs.mkdirSync(THUMB_DIR, { recursive: true });
}

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

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'Utente non trovato.' });
            return;
        }

        const usedSpace = await prisma.file.aggregate({
            where: { ownerId: userId, isDeleted: false },
            _sum: { size: true }
        });
        const currentUsage = usedSpace._sum.size || 0;
        
        if (BigInt(currentUsage) + BigInt(req.file.size) > user.storageQuota) {
            res.status(403).json({ error: 'Spazio di archiviazione esaurito. Passa al piano Premium!' });
            return;
        }

        let thumbnailPath: string | null = null;
        const filePath = path.join(UPLOAD_DIR, req.file.filename);

        if (req.file.mimetype.startsWith('image/')) {
            const thumbFilename = `thumb_${req.file.filename}`;
            const thumbDest = path.join(THUMB_DIR, thumbFilename);
            try {
                await sharp(filePath)
                    .resize(400, 400, { fit: 'inside' })
                    .toFile(thumbDest);
                thumbnailPath = thumbFilename;
            } catch (err) {
                console.error('Errore generazione miniatura:', err);
            }
        }

        const newFile = await prisma.file.create({
            data: {
                name: req.file.originalname,
                systemPath: req.file.filename,
                size: req.file.size,
                mimeType: req.file.mimetype,
                ownerId: userId,
                folderId: folderId,
                thumbnailPath: thumbnailPath
            },
        });

        res.status(201).json({ message: 'File caricato con successo!', file: newFile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il salvataggio del file.' });
    }
};

// 1.1 UPLOAD DI UN CHUNK
export const uploadChunk = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nessun chunk ricevuto.' });
            return;
        }

        const { uploadId, chunkIndex } = req.body;
        if (!uploadId || chunkIndex === undefined) {
            res.status(400).json({ error: 'Dati chunk mancanti.' });
            return;
        }

        const tempDir = path.join(UPLOAD_DIR, 'temp', uploadId);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const chunkPath = path.join(tempDir, String(chunkIndex));
        // Move the multer file to the chunk location
        fs.renameSync(req.file.path, chunkPath);

        res.json({ message: 'Chunk ricevuto.' });
    } catch (error) {
        console.error('Errore in uploadChunk:', error);
        res.status(500).json({ error: 'Errore nel salvataggio del chunk.' });
    }
};

// 1.2 COMPLETE CHUNKED UPLOAD
export const completeUpload = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Utente non autorizzato.' });
            return;
        }

        const { uploadId, filename, mimeType, size, totalChunks, folderId } = req.body;
        if (!uploadId || !filename || !totalChunks) {
            res.status(400).json({ error: 'Dati per completamento mancanti.' });
            return;
        }

        const tempDir = path.join(UPLOAD_DIR, 'temp', uploadId);
        if (!fs.existsSync(tempDir)) {
            res.status(404).json({ error: 'Upload non trovato.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: 'Utente non trovato.' });
            return;
        }

        const usedSpace = await prisma.file.aggregate({
            where: { ownerId: userId, isDeleted: false },
            _sum: { size: true }
        });
        const currentUsage = usedSpace._sum.size || 0;
        
        if (BigInt(currentUsage) + BigInt(size) > user.storageQuota) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            res.status(403).json({ error: 'Spazio di archiviazione esaurito. Passa al piano Premium!' });
            return;
        }

        // Estensione e nome sicuro
        const ext = path.extname(filename);
        const systemFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const finalPath = path.join(UPLOAD_DIR, systemFilename);

        const writeStream = fs.createWriteStream(finalPath);

        // Merge chunks
        for (let i = 0; i < Number(totalChunks); i++) {
            const chunkPath = path.join(tempDir, String(i));
            if (!fs.existsSync(chunkPath)) {
                writeStream.end();
                res.status(400).json({ error: `Chunk ${i} mancante.` });
                return;
            }
            const data = fs.readFileSync(chunkPath);
            writeStream.write(data);
            fs.unlinkSync(chunkPath); // rimuovo il chunk dopo averlo unito
        }
        writeStream.end();

        // Elimina directory temporanea
        fs.rmdirSync(tempDir);

        // Thumbnail (stessa logica dell'upload diretto)
        let thumbnailPath: string | null = null;
        if (mimeType && mimeType.startsWith('image/')) {
            const thumbFilename = `thumb_${systemFilename}`;
            const thumbDest = path.join(THUMB_DIR, thumbFilename);
            try {
                await sharp(finalPath)
                    .resize(400, 400, { fit: 'inside' })
                    .toFile(thumbDest);
                thumbnailPath = thumbFilename;
            } catch (err) {
                console.error('Errore generazione miniatura chunked:', err);
            }
        }

        const newFile = await prisma.file.create({
            data: {
                name: filename,
                systemPath: systemFilename,
                size: Number(size),
                mimeType: mimeType || 'application/octet-stream',
                ownerId: userId,
                folderId: folderId || null,
                thumbnailPath: thumbnailPath
            },
        });

        res.status(201).json({ message: 'Upload completato.', file: newFile });
    } catch (error) {
        console.error('Errore in completeUpload:', error);
        res.status(500).json({ error: 'Errore nel completamento dell\'upload.' });
    }
};

// 2. LISTA DEI FILE DELL'UTENTE
export const getMyFiles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        const files = await prisma.file.findMany({
            where: { ownerId: userId, isDeleted: false },
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

// 4. ELIMINA FILE (SOFT DELETE)
export const deleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        await prisma.file.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });

        res.json({ message: 'File spostato nel cestino.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione del file.' });
    }
};

// 4.1 HARD DELETE FILE
export const hardDeleteFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

        res.json({ message: 'File eliminato permanentemente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'eliminazione permanente.' });
    }
};

// 4.2 RIPRISTINA FILE
export const restoreFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        await prisma.file.update({
            where: { id },
            data: { isDeleted: false, deletedAt: null }
        });

        res.json({ message: 'File ripristinato dal cestino.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante il ripristino del file.' });
    }
};

// 4.3 TOGGLE PREFERITI
export const toggleStarFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file) {
            res.status(404).json({ error: 'File non trovato.' });
            return;
        }

        const updated = await prisma.file.update({
            where: { id },
            data: { isStarred: !file.isStarred }
        });

        res.json({ message: updated.isStarred ? 'Aggiunto ai preferiti.' : 'Rimosso dai preferiti.', file: updated });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore durante l\'aggiornamento dei preferiti.' });
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

// 7. GET THUMBNAIL
export const getThumbnail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        const userId = req.user?.id;

        const file = await prisma.file.findFirst({ where: { id, ownerId: userId } });
        if (!file || !file.thumbnailPath) {
            res.status(404).json({ error: 'Miniatura non trovata.' });
            return;
        }

        const thumbPath = path.join(THUMB_DIR, file.thumbnailPath);
        if (!fs.existsSync(thumbPath)) {
            res.status(404).json({ error: 'File miniatura fisico non trovato.' });
            return;
        }

        res.sendFile(thumbPath);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Errore nel recupero della miniatura.' });
    }
};