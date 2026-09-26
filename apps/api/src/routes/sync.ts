import { Router } from 'express';
import { HardwareBatchReport } from '../models/HardwareBatchReport.js';

export const syncRouter = Router();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

syncRouter.post('/telemetry', async (req, res) => {
  const { records } = req.body ?? {};
  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: 'records array required' });
    return;
  }
  const valid = records.filter(
    (r: { batch_id?: string; device_id?: string }) => r?.batch_id && r?.device_id,
  );
  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  for (const r of valid) {
    await HardwareBatchReport.findOneAndUpdate(
      { batch_id: r.batch_id, device_id: r.device_id, timestamp: r.timestamp ? new Date(r.timestamp) : new Date() },
      { $setOnInsert: { ...r, timestamp: r.timestamp ? new Date(r.timestamp) : new Date() } },
      { upsert: true },
    );
  }
  const purged = await HardwareBatchReport.deleteMany({ timestamp: { $lt: cutoff } });
  res.status(201).json({ accepted: valid.length, rejected: records.length - valid.length, purged: purged.deletedCount });
});
