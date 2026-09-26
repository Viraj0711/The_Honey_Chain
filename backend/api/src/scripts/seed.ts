import bcrypt from 'bcryptjs';
import { rtdb, RTDB_PATHS } from '../firebase.js';
import { config } from '../config.js';
import { labRepo } from '../repos/lab.js';
import { deviceRepo } from '../repos/devices.js';
import { usersRepo } from '../repos/users.js';
import { N_FEATURES } from '../types/telemetry.js';

const BATCH_ID = 'BATCH-2026-001';
const HIVE_ID = config.hive.id;

const log = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

const upsertUser = async (input: {
  name: string;
  phone: string;
  email: string | null;
  password: string;
  role: 'farmer' | 'admin' | 'lab';
  hive_ids: string[];
}): Promise<void> => {
  const existing = await usersRepo.findByPhone(input.phone);
  const password_hash = await bcrypt.hash(input.password, 10);
  if (existing) {
    await usersRepo.update(existing.user_id, {
      name: input.name,
      email: input.email,
      role: input.role,
      hive_ids: input.hive_ids,
      password_hash,
    });
    log(`user refreshed ${input.phone} (${input.role})`);
    return;
  }
  await usersRepo.create({ ...input, password_hash });
  log(`user created  ${input.phone} (${input.role})`);
};

const seedTelemetry = async (): Promise<void> => {
  const bands = [0.42, 0.71, 0.63, 0.28, 0.11];
  const now = Date.now();
  const history: Record<string, unknown> = {};
  for (let i = 0; i < 24; i += 1) {
    const timestamp = now - (24 - i) * 5_000;
    history[`seed-${timestamp}`] = {
      temperature: 34.2 + (i % 3) * 0.1,
      humidity: 58.4 + (i % 4) * 0.2,
      dominant_freq_hz: 218.75,
      prob_present: i === 17 ? 0.21 : 0.86,
      prob_absent: i === 17 ? 0.74 : 0.11,
      status: i === 17 ? 'ALERT: QUEEN ABSENT' : 'OK: QUEEN PRESENT',
      bands,
      timestamp,
    };
  }
  await rtdb.ref(RTDB_PATHS.deviceHistory).set(history);
  await rtdb.ref(RTDB_PATHS.deviceLatest).set(history[Object.keys(history).at(-1)!]);
  await rtdb.ref(`${RTDB_PATHS.nodes}/${HIVE_ID}`).set({
    hive_id: HIVE_ID,
    last_seen: now,
  });
  log(`telemetry seeded with ${Object.keys(history).length} history points and ${N_FEATURES} bands`);
};

const seedReports = async (): Promise<void> => {
  const passing = {
    batch_id: BATCH_ID,
    hive_id: HIVE_ID,
    document_uri: `gs://${config.firebase.storageBucket}/seed/${BATCH_ID}-lab.pdf`,
    document_name: `${BATCH_ID}-lab.pdf`,
    lab_parameters: {
      moisture_content: 17.4,
      hmf_content: 21.8,
      reducing_sugars: 72.5,
      sucrose_content: 2.1,
      c3_c4_syrups: 0.8,
      smr_tmr_status: false,
      diastase_activity: 12.6,
    },
    lab_accreditation_hash: 'seed-accreditation-hash-0001',
  };
  await labRepo.create({ ...passing, farmer_id: 'seed-farmer', farmer_name: 'Seed Farmer' });
  log(`lab report seeded for ${BATCH_ID}`);

  const flagged = {
    ...passing,
    batch_id: `${BATCH_ID}-FLAGGED`,
    lab_parameters: { ...passing.lab_parameters, moisture_content: 19.2 },
  };
  await labRepo.create({ ...flagged, farmer_id: 'seed-farmer', farmer_name: 'Seed Farmer' });
  log(`flagged lab report seeded for ${flagged.batch_id}`);
};

const run = async (): Promise<void> => {
  log(`seeding firebase project ${config.firebase.projectId} (emulator: ${config.isEmulated})`);
  await upsertUser({
    name: 'Field Admin',
    phone: '9000000001',
    email: 'admin@honeychain.local',
    password: 'HoneyAdmin123',
    role: 'admin',
    hive_ids: [HIVE_ID],
  });
  await upsertUser({
    name: 'Seed Farmer',
    phone: '9000000002',
    email: 'farmer@honeychain.local',
    password: 'HoneyFarmer123',
    role: 'farmer',
    hive_ids: [HIVE_ID],
  });
  await upsertUser({
    name: 'Seed Lab',
    phone: '9000000003',
    email: 'lab@honeychain.local',
    password: 'HoneyLab123',
    role: 'lab',
    hive_ids: [HIVE_ID],
  });
  await deviceRepo.upsert({ device_id: 'ESP32-NODE-01', hive_id: HIVE_ID, public_key: null });
  log('device ESP32-NODE-01 registered for hive ' + HIVE_ID);
  await seedTelemetry();
  await seedReports();
  log('seed complete');
};

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
