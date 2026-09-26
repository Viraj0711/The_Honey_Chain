export type AcousticState = 'BASELINE' | 'SWARMING' | 'QUEEN_DISTRESS';
export type OrientationStatus = 'STABLE' | 'TILT_ALERT' | 'MOTION_IMPULSE';
export type PurityVerdict = 'PASSED' | 'FLAGGED' | 'REJECTED' | 'PARTIAL_PASSED';

export interface TinyMLPredictions {
  acoustic_state: AcousticState;
  varroa_infestation_rate: number;
  brood_climate_score: number;
  orientation_status: OrientationStatus;
}

export interface HardwareBatchReport {
  report_id: string;
  batch_id: string;
  timestamp: string;
  device_id: string;
  signature: string;
  tinyml_predictions: TinyMLPredictions;
  tinyml_confidence: number;
}

export interface LabParameters {
  moisture_content: number;
  hmf_content: number;
  reducing_sugars: number;
  sucrose_content: number;
  c3_c4_syrups: number;
  smr_tmr_status: boolean;
  diastase_activity: number;
}

export interface FarmerLabReport {
  lab_report_id: string;
  batch_id: string;
  farmer_id: string;
  upload_timestamp: string;
  document_uri: string;
  lab_parameters: LabParameters;
  lab_accreditation_hash: string;
}

export interface AiComparisonMetrics {
  data_consistency_score: number;
  purity_verdict: PurityVerdict;
  detected_discrepancies: string[];
}

export interface FinalVerifiedReport {
  final_report_id: string;
  batch_id: string;
  model1_ref_id: string;
  model2_ref_id: string;
  synthesis_timestamp: string;
  ai_comparison_metrics: AiComparisonMetrics;
  summary_insights: string;
  qr_code_uri: string | null;
  blockchain_tx_hash: string | null;
}

export interface PassportPayload {
  final_verified_report: FinalVerifiedReport;
  hardware_batch_report: HardwareBatchReport | null;
  farmer_lab_report: FarmerLabReport | null;
}
