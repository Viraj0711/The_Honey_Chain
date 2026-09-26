import { HttpError } from '../lib/http.js';
import { finalRepo } from '../repos/final.js';
import { hardwareRepo } from '../repos/hardware.js';
import { labRepo } from '../repos/lab.js';
import { ensurePassportQr } from './blockchain.js';
import { decideVerdict } from './reconcile.js';
import { runDagChecks } from './dag.js';
import type { FinalVerifiedReport } from '../types/records.js';

export const synthesizeBatch = async (batchId: string): Promise<FinalVerifiedReport> => {
  const [hardware, lab] = await Promise.all([
    hardwareRepo.findLatestForBatch(batchId),
    labRepo.findLatestForBatch(batchId),
  ]);
  if (!hardware) {
    throw new HttpError(404, `no hardware telemetry captured for batch ${batchId}`);
  }
  if (!lab) {
    throw new HttpError(404, `no laboratory report attached to batch ${batchId}`);
  }

  const { verdict, discrepancies, score, summary } = decideVerdict({ hardware, lab });
  const existing = await finalRepo.findByBatch(batchId);
  const { qr_code_uri, qr_target_url } = await ensurePassportQr({
    final_report_id: existing?.final_report_id ?? '',
    batch_id: batchId,
    hive_id: hardware.hive_id,
    model1_ref_id: hardware.report_id,
    model2_ref_id: lab.lab_report_id,
    synthesis_timestamp: existing?.synthesis_timestamp ?? Date.now(),
    ai_comparison_metrics: existing?.ai_comparison_metrics ?? {
      data_consistency_score: 0,
      purity_verdict: verdict,
      detected_discrepancies: [],
    },
    summary_insights: existing?.summary_insights ?? '',
    qr_code_uri: existing?.qr_code_uri ?? null,
    qr_target_url: existing?.qr_target_url ?? null,
    blockchain_tx_hash: existing?.blockchain_tx_hash ?? null,
    token_id: existing?.token_id ?? null,
  });

  const report = await finalRepo.upsert({
    batch_id: batchId,
    hive_id: hardware.hive_id,
    model1_ref_id: hardware.report_id,
    model2_ref_id: lab.lab_report_id,
    ai_comparison_metrics: {
      data_consistency_score: score,
      purity_verdict: verdict,
      detected_discrepancies: discrepancies,
    },
    summary_insights: summary,
    qr_code_uri,
    qr_target_url,
  });

  await runDagChecks(batchId);
  return report;
};
