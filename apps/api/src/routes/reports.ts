import { Router } from 'express';
import { HardwareBatchReport } from '../models/HardwareBatchReport.js';
import { FarmerLabReport } from '../models/FarmerLabReport.js';
import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';
import { reconcileBatch } from '../services/reconcile.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const reportsRouter = Router();

reportsRouter.get('/hardware-reports', requireAuth, requireRole('farmer', 'admin'), async (_req, res) => {
  const reports = await HardwareBatchReport.find().sort({ timestamp: -1 }).limit(200).lean();
  res.json(reports);
});

reportsRouter.get('/lab-reports', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const query = req.user!.role === 'farmer' ? { farmer_id: req.user!.sub } : {};
  const reports = await FarmerLabReport.find(query).sort({ upload_timestamp: -1 }).limit(200).lean();
  res.json(reports);
});

reportsRouter.get('/final-reports', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const reports = await FinalVerifiedReport.find().sort({ synthesis_timestamp: -1 }).limit(200).lean();
  res.json(reports);
});

reportsRouter.post('/reconcile/:batchId', requireAuth, requireRole('admin'), async (req, res) => {
  const report = await reconcileBatch(req.params.batchId);
  if (!report) {
    res.status(404).json({ error: 'missing model1 or model2 report for batch' });
    return;
  }
  res.status(201).json(report);
});

reportsRouter.post('/telemetry', async (req, res) => {
  const { body } = req;
  if (!body?.batch_id || !body?.device_id || !body?.tinyml_predictions) {
    res.status(400).json({ error: 'batch_id, device_id, tinyml_predictions required' });
    return;
  }
  await HardwareBatchReport.create({
    batch_id: body.batch_id,
    timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    device_id: body.device_id,
    signature: body.signature ?? 'unsigned',
    tinyml_predictions: {
      acoustic_state: body.tinyml_predictions.acoustic_state,
      varroa_infestation_rate: body.tinyml_predictions.varroa_infestation_rate ?? 0,
      brood_climate_score: body.tinyml_predictions.brood_climate_score ?? 0.5,
      orientation_status: body.tinyml_predictions.orientation_status ?? 'STABLE',
    },
    tinyml_confidence: body.tinyml_confidence ?? 0.8,
  });
  res.status(201).json({ accepted: true });
});

reportsRouter.post('/lab-reports', requireAuth, requireRole('farmer', 'admin'), async (req, res) => {
  const { batch_id, document_uri, lab_parameters } = req.body ?? {};
  if (!batch_id || !document_uri || !lab_parameters) {
    res.status(400).json({ error: 'batch_id, document_uri, lab_parameters required' });
    return;
  }
  const required = [
    'moisture_content',
    'hmf_content',
    'reducing_sugars',
    'sucrose_content',
    'c3_c4_syrups',
    'diastase_activity',
  ] as const;
  const missing = required.some((k) => typeof lab_parameters[k] !== 'number') || typeof lab_parameters.smr_tmr_status !== 'boolean';
  if (missing) {
    res.status(400).json({ error: 'all lab parameters must be numeric and smr_tmr_status boolean' });
    return;
  }
  try {
    const report = await FarmerLabReport.create({
      batch_id,
      farmer_id: req.user!.sub,
      upload_timestamp: new Date(),
      document_uri,
      lab_parameters,
      lab_accreditation_hash: req.body.lab_accreditation_hash ?? 'pending',
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid lab report' });
  }
});
