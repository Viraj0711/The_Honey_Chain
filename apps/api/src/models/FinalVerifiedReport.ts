import { Schema, model } from 'mongoose';
import { randomUUID } from 'node:crypto';

export type PurityVerdict = 'PASSED' | 'FLAGGED' | 'REJECTED' | 'PARTIAL_PASSED';

export interface IAiComparisonMetrics {
  data_consistency_score: number;
  purity_verdict: PurityVerdict;
  detected_discrepancies: string[];
}

export interface IFinalVerifiedReport {
  final_report_id: string;
  batch_id: string;
  model1_ref_id: string;
  model2_ref_id: string;
  synthesis_timestamp: Date;
  ai_comparison_metrics: IAiComparisonMetrics;
  summary_insights: string;
  qr_code_uri: string | null;
  blockchain_tx_hash: string | null;
}

const AiComparisonMetricsSchema = new Schema<IAiComparisonMetrics>(
  {
    data_consistency_score: { type: Number, required: true, min: 0, max: 1 },
    purity_verdict: { type: String, enum: ['PASSED', 'FLAGGED', 'REJECTED', 'PARTIAL_PASSED'], required: true },
    detected_discrepancies: { type: [String], default: [] },
  },
  { _id: false },
);

const FinalVerifiedReportSchema = new Schema<IFinalVerifiedReport>(
  {
    final_report_id: { type: String, required: true, unique: true, default: () => randomUUID() },
    batch_id: { type: String, required: true, unique: true },
    model1_ref_id: { type: String, required: true },
    model2_ref_id: { type: String, required: true },
    synthesis_timestamp: { type: Date, required: true },
    ai_comparison_metrics: { type: AiComparisonMetricsSchema, required: true },
    summary_insights: { type: String, required: true },
    qr_code_uri: { type: String, default: null },
    blockchain_tx_hash: { type: String, default: null },
  },
  { collection: 'final_verified_reports' },
);

export const FinalVerifiedReport = model<IFinalVerifiedReport>('FinalVerifiedReport', FinalVerifiedReportSchema);
