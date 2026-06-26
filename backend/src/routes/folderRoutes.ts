import { Router } from 'express';
import { createFolder, getFolders, updateFolder, deleteFolder } from '../controllers/folderController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateToken as any, createFolder as any);
router.get('/', authenticateToken as any, getFolders as any);
router.patch('/:id', authenticateToken as any, updateFolder as any);
router.delete('/:id', authenticateToken as any, deleteFolder as any);

export default router;
