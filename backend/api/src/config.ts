import { config as loadEnv } from 'dotenv';

loadEnv();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : fallback;
};

const numeric = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`environment variable ${key} must be a number, received: ${raw}`);
  }
  return parsed;
};

const isEmulated = process.env.FIREBASE_EMULATOR_HOST !== undefined && process.env.FIREBASE_EMULATOR_HOST.trim() !== '';

const serviceAccount = () => {
  if (isEmulated) return undefined;
  return {
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  };
};

export const config = {
  env: optional('NODE_ENV', 'development'),
  port: numeric('PORT', 4000),
  isEmulated,
  jwt: {
    secret: optional('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: optional('JWT_EXPIRES_IN', '12h'),
  },
  firebase: {
    databaseURL: required('FIREBASE_DATABASE_URL'),
    projectId: optional('FIREBASE_PROJECT_ID', 'honeychain-3630b'),
    storageBucket: optional('FIREBASE_STORAGE_BUCKET', `${optional('FIREBASE_PROJECT_ID', 'honeychain-3630b')}.appspot.com`),
    serviceAccount: serviceAccount(),
  },
  web: {
    origin: optional('WEB_ORIGIN', 'http://localhost:5173'),
    publicOrigin: optional('PUBLIC_WEB_ORIGIN', optional('WEB_ORIGIN', 'http://localhost:5173')),
  },
  hive: {
    id: optional('HIVE_ID', 'NODE_01'),
    offlineAfterMs: numeric('NODE_OFFLINE_AFTER_MS', 30_000),
  },
  telemetry: {
    retentionDays: numeric('TELEMETRY_RETENTION_DAYS', 30),
  },
  chain: {
    rpcUrl: optional('CHAIN_RPC_URL', 'http://127.0.0.1:8545'),
    honeyBatchContract: optional('HONEY_BATCH_CONTRACT', ''),
    pollinationEscrow: optional('POLLINATION_ESCROW', ''),
    reconcilerPrivateKey: optional('RECONCILER_PRIVATE_KEY', ''),
  },
} as const;

export type AppConfig = typeof config;
