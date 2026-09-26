import { Router } from 'express';
import { anchorBatch } from '../services/blockchain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const anchorRouter = Router();

anchorRouter.post('/:batchId', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const result = await anchorBatch(req.params.batchId);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'anchoring failed' });
  }
});
