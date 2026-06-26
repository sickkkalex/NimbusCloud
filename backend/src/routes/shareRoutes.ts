import { Router } from 'express';
import { createShare, downloadSharedFile } from '../controllers/shareController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Endpoint protetto per generare il link di share
router.post('/create', authenticateToken as any, createShare as any);

// Endpoint pubblico per scaricare il file tramite il token generato
router.get('/download/:token', downloadSharedFile);

export default router;