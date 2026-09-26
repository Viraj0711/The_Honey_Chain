export const ACOUSTIC_BAND_COUNT = 5;

export const N_FEATURES = 5;
export const FFT_SIZE = 512;
export const SAMPLE_RATE = 16000;
export const BIN_WIDTH_HZ = SAMPLE_RATE / FFT_SIZE;

export const BAND_BINS: ReadonlyArray<readonly [number, number]> = [
  [3, 4],
  [5, 7],
  [8, 9],
  [10, 13],
  [14, 20],
];

export const bandBinRange = (index: number): readonly [number, number] => BAND_BINS[index] ?? BAND_BINS[0];

export const bandLowHz = (index: number): number => bandBinRange(index)[0] * BIN_WIDTH_HZ;
export const bandHighHz = (index: number): number => bandBinRange(index)[1] * BIN_WIDTH_HZ;

export type QueenVerdict = 'QUEEN_PRESENT' | 'QUEEN_ABSENT' | 'UNKNOWN';

export interface DeviceReading {
  temperature: number | null;
  humidity: number | null;
  dominant_freq_hz: number | null;
  prob_present: number | null;
  prob_absent: number | null;
  status: string;
  bands: number[];
  timestamp: number;
  hive_id: string;
  reading_id: string;
}

export interface NodeState {
  hive_id: string;
  online: boolean;
  last_seen: string;
  last_reading: DeviceReading | null;
  verdict: QueenVerdict;
  alert: boolean;
}

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const text = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() !== '' ? value : fallback;

export const queenVerdictOf = (probPresent: number | null, probAbsent: number | null): QueenVerdict => {
  if (probAbsent !== null && probAbsent > 0.5) return 'QUEEN_ABSENT';
  if (probPresent !== null && probPresent >= 0.5) return 'QUEEN_PRESENT';
  return 'UNKNOWN';
};

export const isAlertStatus = (status: string): boolean => status.trim().toUpperCase().startsWith('ALERT');

export const parseReading = (raw: unknown, hiveId: string, readingId: string): DeviceReading | null => {
  if (typeof raw !== 'object' || raw === null) return null;
  const source = raw as Record<string, unknown>;
  const bandsRaw = source.bands;
  const bands: number[] = [];
  if (typeof bandsRaw === 'object' && bandsRaw !== null) {
    const bandMap = bandsRaw as Record<string, unknown>;
    for (let i = 0; i < N_FEATURES; i += 1) {
      bands.push(num(bandMap[String(i)]) ?? 0);
    }
  } else {
    for (let i = 0; i < N_FEATURES; i += 1) bands.push(0);
  }
  const timestamp = num(source.timestamp) ?? Date.now();
  return {
    temperature: num(source.temperature),
    humidity: num(source.humidity),
    dominant_freq_hz: num(source.dominant_freq_hz),
    prob_present: num(source.prob_present),
    prob_absent: num(source.prob_absent),
    status: text(source.status, 'UNKNOWN'),
    bands,
    timestamp,
    hive_id: hiveId,
    reading_id: readingId,
  };
};
