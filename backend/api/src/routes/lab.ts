import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, HttpError } from '../lib/http.js';
import { batchIdSchema, labParametersSchema } from '../lib/schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { labRepo } from '../repos/lab.js';
import { finalRepo } from '../repos/final.js';
import { synthesizeBatch } from '../services/synthesis.js';
import { labReportDownloadUrl, MAX_LAB_REPORT_BYTES, uploadLabReport } from '../services/storage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_LAB_REPORT_BYTES, files: 1 },
});

const parseLabParameters = (raw: unknown) => {
  let decoded = raw;
  if (typeof raw === 'string') {
    try {
      decoded = JSON.parse(raw);
    } catch {
      throw new HttpError(400, 'lab_parameters must be valid JSON');
    }
  }
  return labParametersSchema.parse(decoded);
};

export const labRouter = Router();

labRouter.post(
  '/reports',
  requireAuth,
  upload.single('document'),
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    const actor = req.actor;
    if (!actor) throw new HttpError(401, 'session user not found');

    const hiveId = typeof req.body.hive_id === 'string' ? req.body.hive_id.trim() : '';
    if (actor.role === 'farmer') {
      if (actor.hive_ids.length === 0) {
        throw new HttpError(403, 'farmers must be assigned to a hive before submitting reports');
      }
      if (hiveId !== '' && !actor.hive_ids.includes(hiveId)) {
        throw new HttpError(403, `no access to hive ${hiveId}`);
      }
    }
    if (!req.file) throw new HttpError(400, 'document file is required');

    const stored = await uploadLabReport(batchId, req.file.originalname, req.file.buffer, req.file.mimetype);
    const parameters = parseLabParameters(req.body.lab_parameters);

    const report = await labRepo.create({
      batch_id: batchId,
      hive_id: hiveId === '' ? null : hiveId,
      farmer_id: actor.user_id,
      farmer_name: actor.name,
      document_uri: stored.document_uri,
      document_name: stored.document_name,
      lab_parameters: parameters,
      lab_accreditation_hash: req.body.lab_accreditation_hash?.trim() ?? '',
    });

    if (req.body.synthesize !== 'false') {
      await synthesizeBatch(batchId);
    }
    res.status(201).json({ report, final: await finalRepo.findByBatch(batchId) });
  }),
);

labRouter.get(
  '/reports',
  requireAuth,
  asyncHandler(async (req, res) => {
    const farmerId = req.user!.role === 'farmer' ? req.user!.sub : undefined;
    res.json({ reports: await labRepo.list(200, farmerId) });
  }),
);

labRouter.get(
  '/reports/:reportId/document',
  requireAuth,
  asyncHandler(async (req, res) => {
    const report = await labRepo.findById(req.params.reportId);
    if (!report) throw new HttpError(404, 'lab report not found');
    res.json({ url: await labReportDownloadUrl(report.document_uri) });
  }),
);

labRouter.get(
  '/reports/by-batch/:batchId',
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    res.json({ batch_id: batchId, reports: await labRepo.listForBatch(batchId) });
  }),
);

labRouter.post(
  '/reports/:reportId/approve',
  requireAuth,
  asyncHandler(async (req, res) => {
    const actor = req.actor;
    if (actor?.role !== 'admin' && actor?.role !== 'lab') {
      throw new HttpError(403, 'only admins or lab partners may approve reports');
    }
    const report = await labRepo.findById(req.params.reportId);
    if (!report) throw new HttpError(404, 'lab report not found');
    if (!report.lab_accreditation_hash) {
      throw new HttpError(409, 'report is missing an accreditation hash and cannot be approved');
    }
    const approved = await labRepo.update(report.lab_report_id, {
      approved_by: actor.user_id,
      approved_at: Date.now(),
    });
    const final = await synthesizeBatch(report.batch_id);
    res.json({ report: approved, final });
  }),
);
