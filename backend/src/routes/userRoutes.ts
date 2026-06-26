import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { avatarUpload } from '../config/avatarMulter';
import { getProfile, updateProfile, uploadAvatar, getAvatar } from '../controllers/userController';

const router = Router();

router.get('/me', authenticateToken, getProfile);
router.patch('/me', authenticateToken, updateProfile);
router.post('/me/avatar', authenticateToken, avatarUpload.single('avatar'), uploadAvatar);
router.get('/me/avatar', getAvatar);

export default router;
