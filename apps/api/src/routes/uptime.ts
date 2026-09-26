import { Router } from 'express';
import { reportBeekeeperUptime } from '../services/blockchain.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const uptimeRouter = Router();

uptimeRouter.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { beekeeper_address, seconds_online } = req.body ?? {};
  if (!beekeeper_address || typeof seconds_online !== 'number') {
    res.status(400).json({ error: 'beekeeper_address and seconds_online required' });
    return;
  }
  try {
    res.status(201).json(await reportBeekeeperUptime(beekeeper_address, seconds_online));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'uptime report failed' });
  }
});
