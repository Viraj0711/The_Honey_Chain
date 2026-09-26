import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { registerDeviceSchema, signedPayloadSchema } from '../lib/schemas.js';
import { requireRole } from '../middleware/auth.js';
import { deviceRepo } from '../repos/devices.js';
import { hardwareRepo } from '../repos/hardware.js';
import { latestReading } from '../repos/telemetry.js';
import { verifyDeviceSignature } from '../services/verify.js';

export const deviceRouter = Router();

deviceRouter.get(
  '/',
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    res.json({ devices: await deviceRepo.list() });
  }),
);

deviceRouter.post(
  '/register',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const input = registerDeviceSchema.parse(req.body);
    res
      .status(201)
      .json({ device: await deviceRepo.upsert({ ...input, public_key: input.public_key ?? null }) });
  }),
);

deviceRouter.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const body = signedPayloadSchema.parse(req.body);
    const valid = await verifyDeviceSignature(body);
    if (!valid) throw new HttpError(401, 'device signature verification failed');
    const reading = await latestReading();
    if (!reading) throw new HttpError(503, 'device has not published telemetry yet');
    res.json({ verified: true, hive_id: reading.hive_id, timestamp: reading.timestamp });
  }),
);

deviceRouter.get(
  '/:deviceId/reports',
  asyncHandler(async (req, res) => {
    const device = await deviceRepo.findById(req.params.deviceId);
    if (!device) throw new HttpError(404, 'device not registered');
    res.json({ device, reports: await hardwareRepo.listForHive(device.hive_id) });
  }),
);
