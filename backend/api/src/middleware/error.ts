import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export const notFound: (req: Request, res: Response) => void = (req, res) => {
  res.status(404).json({ error: `no route for ${req.method} ${req.path}` });
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'validation failed', issues: err.issues });
    return;
  }
  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status;
    if (typeof status === 'number' && status >= 400 && status < 600) {
      res.status(status).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || 'internal error' });
    return;
  }
  res.status(500).json({ error: 'internal error' });
};
