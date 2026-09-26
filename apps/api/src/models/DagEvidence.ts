import { Schema, model } from 'mongoose';

export type DagCheckStatus = 'PENDING' | 'CLEAN' | 'ANOMALY';

export interface IDagEvidence {
  batch_id: string;
  dag_check_status: DagCheckStatus;
  anomalies: string[];
  checked_at: Date;
}

const DagEvidenceSchema = new Schema<IDagEvidence>({
  batch_id: { type: String, required: true, unique: true },
  dag_check_status: { type: String, enum: ['PENDING', 'CLEAN', 'ANOMALY'], required: true },
  anomalies: { type: [String], default: [] },
  checked_at: { type: Date, required: true },
});

export const DagEvidence = model<IDagEvidence>('DagEvidence', DagEvidenceSchema, 'dag_evidence');
