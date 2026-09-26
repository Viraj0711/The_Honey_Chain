import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { batchIdSchema } from '../lib/schemas.js';
import { finalRepo } from '../repos/final.js';
import { hardwareRepo } from '../repos/hardware.js';
import { labRepo } from '../repos/lab.js';
import { getDagStatus } from '../services/dag.js';
import { passportOnChain, reportHash, tokenIdFor } from '../services/blockchain.js';

export const passportRouter = Router();

passportRouter.get(
  '/:batchId',
  asyncHandler(async (req, res) => {
    const batchId = batchIdSchema.parse(req.params.batchId);
    const final = await finalRepo.findByBatch(batchId);
    if (!final) throw new HttpError(404, `no passport published for batch ${batchId}`);

    const [hardware, lab, dag] = await Promise.all([
      hardwareRepo.findLatestForBatch(batchId),
      labRepo.findLatestForBatch(batchId),
      getDagStatus(batchId),
    ]);

    res.json({
      batch_id: final.batch_id,
      hive_id: final.hive_id,
      verdict: final.ai_comparison_metrics.purity_verdict,
      data_consistency_score: final.ai_comparison_metrics.data_consistency_score,
      detected_discrepancies: final.ai_comparison_metrics.detected_discrepancies,
      summary_insights: final.summary_insights,
      verified_at: new Date(final.synthesis_timestamp).toISOString(),
      qr_code_uri: final.qr_code_uri,
      qr_target_url: final.qr_target_url,
      blockchain_tx_hash: final.blockchain_tx_hash,
      token_id: final.token_id,
      on_chain: await passportOnChain(final.token_id ?? tokenIdFor(final.batch_id).toString()),
      hardware_evidence: hardware
        ? {
            captured_at: new Date(hardware.captured_at).toISOString(),
            temperature: hardware.temperature,
            humidity: hardware.humidity,
            dominant_freq_hz: hardware.dominant_freq_hz,
            queen_verdict: hardware.queen_verdict,
            prob_present: hardware.prob_present,
            prob_absent: hardware.prob_absent,
            status: hardware.status,
            evidence_hash: reportHash(hardware),
          }
        : null,
      laboratory_evidence: lab
        ? {
            lab_report_id: lab.lab_report_id,
            document_name: lab.document_name,
            document_uri: lab.document_uri,
            lab_parameters: lab.lab_parameters,
            lab_accreditation_hash: lab.lab_accreditation_hash,
            uploaded_at: new Date(lab.uploaded_at).toISOString(),
          }
        : null,
      dag,
    });
  }),
);
