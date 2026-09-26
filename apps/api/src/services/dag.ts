import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';
import { DagEvidence, type DagCheckStatus } from '../models/DagEvidence.js';

export interface DagResult {
  dag_check_status: 'CLEAN' | 'ANOMALY';
  anomalies: string[];
}

const MAX_LAB_RECORDS_PER_BATCH = 50;

export const runDagChecks = async (batchId: string): Promise<DagResult> => {
  const anomalies: string[] = [];

  const duplicates = await FinalVerifiedReport.countDocuments({ batch_id: batchId });
  if (duplicates > 1) {
    anomalies.push('duplicate final verified report for batch id');
  }

  const anchoring = await FinalVerifiedReport.countDocuments({
    batch_id: batchId,
    blockchain_tx_hash: { $ne: null },
  });
  if (anchoring > 1) {
    anomalies.push('batch anchored to multiple blockchain transactions');
  }

  if (anomalies.length === 0) {
    anomalies.push(...(await FinalVerifiedReport.findOne({ batch_id: batchId }))?.ai_comparison_metrics.detected_discrepancies ?? []);
  }

  const status: DagCheckStatus = anomalies.length > 0 ? 'ANOMALY' : 'CLEAN';
  const evidence = await DagEvidence.findOneAndUpdate(
    { batch_id: batchId },
    { batch_id: batchId, dag_check_status: status, anomalies, checked_at: new Date() },
    { upsert: true, new: true },
  );
  void MAX_LAB_RECORDS_PER_BATCH;

  return { dag_check_status: evidence.dag_check_status as 'CLEAN' | 'ANOMALY', anomalies: evidence.anomalies };
};

export const getDagStatus = async (batchId: string) =>
  DagEvidence.findOne({ batch_id: batchId }).lean();
