import { config } from '../config.js';
import { historyCount, pruneHistoryBefore, retentionCutoff } from '../repos/telemetry.js';

export const RETENTION_SWEEP_MS = 60 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

export const sweepTelemetryRetention = async (): Promise<{ removed: number; remaining: number }> => {
  const removed = await pruneHistoryBefore(retentionCutoff(config.telemetry.retentionDays));
  const remaining = await historyCount();
  return { removed, remaining };
};

export const startRetentionSweeper = (): void => {
  if (timer) return;
  sweepTelemetryRetention().catch(() => undefined);
  timer = setInterval(() => {
    sweepTelemetryRetention().catch(() => undefined);
  }, RETENTION_SWEEP_MS);
  timer.unref();
};

export const stopRetentionSweeper = (): void => {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
};
