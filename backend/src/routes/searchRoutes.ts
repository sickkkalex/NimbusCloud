import { Router } from 'express';
import { getTrash, getStarred, globalSearch, getStorageStats } from '../controllers/searchController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.get('/trash', authenticateToken as any, getTrash as any);
router.get('/starred', authenticateToken as any, getStarred as any);
router.get('/query', authenticateToken as any, globalSearch as any);
router.get('/stats', authenticateToken as any, getStorageStats as any);

export default router;
