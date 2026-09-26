export type Role = 'farmer' | 'admin' | 'lab';

export interface UserRecord {
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  password_hash: string;
  role: Role;
  hive_ids: string[];
  created_at: number;
}

export type OrientationStatus = 'STABLE' | 'TILT_ALERT' | 'MOTION_IMPULSE';

export interface HardwareBatchReport {
  report_id: string;
  batch_id: string;
  hive_id: string;
  captured_at: number;
  device_timestamp: number;
  temperature: number | null;
  humidity: number | null;
  dominant_freq_hz: number | null;
  prob_present: number | null;
  prob_absent: number | null;
  queen_verdict: 'QUEEN_PRESENT' | 'QUEEN_ABSENT' | 'UNKNOWN';
  status: string;
  bands: number[];
  signature: string | null;
  source_reading_id: string;
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
  hive_id: string | null;
  farmer_id: string;
  farmer_name: string;
  uploaded_at: number;
  document_uri: string;
  document_name: string;
  lab_parameters: LabParameters;
  lab_accreditation_hash: string;
  approved_by: string | null;
  approved_at: number | null;
}

export type PurityVerdict = 'PASSED' | 'FLAGGED' | 'REJECTED' | 'PARTIAL_PASSED';

export interface AiComparisonMetrics {
  data_consistency_score: number;
  purity_verdict: PurityVerdict;
  detected_discrepancies: string[];
}

export interface FinalVerifiedReport {
  final_report_id: string;
  batch_id: string;
  hive_id: string | null;
  model1_ref_id: string;
  model2_ref_id: string;
  synthesis_timestamp: number;
  ai_comparison_metrics: AiComparisonMetrics;
  summary_insights: string;
  qr_code_uri: string | null;
  qr_target_url: string | null;
  blockchain_tx_hash: string | null;
  token_id: string | null;
}

export type DagCheckStatus = 'PENDING' | 'CLEAN' | 'ANOMALY';

export interface DagEvidence {
  batch_id: string;
  dag_check_status: DagCheckStatus;
  anomalies: string[];
  checked_at: number;
}

export interface DeviceRegistryEntry {
  device_id: string;
  hive_id: string;
  public_key: string | null;
  registered_at: number;
  last_seen: number | null;
}
