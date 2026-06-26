import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { avatarUpload } from '../config/avatarMulter';
import { getProfile, updateProfile, uploadAvatar, getAvatar, upgradePlan } from '../controllers/userController';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);
router.post('/me/avatar', authenticateToken, avatarUpload.single('avatar'), uploadAvatar);
router.get('/me/avatar', getAvatar);
router.post('/upgrade', authenticateToken, upgradePlan);

export default router;
