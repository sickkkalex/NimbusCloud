import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

const isDeveloper = (email: string): boolean => {
    const devEmail = process.env.DEVELOPER_EMAIL;
    return Boolean(devEmail && email.toLowerCase() === devEmail.toLowerCase());
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const messages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        res.json(messages.map((m) => ({
            id: m.id,
            content: m.content,
            isFromDev: m.isFromDev,
            createdAt: m.createdAt.toISOString(),
        })));
    } catch {
        res.status(500).json({ error: 'Errore nel recupero dei messaggi.' });
    }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { content } = req.body;
        if (!content?.trim()) {
            res.status(400).json({ error: 'Il messaggio non può essere vuoto.' });
            return;
        }

        const fromDev = isDeveloper(req.user!.email);
        const targetUserId = fromDev && req.body.userId ? req.body.userId : req.user!.id;

        if (fromDev && req.body.userId) {
            const target = await prisma.user.findUnique({ where: { id: req.body.userId } });
            if (!target) {
                res.status(404).json({ error: 'Utente non trovato.' });
                return;
            }
        }

        const message = await prisma.chatMessage.create({
            data: {
                userId: targetUserId,
                content: content.trim(),
                isFromDev: fromDev,
            },
        });

        res.status(201).json({
            id: message.id,
            content: message.content,
            isFromDev: message.isFromDev,
            createdAt: message.createdAt.toISOString(),
        });
    } catch {
        res.status(500).json({ error: 'Errore nell\'invio del messaggio.' });
    }
};

export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!isDeveloper(req.user!.email)) {
            res.status(403).json({ error: 'Accesso riservato allo sviluppatore.' });
            return;
        }

        const users = await prisma.user.findMany({
            where: {
                chatMessages: { some: {} },
                NOT: { email: req.user!.email },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                chatMessages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        res.json(users.map((u) => ({
            userId: u.id,
            email: u.email,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email.split('@')[0],
            lastMessage: u.chatMessages[0]?.content ?? '',
            lastMessageAt: u.chatMessages[0]?.createdAt.toISOString() ?? null,
        })));
    } catch {
        res.status(500).json({ error: 'Errore nel recupero delle conversazioni.' });
    }
};

export const getUserMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!isDeveloper(req.user!.email)) {
            res.status(403).json({ error: 'Accesso riservato allo sviluppatore.' });
            return;
        }

        const userId = req.params.userId as string;
        const messages = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });

        res.json(messages.map((m) => ({
            id: m.id,
            content: m.content,
            isFromDev: m.isFromDev,
            createdAt: m.createdAt.toISOString(),
        })));
    } catch {
        res.status(500).json({ error: 'Errore nel recupero dei messaggi.' });
    }
};
