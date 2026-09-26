import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../lib/http.js';
import { captureSchema } from '../lib/schemas.js';
import { bandProfile, historyReadings, latestReading, nodeState } from '../repos/telemetry.js';
import { captureBatch } from '../services/capture.js';
import { config } from '../config.js';
import { isAlertStatus } from '../types/telemetry.js';
import { hiveScope, requireAuth } from '../middleware/auth.js';

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(2000).default(200),
});

const assertHiveAccess = (req: { user?: { hive_ids?: string[] } }, hiveId: string): void => {
  const scope = hiveScope(req as never);
  if (scope && !scope.includes(hiveId)) {
    throw new HttpError(403, `no access to hive ${hiveId}`);
  }
};

export const telemetryRouter = Router();

telemetryRouter.get(
  '/latest',
  asyncHandler(async (req, res) => {
    const reading = await latestReading();
    if (!reading) throw new HttpError(503, 'device has not published telemetry yet');
    res.json({ hive_id: reading.hive_id, reading, bands: bandProfile(reading) });
  }),
);

telemetryRouter.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { limit } = historyQuerySchema.parse(req.query);
    const readings = await historyReadings(limit);
    assertHiveAccess(req, config.hive.id);
    res.json({ hive_id: config.hive.id, count: readings.length, readings });
  }),
);

telemetryRouter.get(
  '/state',
  asyncHandler(async (_req, res) => {
    res.json(await nodeState());
  }),
);

telemetryRouter.post(
  '/batches/:batchId/capture',
  requireAuth,
  asyncHandler(async (req, res) => {
    const batchId = req.params.batchId;
    assertHiveAccess(req, config.hive.id);
    const input = captureSchema.parse(req.body ?? {});
    const report = await captureBatch(batchId, input.signature ?? null, input.auto_synthesize);
    res.status(201).json({ report });
  }),
);

telemetryRouter.get(
  '/alerts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { limit } = historyQuerySchema.parse(req.query);
    const readings = await historyReadings(limit);
    res.json({ alerts: readings.filter((reading) => isAlertStatus(reading.status)) });
  }),
);
