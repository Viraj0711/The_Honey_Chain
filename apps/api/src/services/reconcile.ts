import { randomUUID } from 'node:crypto';
import { HardwareBatchReport } from '../models/HardwareBatchReport.js';
import { FarmerLabReport } from '../models/FarmerLabReport.js';
import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';
import type { ILabParameters } from '../models/FarmerLabReport.js';
import type { PurityVerdict } from '../models/FinalVerifiedReport.js';

interface VerdictInput {
  hardware: Awaited<ReturnType<typeof HardwareBatchReport.findOne>> & {
    tinyml_predictions: {
      acoustic_state: 'BASELINE' | 'SWARMING' | 'QUEEN_DISTRESS';
      varroa_infestation_rate: number;
      brood_climate_score: number;
      orientation_status: string;
    };
    tinyml_confidence: number;
  };
  lab: Awaited<ReturnType<typeof FarmerLabReport.findOne>> & { lab_parameters: ILabParameters };
}

const FSSAI = {
  moistureMax: 20.0,
  hmfMax: 40.0,
  reducingMin: 65.0,
  sucroseMax: 5.0,
  c3c4Max: 7.0,
  diastaseMin: 8.0,
};

export const evaluateLabParameters = (p: ILabParameters): string[] => {
  const violations: string[] = [];
  if (p.moisture_content > FSSAI.moistureMax) violations.push('moisture above 20.0%');
  if (p.hmf_content > FSSAI.hmfMax) violations.push('HMF above 40.0 mg/kg');
  if (p.reducing_sugars < FSSAI.reducingMin) violations.push('reducing sugars below 65.0%');
  if (p.sucrose_content > FSSAI.sucroseMax) violations.push('sucrose above 5.0%');
  if (p.c3_c4_syrups > FSSAI.c3c4Max) violations.push('C3/C4 syrups above 7.0%');
  if (!p.smr_tmr_status) violations.push('SMR/TMR marker positive');
  if (p.diastase_activity < FSSAI.diastaseMin) violations.push('diastase below 8.0 Schade');
  return violations;
};

export const decideVerdict = ({ hardware, lab }: VerdictInput): { verdict: PurityVerdict; discrepancies: string[]; score: number } => {
  const discrepancies = evaluateLabParameters(lab.lab_parameters);
  if (discrepancies.some((d) => d.includes('SMR/TMR'))) {
    return { verdict: 'REJECTED', discrepancies, score: 0.2 };
  }
  if (discrepancies.length > 0) {
    return { verdict: 'REJECTED', discrepancies, score: 0.3 };
  }
  if (hardware.tinyml_predictions.acoustic_state === 'QUEEN_DISTRESS' || hardware.tinyml_predictions.acoustic_state === 'SWARMING') {
    return {
      verdict: 'FLAGGED',
      discrepancies: [`harvest volume inconsistent with hive state: ${hardware.tinyml_predictions.acoustic_state.toLowerCase()}`],
      score: 0.6,
    };
  }
  if (hardware.tinyml_confidence < 0.5) {
    return { verdict: 'PARTIAL_PASSED', discrepancies: ['low confidence hardware telemetry'], score: 0.75 };
  }
  return { verdict: 'PASSED', discrepancies: [], score: 0.95 };
};

const buildSummary = (batchId: string, verdict: PurityVerdict, score: number): string =>
  `Batch ${batchId} synthesized from hardware telemetry and lab report with ${(score * 100).toFixed(1)}% consistency. Verdict: ${verdict}.`;

export const reconcileBatch = async (batchId: string) => {
  const hardware = await HardwareBatchReport.findOne({ batch_id: batchId }).sort({ timestamp: -1 });
  const lab = await FarmerLabReport.findOne({ batch_id: batchId }).sort({ upload_timestamp: -1 });
  if (!hardware || !lab) return null;

  const { verdict, discrepancies, score } = decideVerdict({ hardware, lab });
  const existing = await FinalVerifiedReport.findOne({ batch_id: batchId });
  if (existing) return existing;

  return FinalVerifiedReport.create({
    final_report_id: randomUUID(),
    batch_id: batchId,
    model1_ref_id: hardware.report_id,
    model2_ref_id: lab.lab_report_id,
    synthesis_timestamp: new Date(),
    ai_comparison_metrics: {
      data_consistency_score: score,
      purity_verdict: verdict,
      detected_discrepancies: discrepancies,
    },
    summary_insights: buildSummary(batchId, verdict, score),
    qr_code_uri: `/passport/${batchId}`,
    blockchain_tx_hash: null,
  });
};
