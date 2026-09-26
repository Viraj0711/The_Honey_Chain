import { Router } from 'express';
import { DeviceRegistry } from '../models/DeviceRegistry.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const deviceRouter = Router();

deviceRouter.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { device_id, public_key } = req.body ?? {};
  if (!device_id || !public_key) {
    res.status(400).json({ error: 'device_id and public_key required' });
    return;
  }
  const device = await DeviceRegistry.findOneAndUpdate(
    { device_id },
    { device_id, public_key, registered_at: new Date() },
    { upsert: true, new: true },
  );
  res.status(201).json(device);
});

deviceRouter.get('/', requireAuth, requireRole('admin'), async (_req, res) => {
  res.json(await DeviceRegistry.find().lean());
});
