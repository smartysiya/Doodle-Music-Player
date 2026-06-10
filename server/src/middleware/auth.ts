import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please login.' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'super-doodle-secret-key-12345';

  jwt.verify(token, secret, (err: any, userPayload: any) => {
    if (err) {
      res.status(403).json({ error: 'Token is invalid or has expired.' });
      return;
    }

    req.user = userPayload;
    next();
  });
};
