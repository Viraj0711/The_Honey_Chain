import { Router } from 'express';
import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';
import QRCode from 'qrcode';

export const qrRouter = Router();

qrRouter.get('/:batchId', async (req, res) => {
  const { batchId } = req.params;
  const final = await FinalVerifiedReport.findOne({ batch_id: batchId }).lean();
  if (!final) {
    res.status(404).json({ error: 'passport not found' });
    return;
  }
  if (final.ai_comparison_metrics.purity_verdict !== 'PASSED' && final.ai_comparison_metrics.purity_verdict !== 'PARTIAL_PASSED') {
    res.status(403).json({ error: 'verdict does not allow passport qr' });
    return;
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  const target = `${origin}/passport/${batchId}`;
  const dataUrl = await QRCode.toDataURL(target, { width: 240, margin: 1 });
  res.json({ qr_code_uri: dataUrl, target });
});
