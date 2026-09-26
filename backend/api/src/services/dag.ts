import { dagRepo } from '../repos/dag.js';
import { finalRepo } from '../repos/final.js';
import { hardwareRepo } from '../repos/hardware.js';
import { labRepo } from '../repos/lab.js';
import type { DagCheckStatus } from '../types/records.js';

export interface DagResult {
  batch_id: string;
  dag_check_status: DagCheckStatus;
  anomalies: string[];
  checked_at: number;
}

export const QR_ELIGIBLE_VERDICTS = new Set(['PASSED', 'PARTIAL_PASSED']);

export const runDagChecks = async (batchId: string): Promise<DagResult> => {
  const anomalies: string[] = [];

  const hardwareCount = await hardwareRepo.countForBatch(batchId);
  if (hardwareCount === 0) {
    anomalies.push('no hardware telemetry captured for batch');
  }

  const labCount = (await labRepo.listForBatch(batchId)).length;
  if (labCount === 0) {
    anomalies.push('no laboratory report attached to batch');
  }
  if (labCount > 1) {
    anomalies.push(`multiple laboratory reports attached (${labCount})`);
  }

  const duplicateFinals = (await finalRepo.list(1000)).filter(
    (report) => report.batch_id.toLowerCase() === batchId.toLowerCase(),
  );
  if (duplicateFinals.length > 1) {
    anomalies.push('duplicate final verified report for batch id');
  }

  const anchored = duplicateFinals.filter((report) => report.blockchain_tx_hash !== null);
  if (anchored.length > 1) {
    anomalies.push('batch anchored to multiple blockchain transactions');
  }

  const existing = duplicateFinals[0];
  if (existing) {
    for (const discrepancy of existing.ai_comparison_metrics.detected_discrepancies) {
      anomalies.push(`model3 discrepancy: ${discrepancy}`);
    }
  }

  const dag_check_status: DagCheckStatus = anomalies.length === 0 ? 'CLEAN' : 'ANOMALY';
  const record = await dagRepo.put({ batch_id: batchId, dag_check_status, anomalies });
  return {
    batch_id: record.batch_id,
    dag_check_status: record.dag_check_status,
    anomalies: record.anomalies,
    checked_at: record.checked_at,
  };
};

export const getDagStatus = (batchId: string) => dagRepo.findByBatch(batchId);
