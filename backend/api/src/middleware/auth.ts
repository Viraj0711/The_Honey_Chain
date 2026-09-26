import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';
import { usersRepo } from '../repos/users.js';
import type { Role, UserRecord } from '../types/records.js';

export interface TokenPayload {
  sub: string;
  role: Role;
  name: string;
  hive_ids: string[];
}

export const signToken = (user: UserRecord): string =>
  jwt.sign({ sub: user.user_id, role: user.role, name: user.name, hive_ids: user.hive_ids ?? [] }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  });

const extract = (header: string | undefined): string | null => {
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token === '' ? null : token;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = extract(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }
  try {
    req.user = jwt.verify(token, config.jwt.secret) as TokenPayload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
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

export const loadActor: RequestHandler = (req, res, next) => {
  if (!req.user) {
    next();
    return;
  }
  usersRepo
    .findById(req.user.sub)
    .then((user) => {
      if (user) req.actor = user;
      next();
    })
    .catch(next);
};

export const hiveScope = (req: { user?: TokenPayload }): string[] | null => {
  if (!req.user) return null;
  if (req.user.role === 'admin') return null;
  return req.user.hive_ids ?? [];
};
