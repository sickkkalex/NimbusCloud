import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendOtpEmail } from '../services/emailService';

const prisma = new PrismaClient();

const OTP_EXPIRY_MINUTES = 15;

const generateOtp = (): string =>
    crypto.randomInt(100000, 999999).toString();

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email e password obbligatorie.' });
            return;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ error: 'Email già registrata.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { email, password: hashedPassword },
        });

        res.status(201).json({ message: 'Utente registrato con successo.', userId: newUser.id });
    } catch {
        res.status(500).json({ error: 'Errore durante la registrazione.' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'Credenziali non valide.' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(400).json({ error: 'Credenziali non valide.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.json({ token, message: 'Login effettuato.' });
    } catch {
        res.status(500).json({ error: 'Errore durante il login.' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email obbligatoria.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.json({ message: 'Se l\'email esiste, riceverai un codice OTP.' });
            return;
        }

        const otp = generateOtp();
        const codeHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await prisma.passwordResetOtp.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
        });

        await prisma.passwordResetOtp.create({
            data: { userId: user.id, codeHash, expiresAt },
        });

        await sendOtpEmail(email, otp);

        res.json({ message: 'Se l\'email esiste, riceverai un codice OTP.' });
    } catch {
        res.status(500).json({ error: 'Errore nell\'invio del codice OTP.' });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ error: 'Email e OTP obbligatori.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'Codice OTP non valido.' });
            return;
        }

        const record = await prisma.passwordResetOtp.findFirst({
            where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            res.status(400).json({ error: 'Codice OTP scaduto o non valido.' });
            return;
        }

        const valid = await bcrypt.compare(otp, record.codeHash);
        if (!valid) {
            res.status(400).json({ error: 'Codice OTP non valido.' });
            return;
        }

        res.json({ message: 'OTP verificato.', resetToken: record.id });
    } catch {
        res.status(500).json({ error: 'Errore nella verifica OTP.' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp, newPassword, resetToken } = req.body;
        if (!email || !newPassword) {
            res.status(400).json({ error: 'Email e nuova password obbligatorie.' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ error: 'La password deve avere almeno 6 caratteri.' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ error: 'Richiesta non valida.' });
            return;
        }

        let record = resetToken
            ? await prisma.passwordResetOtp.findFirst({
                  where: { id: resetToken, userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
              })
            : null;

        if (!record && otp) {
            record = await prisma.passwordResetOtp.findFirst({
                where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
                orderBy: { createdAt: 'desc' },
            });
            if (record) {
                const valid = await bcrypt.compare(otp, record.codeHash);
                if (!valid) record = null;
            }
        }

        if (!record) {
            res.status(400).json({ error: 'Codice OTP scaduto o non valido.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
            prisma.passwordResetOtp.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        ]);

        res.json({ message: 'Password aggiornata con successo.' });
    } catch {
        res.status(500).json({ error: 'Errore nel reset della password.' });
    }
};
