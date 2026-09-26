import { RTDB_PATHS } from '../firebase.js';
import { newId } from '../lib/ids.js';
import { queenVerdictOf, type DeviceReading } from '../types/telemetry.js';
import type { HardwareBatchReport } from '../types/records.js';
import { byNumberDesc, patchOne, readCollection, readOne, removeOne, writeOne } from './rt.js';

const PATH = RTDB_PATHS.hardwareReports;

export const hardwareRepo = {
  async create(input: {
    batch_id: string;
    hive_id: string;
    reading: DeviceReading;
    signature: string | null;
  }): Promise<HardwareBatchReport> {
    const { reading } = input;
    const record: HardwareBatchReport = {
      report_id: newId(),
      batch_id: input.batch_id,
      hive_id: input.hive_id,
      captured_at: Date.now(),
      device_timestamp: reading.timestamp,
      temperature: reading.temperature,
      humidity: reading.humidity,
      dominant_freq_hz: reading.dominant_freq_hz,
      prob_present: reading.prob_present,
      prob_absent: reading.prob_absent,
      queen_verdict: queenVerdictOf(reading.prob_present, reading.prob_absent),
      status: reading.status,
      bands: reading.bands,
      signature: input.signature,
      source_reading_id: reading.reading_id,
    };
    return writeOne(PATH, record.report_id, record);
  },

  findById: (id: string): Promise<HardwareBatchReport | null> => readOne<HardwareBatchReport>(`${PATH}/${id}`),

  async findLatestForBatch(batchId: string): Promise<HardwareBatchReport | null> {
    const all = await hardwareRepo.listForBatch(batchId);
    return all[0] ?? null;
  },

  async listForBatch(batchId: string, limit = 200): Promise<HardwareBatchReport[]> {
    const all = await readCollection<HardwareBatchReport>(PATH);
    return all.filter((report) => report.batch_id === batchId).sort(byNumberDesc('captured_at')).slice(0, limit);
  },

  async listForHive(hiveId: string, limit = 200): Promise<HardwareBatchReport[]> {
    const all = await readCollection<HardwareBatchReport>(PATH);
    return all.filter((report) => report.hive_id === hiveId).sort(byNumberDesc('captured_at')).slice(0, limit);
  },

  async list(limit = 200): Promise<HardwareBatchReport[]> {
    const all = await readCollection<HardwareBatchReport>(PATH);
    return all.sort(byNumberDesc('captured_at')).slice(0, limit);
  },

  async countForBatch(batchId: string): Promise<number> {
    const all = await readCollection<HardwareBatchReport>(PATH);
    return all.filter((report) => report.batch_id === batchId).length;
  },

  update: (id: string, patch: Partial<HardwareBatchReport>): Promise<HardwareBatchReport | null> =>
    patchOne<HardwareBatchReport>(PATH, id, patch),

  remove: (id: string): Promise<void> => removeOne(PATH, id),
};
