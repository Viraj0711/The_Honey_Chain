import { RTDB_PATHS } from '../firebase.js';
import { newId } from '../lib/ids.js';
import type { FarmerLabReport, LabParameters } from '../types/records.js';
import { byNumberDesc, patchOne, readCollection, readOne, removeOne, writeOne } from './rt.js';

const PATH = RTDB_PATHS.labReports;

export const labRepo = {
  async create(input: {
    batch_id: string;
    hive_id: string | null;
    farmer_id: string;
    farmer_name: string;
    document_uri: string;
    document_name: string;
    lab_parameters: LabParameters;
    lab_accreditation_hash: string;
  }): Promise<FarmerLabReport> {
    const record: FarmerLabReport = {
      ...input,
      lab_report_id: newId(),
      uploaded_at: Date.now(),
      approved_by: null,
      approved_at: null,
    };
    return writeOne(PATH, record.lab_report_id, record);
  },

  findById: (id: string): Promise<FarmerLabReport | null> => readOne<FarmerLabReport>(`${PATH}/${id}`),

  async findLatestForBatch(batchId: string): Promise<FarmerLabReport | null> {
    const all = await labRepo.listForBatch(batchId);
    return all[0] ?? null;
  },

  async listForBatch(batchId: string, limit = 200): Promise<FarmerLabReport[]> {
    const all = await readCollection<FarmerLabReport>(PATH);
    return all.filter((report) => report.batch_id === batchId).sort(byNumberDesc('uploaded_at')).slice(0, limit);
  },

  async list(limit = 200, farmerId?: string): Promise<FarmerLabReport[]> {
    const all = await readCollection<FarmerLabReport>(PATH);
    const scoped = farmerId ? all.filter((report) => report.farmer_id === farmerId) : all;
    return scoped.sort(byNumberDesc('uploaded_at')).slice(0, limit);
  },

  async distinctBatchIds(): Promise<string[]> {
    const all = await readCollection<FarmerLabReport>(PATH);
    return [...new Set(all.map((report) => report.batch_id))];
  },

  update: (id: string, patch: Partial<FarmerLabReport>): Promise<FarmerLabReport | null> =>
    patchOne<FarmerLabReport>(PATH, id, patch),

  remove: (id: string): Promise<void> => removeOne(PATH, id),
};
