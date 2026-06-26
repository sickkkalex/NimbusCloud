import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth';
import { AVATAR_DIR } from '../config/avatarMulter';

const prisma = new PrismaClient();

const toProfile = (user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: Date | null;
    avatarPath: string | null;
    plan: string;
}) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    hasAvatar: Boolean(user.avatarPath),
    plan: user.plan,
});

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user) {
            res.status(404).json({ error: 'Utente non trovato.' });
            return;
        }
        res.json(toProfile(user));
    } catch {
        res.status(500).json({ error: 'Errore nel recupero del profilo.' });
    }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { firstName, lastName, dateOfBirth } = req.body;

        const data: {
            firstName?: string | null;
            lastName?: string | null;
            dateOfBirth?: Date | null;
        } = {};

        if (firstName !== undefined) data.firstName = firstName?.trim() || null;
        if (lastName !== undefined) data.lastName = lastName?.trim() || null;
        if (dateOfBirth !== undefined) {
            data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
        }

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data,
        });

        res.json(toProfile(user));
    } catch {
        res.status(500).json({ error: 'Errore nell\'aggiornamento del profilo.' });
    }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nessun file caricato.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (user?.avatarPath) {
            const oldPath = path.join(AVATAR_DIR, user.avatarPath);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const updated = await prisma.user.update({
            where: { id: req.user!.id },
            data: { avatarPath: req.file.filename },
        });

        res.json(toProfile(updated));
    } catch {
        res.status(500).json({ error: 'Errore nel caricamento dell\'avatar.' });
    }
};

export const getAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        let userId = req.user?.id;

        if (!userId && req.query.token && typeof req.query.token === 'string') {
            try {
                const jwt = await import('jsonwebtoken');
                const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET as string) as { id: string };
                userId = decoded.id;
            } catch {
                res.status(403).json({ error: 'Token non valido.' });
                return;
            }
        }

        if (!userId) {
            res.status(401).json({ error: 'Accesso negato.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.avatarPath) {
            res.status(404).json({ error: 'Avatar non impostato.' });
            return;
        }

        const filePath = path.join(AVATAR_DIR, user.avatarPath);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'File avatar non trovato.' });
            return;
        }

        res.sendFile(filePath);
    } catch {
        res.status(500).json({ error: 'Errore nel recupero dell\'avatar.' });
    }
};

export const upgradePlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { coupon } = req.body;
        if (coupon !== "NIMBUSCLOUDGRATIS") {
            res.status(400).json({ error: 'Coupon non valido.' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                plan: "PREMIUM",
                storageQuota: 53687091200 // 50 GB in bytes
            }
        });

        res.json({ message: 'Piano aggiornato con successo!', user: toProfile(user) });
    } catch {
        res.status(500).json({ error: 'Errore durante l\'aggiornamento del piano.' });
    }
};
