import { RTDB_PATHS } from '../firebase.js';
import type { DagCheckStatus, DagEvidence } from '../types/records.js';
import { byNumberDesc, readCollection, readOne, writeOne } from './rt.js';

const PATH = RTDB_PATHS.dagEvidence;

export const dagRepo = {
  async put(input: {
    batch_id: string;
    dag_check_status: DagCheckStatus;
    anomalies: string[];
  }): Promise<DagEvidence> {
    const record: DagEvidence = { ...input, checked_at: Date.now() };
    return writeOne(PATH, input.batch_id, record);
  },

  findByBatch: (batchId: string): Promise<DagEvidence | null> => readOne<DagEvidence>(`${PATH}/${batchId}`),

  async list(limit = 200): Promise<DagEvidence[]> {
    const all = await readCollection<DagEvidence>(PATH);
    return all.sort(byNumberDesc('checked_at')).slice(0, limit);
  },
};
