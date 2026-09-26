import { RTDB_PATHS } from '../firebase.js';
import { newId } from '../lib/ids.js';
import type { AiComparisonMetrics, FinalVerifiedReport } from '../types/records.js';
import { byNumberDesc, patchOne, readCollection, readOne, writeOne } from './rt.js';

const PATH = RTDB_PATHS.finalReports;

export const finalRepo = {
  async upsert(input: {
    batch_id: string;
    hive_id: string | null;
    model1_ref_id: string;
    model2_ref_id: string;
    ai_comparison_metrics: AiComparisonMetrics;
    summary_insights: string;
    qr_code_uri: string | null;
    qr_target_url: string | null;
  }): Promise<FinalVerifiedReport> {
    const existing = await finalRepo.findByBatch(input.batch_id);
    const record: FinalVerifiedReport = {
      final_report_id: existing?.final_report_id ?? newId(),
      batch_id: input.batch_id,
      hive_id: input.hive_id,
      model1_ref_id: input.model1_ref_id,
      model2_ref_id: input.model2_ref_id,
      synthesis_timestamp: Date.now(),
      ai_comparison_metrics: input.ai_comparison_metrics,
      summary_insights: input.summary_insights,
      qr_code_uri: input.qr_code_uri,
      qr_target_url: input.qr_target_url,
      blockchain_tx_hash: existing?.blockchain_tx_hash ?? null,
      token_id: existing?.token_id ?? null,
    };
    return writeOne(PATH, record.final_report_id, record);
  },

  findById: (id: string): Promise<FinalVerifiedReport | null> => readOne<FinalVerifiedReport>(`${PATH}/${id}`),

  findByBatch: (batchId: string): Promise<FinalVerifiedReport | null> => {
    const needle = batchId.toLowerCase();
    return finalRepo.list(1000).then((all) => all.find((r) => r.batch_id.toLowerCase() === needle) ?? null);
  },

  async list(limit = 200): Promise<FinalVerifiedReport[]> {
    const all = await readCollection<FinalVerifiedReport>(PATH);
    return all.sort(byNumberDesc('synthesis_timestamp')).slice(0, limit);
  },

  update: (id: string, patch: Partial<FinalVerifiedReport>): Promise<FinalVerifiedReport | null> =>
    patchOne<FinalVerifiedReport>(PATH, id, patch),
};
