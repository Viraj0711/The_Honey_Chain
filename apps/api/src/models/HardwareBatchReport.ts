import { Schema, model } from 'mongoose';
import { randomUUID } from 'node:crypto';

export type AcousticState = 'BASELINE' | 'SWARMING' | 'QUEEN_DISTRESS';
export type OrientationStatus = 'STABLE' | 'TILT_ALERT' | 'MOTION_IMPULSE';

export interface ITinyMLPredictions {
  acoustic_state: AcousticState;
  varroa_infestation_rate: number;
  brood_climate_score: number;
  orientation_status: OrientationStatus;
}

export interface IHardwareBatchReport {
  report_id: string;
  batch_id: string;
  timestamp: Date;
  device_id: string;
  signature: string;
  tinyml_predictions: ITinyMLPredictions;
  tinyml_confidence: number;
}

const TinyMLPredictionsSchema = new Schema<ITinyMLPredictions>(
  {
    acoustic_state: { type: String, enum: ['BASELINE', 'SWARMING', 'QUEEN_DISTRESS'], required: true },
    varroa_infestation_rate: { type: Number, required: true, min: 0, max: 100 },
    brood_climate_score: { type: Number, required: true, min: 0, max: 1 },
    orientation_status: { type: String, enum: ['STABLE', 'TILT_ALERT', 'MOTION_IMPULSE'], required: true },
  },
  { _id: false },
);

const HardwareBatchReportSchema = new Schema<IHardwareBatchReport>(
  {
    report_id: { type: String, required: true, unique: true, default: () => randomUUID() },
    batch_id: { type: String, required: true },
    timestamp: { type: Date, required: true },
    device_id: { type: String, required: true },
    signature: { type: String, required: true },
    tinyml_predictions: { type: TinyMLPredictionsSchema, required: true },
    tinyml_confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { collection: 'hardware_batch_reports' },
);

HardwareBatchReportSchema.index({ batch_id: 1, timestamp: -1 });
HardwareBatchReportSchema.index({ device_id: 1, timestamp: -1 });

export const HardwareBatchReport = model<IHardwareBatchReport>('HardwareBatchReport', HardwareBatchReportSchema);
