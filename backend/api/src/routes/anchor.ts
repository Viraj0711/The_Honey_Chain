import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { batchIdSchema } from '../lib/schemas.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { finalRepo } from '../repos/final.js';
import { anchorFinalReport, chainConfigured } from '../services/blockchain.js';

export const anchorRouter = Router();

anchorRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    res.json({ configured: chainConfigured() });
  }),
);

anchorRouter.post(
  '/batches/:batchId',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    const report = await finalRepo.findByBatch(batchId);
    if (!report) throw new HttpError(404, `batch ${batchId} has no final report`);
    if (report.blockchain_tx_hash) {
      throw new HttpError(409, `batch ${batchId} is already anchored`);
    }
    const result = await anchorFinalReport(report);
    await finalRepo.update(report.final_report_id, {
      blockchain_tx_hash: result.tx_hash,
      token_id: result.token_id,
    });
    res.json({ anchor: result });
  }),
);
