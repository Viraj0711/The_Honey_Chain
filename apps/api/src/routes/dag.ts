import { Router } from 'express';
import { getDagStatus, runDagChecks } from '../services/dag.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const dagRouter = Router();

dagRouter.get('/:batchId', requireAuth, requireRole('admin'), async (req, res) => {
  const status = await getDagStatus(req.params.batchId);
  if (!status) {
    res.status(404).json({ error: 'no dag evidence for batch' });
    return;
  }
  res.json(status);
});

dagRouter.post('/:batchId/evaluate', requireAuth, requireRole('admin'), async (req, res) => {
  res.json(await runDagChecks(req.params.batchId));
});
