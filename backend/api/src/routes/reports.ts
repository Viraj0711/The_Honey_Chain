import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { batchIdSchema } from '../lib/schemas.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { finalRepo } from '../repos/final.js';
import { hardwareRepo } from '../repos/hardware.js';
import { labRepo } from '../repos/lab.js';
import { getDagStatus, runDagChecks } from '../services/dag.js';
import { renderQr } from '../services/qr.js';
import { synthesizeBatch } from '../services/synthesis.js';

export const reportRouter = Router();

reportRouter.get(
  '/',
  requireAuth,
  requireRole('admin', 'lab'),
  asyncHandler(async (_req, res) => {
    res.json({ reports: await finalRepo.list() });
  }),
);

reportRouter.get(
  '/:batchId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    const [final, hardware, lab, dag] = await Promise.all([
      finalRepo.findByBatch(batchId),
      hardwareRepo.listForBatch(batchId),
      labRepo.listForBatch(batchId),
      getDagStatus(batchId),
    ]);
    res.json({ batch_id: batchId, final, hardware, lab, dag });
  }),
);

reportRouter.post(
  '/:batchId/synthesize',
  requireAuth,
  requireRole('admin', 'lab'),
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    res.json({ report: await synthesizeBatch(batchId) });
  }),
);

reportRouter.post(
  '/:batchId/qr',
  requireAuth,
  requireRole('admin', 'lab'),
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    const existing = await finalRepo.findByBatch(batchId);
    if (!existing) throw new HttpError(404, `batch ${batchId} has no final report`);
    const qr = await renderQr(batchId);
    const updated = await finalRepo.update(existing.final_report_id, {
      qr_code_uri: qr.qr_code_uri,
      qr_target_url: qr.qr_target_url,
    });
    res.json({ report: updated });
  }),
);

reportRouter.post(
  '/:batchId/dag',
  requireAuth,
  requireRole('admin', 'lab'),
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    res.json({ dag: await runDagChecks(batchId) });
  }),
);
