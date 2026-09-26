import { z } from 'zod';
import { captureBatch } from '../services/capture.js';
import { nodeState } from '../repos/telemetry.js';

const options = z
  .object({
    batchId: z.string().trim().min(3).max(64),
    signature: z.string().trim().max(512).nullish(),
    autoSynthesize: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
  })
  .parse({
    batchId: process.env.BATCH_ID ?? process.argv[2],
    signature: process.argv[3],
    autoSynthesize: process.argv[4],
  });

const run = async (): Promise<void> => {
  const state = await nodeState();
  if (!state.online) {
    process.stderr.write(
      `hive ${options.batchId} telemetry is stale; last reading at ${state.last_seen}\n`,
    );
  }
  const report = await captureBatch(options.batchId, options.signature ?? null, options.autoSynthesize);
  process.stdout.write(
    `captured ${report.report_id} for ${report.batch_id} from ${report.hive_id}: verdict=${report.queen_verdict} status=${report.status}\n`,
  );
};

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
