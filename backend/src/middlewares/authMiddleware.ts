import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        res.status(401).json({ error: 'Accesso negato: token mancante.' });
        return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) {
            res.status(403).json({ error: 'Token non valido.' });
            return;
        }
        // Aggiungiamo l'utente alla richiesta così lo possiamo usare nei controller
        (req as any).user = user;
        next();
    });
};