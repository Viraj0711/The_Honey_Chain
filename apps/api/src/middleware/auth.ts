import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  role: 'farmer' | 'admin';
  name: string;
}

const secret = process.env.JWT_SECRET ?? 'dev-secret';

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, secret, { expiresIn: '12h' });

const extract = (header: string | undefined): string | null => {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = extract(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    req.user = jwt.verify(token, secret) as TokenPayload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
};

export const requireRole =
  (...roles: TokenPayload['role'][]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'missing token' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
