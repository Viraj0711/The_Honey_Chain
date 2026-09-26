import { Router } from 'express';
import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';
import { HardwareBatchReport } from '../models/HardwareBatchReport.js';
import { FarmerLabReport } from '../models/FarmerLabReport.js';

export const passportRouter = Router();

passportRouter.get('/:batchId', async (req, res) => {
  const { batchId } = req.params;
  const final = await FinalVerifiedReport.findOne({ batch_id: batchId }).lean();
  if (!final) {
    res.status(404).json({ error: 'passport not found' });
    return;
  }
  const hardware = await HardwareBatchReport.findOne({ report_id: final.model1_ref_id }).lean();
  const lab = await FarmerLabReport.findOne({ lab_report_id: final.model2_ref_id }).lean();
  res.json({
    final_verified_report: final,
    hardware_batch_report: hardware,
    farmer_lab_report: lab,
  });
});
