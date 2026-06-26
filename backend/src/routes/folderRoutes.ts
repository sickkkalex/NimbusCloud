import { Router } from 'express';
import { createFolder, getFolders, updateFolder, deleteFolder, hardDeleteFolder, restoreFolder, toggleStarFolder } from '../controllers/folderController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateToken as any, createFolder as any);
router.get('/', authenticateToken as any, getFolders as any);
router.patch('/:id', authenticateToken as any, updateFolder as any);
router.delete('/:id', authenticateToken as any, deleteFolder as any);
router.delete('/:id/permanent', authenticateToken as any, hardDeleteFolder as any);
router.post('/:id/restore', authenticateToken as any, restoreFolder as any);
router.post('/:id/star', authenticateToken as any, toggleStarFolder as any);

export default router;
