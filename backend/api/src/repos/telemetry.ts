import { RTDB_PATHS, rtdb } from '../firebase.js';
import { config } from '../config.js';
import {
  isAlertStatus,
  N_FEATURES,
  parseReading,
  queenVerdictOf,
  type DeviceReading,
  type NodeState,
} from '../types/telemetry.js';

const HISTORY_PATH = RTDB_PATHS.deviceHistory;
const LATEST_PATH = RTDB_PATHS.deviceLatest;
const NODES_PATH = RTDB_PATHS.nodes;

const historyLimit = (requested: number): number => Math.min(Math.max(1, Math.trunc(requested)), 2000);

export const latestReading = async (hiveId = config.hive.id): Promise<DeviceReading | null> => {
  const snapshot = await rtdb.ref(LATEST_PATH).get();
  if (!snapshot.exists()) return null;
  return parseReading(snapshot.val(), hiveId, LATEST_PATH);
};

export const historyReadings = async (
  limit = 200,
  hiveId = config.hive.id,
): Promise<DeviceReading[]> => {
  const snapshot = await rtdb.ref(HISTORY_PATH).limitToLast(historyLimit(limit)).get();
  const raw = (snapshot.val() ?? {}) as Record<string, unknown>;
  return Object.entries(raw)
    .map(([key, value]) => parseReading(value, hiveId, key))
    .filter((reading): reading is DeviceReading => reading !== null);
};

export const historyCount = async (): Promise<number> => {
  const snapshot = await rtdb.ref(HISTORY_PATH).limitToFirst(1).get();
  return snapshot.numChildren();
};

export const nodeState = async (hiveId = config.hive.id): Promise<NodeState> => {
  const reading = await latestReading(hiveId);
  const online = reading !== null && Date.now() - reading.timestamp <= config.hive.offlineAfterMs;
  const verdict = queenVerdictOf(reading?.prob_present ?? null, reading?.prob_absent ?? null);
  return {
    hive_id: hiveId,
    online,
    last_seen: reading ? new Date(reading.timestamp).toISOString() : new Date().toISOString(),
    last_reading: reading,
    verdict,
    alert: online && reading !== null && isAlertStatus(reading.status),
  };
};

export const bandProfile = (reading: DeviceReading | null) => {
  const bands = reading?.bands ?? new Array<number>(N_FEATURES).fill(0);
  const peak = bands.reduce((best, value, index) => (value > bands[best] ? index : best), 0);
  return {
    bands,
    peak_band_index: peak,
    peak_band_energy: bands[peak] ?? 0,
  };
};

export const touchNode = async (hiveId: string): Promise<void> => {
  await rtdb.ref(`${NODES_PATH}/${hiveId}`).update({
    hive_id: hiveId,
    last_seen: Date.now(),
  });
};

export const pruneHistoryBefore = async (cutoffMs: number): Promise<number> => {
  const snapshot = await rtdb.ref(HISTORY_PATH).get();
  const raw = (snapshot.val() ?? {}) as Record<string, { timestamp?: number }>;
  const stale = Object.entries(raw)
    .filter(([, value]) => typeof value.timestamp === 'number' && value.timestamp < cutoffMs)
    .map(([key]) => key);
  if (stale.length === 0) return 0;
  const updates: Record<string, null> = {};
  for (const key of stale) updates[key] = null;
  await rtdb.ref(HISTORY_PATH).update(updates);
  return stale.length;
};

export const retentionCutoff = (days: number): number => Date.now() - days * 24 * 60 * 60 * 1000;
