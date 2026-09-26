import { HttpError } from '../lib/http.js';
import { hardwareRepo } from '../repos/hardware.js';
import { latestReading, touchNode } from '../repos/telemetry.js';
import { finalRepo } from '../repos/final.js';
import { labRepo } from '../repos/lab.js';
import { synthesizeBatch } from './synthesis.js';
import type { HardwareBatchReport } from '../types/records.js';

const captureAllowed = (awaitedReports: number): void => {
  if (awaitedReports >= 4) {
    throw new HttpError(409, 'maximum Model 1 samples per batch already reached (4)');
  }
};

export const captureBatch = async (
  batchId: string,
  signature: string | null = null,
  autoSynthesize = true,
): Promise<HardwareBatchReport> => {
  const reading = await latestReading();
  if (!reading) {
    throw new HttpError(503, 'device has not published telemetry yet');
  }
  const existing = await hardwareRepo.countForBatch(batchId);
  captureAllowed(existing);

  const report = await hardwareRepo.create({
    batch_id: batchId,
    hive_id: reading.hive_id,
    reading,
    signature,
  });
  await touchNode(reading.hive_id);

  if (autoSynthesize) {
    const labReady = (await labRepo.listForBatch(batchId)).length > 0;
    const alreadySynthesized = (await finalRepo.findByBatch(batchId)) !== null;
    if (labReady && !alreadySynthesized) {
      await synthesizeBatch(batchId);
    }
  }
  return report;
};
