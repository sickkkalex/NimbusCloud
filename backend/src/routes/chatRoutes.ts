import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
    getMessages,
    sendMessage,
    getConversations,
    getUserMessages,
} from '../controllers/chatController';

const router = Router();

router.get('/messages', authenticateToken, getMessages);
router.post('/messages', authenticateToken, sendMessage);
router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:userId/messages', authenticateToken, getUserMessages);

export default router;
