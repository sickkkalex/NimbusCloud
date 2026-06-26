import { Router } from 'express';
import {
    uploadFile,
    uploadChunk,
    completeUpload,
    getMyFiles,
    updateFile,
    deleteFile,
    hardDeleteFile,
    restoreFile,
    toggleStarFile,
    streamFile,
    downloadFile,
    getThumbnail
} from '../controllers/fileController';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

// Lista e upload
router.post('/upload', authenticateToken as any, upload.single('file'), uploadFile as any);
router.post('/upload/chunk', authenticateToken as any, upload.single('chunk'), uploadChunk as any);
router.post('/upload/complete', authenticateToken as any, completeUpload as any);
router.get('/list', authenticateToken as any, getMyFiles as any);

// Operazioni su singolo file
router.patch('/:id', authenticateToken as any, updateFile as any);
router.delete('/:id', authenticateToken as any, deleteFile as any);
router.delete('/:id/permanent', authenticateToken as any, hardDeleteFile as any);
router.post('/:id/restore', authenticateToken as any, restoreFile as any);
router.post('/:id/star', authenticateToken as any, toggleStarFile as any);
router.get('/:id/stream', authenticateToken as any, streamFile as any);
router.get('/:id/download', authenticateToken as any, downloadFile as any);
router.get('/:id/thumbnail', authenticateToken as any, getThumbnail as any);

export default router;