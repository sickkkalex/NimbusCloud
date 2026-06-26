import { Router } from 'express';
import {
    uploadFile,
    getMyFiles,
    updateFile,
    deleteFile,
    streamFile,
    downloadFile,
} from '../controllers/fileController';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../config/multer';

const router = Router();

// Lista e upload
router.post('/upload', authenticateToken as any, upload.single('file'), uploadFile as any);
router.get('/list', authenticateToken as any, getMyFiles as any);

// Operazioni su singolo file
router.patch('/:id', authenticateToken as any, updateFile as any);
router.delete('/:id', authenticateToken as any, deleteFile as any);
router.get('/:id/stream', authenticateToken as any, streamFile as any);
router.get('/:id/download', authenticateToken as any, downloadFile as any);

export default router;