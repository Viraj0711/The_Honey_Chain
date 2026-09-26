import { Schema, model } from 'mongoose';
import { randomUUID } from 'node:crypto';

export interface ILabParameters {
  moisture_content: number;
  hmf_content: number;
  reducing_sugars: number;
  sucrose_content: number;
  c3_c4_syrups: number;
  smr_tmr_status: boolean;
  diastase_activity: number;
}

export interface IFarmerLabReport {
  lab_report_id: string;
  batch_id: string;
  farmer_id: string;
  upload_timestamp: Date;
  document_uri: string;
  lab_parameters: ILabParameters;
  lab_accreditation_hash: string;
}

const LabParametersSchema = new Schema<ILabParameters>(
  {
    moisture_content: { type: Number, required: true, min: 0, max: 100 },
    hmf_content: { type: Number, required: true, min: 0 },
    reducing_sugars: { type: Number, required: true, min: 0, max: 100 },
    sucrose_content: { type: Number, required: true, min: 0, max: 100 },
    c3_c4_syrups: { type: Number, required: true, min: 0, max: 100 },
    smr_tmr_status: { type: Boolean, required: true },
    diastase_activity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const FarmerLabReportSchema = new Schema<IFarmerLabReport>(
  {
    lab_report_id: { type: String, required: true, unique: true, default: () => randomUUID() },
    batch_id: { type: String, required: true },
    farmer_id: { type: String, required: true },
    upload_timestamp: { type: Date, required: true },
    document_uri: { type: String, required: true },
    lab_parameters: { type: LabParametersSchema, required: true },
    lab_accreditation_hash: { type: String, required: true },
  },
  { collection: 'farmer_lab_reports' },
);

FarmerLabReportSchema.index({ batch_id: 1 });
FarmerLabReportSchema.index({ farmer_id: 1, upload_timestamp: -1 });

export const FarmerLabReport = model<IFarmerLabReport>('FarmerLabReport', FarmerLabReportSchema);
