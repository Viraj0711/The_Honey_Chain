import bcrypt from 'bcryptjs';
import { generateKeyPairSync, createSign, createVerify } from 'node:crypto';
import { User } from './models/User.js';
import { HardwareBatchReport } from './models/HardwareBatchReport.js';
import { FarmerLabReport } from './models/FarmerLabReport.js';
import { FinalVerifiedReport } from './models/FinalVerifiedReport.js';
import { DagEvidence } from './models/DagEvidence.js';
import { DeviceRegistry } from './models/DeviceRegistry.js';
import { runDagChecks } from './services/dag.js';
import { reconcileBatch } from './services/reconcile.js';

export const seedDemo = async (): Promise<{ verdict: string; dag: string }> => {
  await Promise.all([
    User.deleteMany({}),
    HardwareBatchReport.deleteMany({}),
    FarmerLabReport.deleteMany({}),
    FinalVerifiedReport.deleteMany({}),
    DagEvidence.deleteMany({}),
    DeviceRegistry.deleteMany({}),
  ]);

  const farmer = await User.create({
    name: 'Ramesh Beekeeper',
    phone: '9000000001',
    password_hash: await bcrypt.hash('farmer123', 10),
    role: 'farmer',
  });

  await User.create({
    name: 'Control Room Admin',
    phone: '9000000002',
    password_hash: await bcrypt.hash('admin123', 10),
    role: 'admin',
  });

  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'secp256k1' });
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

  await DeviceRegistry.create({
    device_id: 'ESP32-S3-0001',
    public_key: publicKeyPem,
    registered_at: new Date(),
  });

  const payload = {
    batch_id: 'HC-2026-8892',
    device_id: 'ESP32-S3-0001',
    tinyml_predictions: {
      acoustic_state: 'BASELINE',
      varroa_infestation_rate: 0.8,
      brood_climate_score: 0.93,
      orientation_status: 'STABLE',
    },
    tinyml_confidence: 0.94,
  };

  const signer = createSign('SHA256');
  signer.update(JSON.stringify(payload));
  const signature = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64');

  const verifier = createVerify('SHA256');
  verifier.update(JSON.stringify(payload));
  const oraclePass = verifier.verify({ key: publicKeyPem, dsaEncoding: 'ieee-p1363' }, signature, 'base64');

  await HardwareBatchReport.create({
    batch_id: payload.batch_id,
    timestamp: new Date(),
    device_id: payload.device_id,
    signature,
    tinyml_predictions: payload.tinyml_predictions,
    tinyml_confidence: payload.tinyml_confidence,
  });

  await FarmerLabReport.create({
    batch_id: 'HC-2026-8892',
    farmer_id: farmer.user_id,
    upload_timestamp: new Date(),
    document_uri: 'storage://lab-reports/HC-2026-8892.pdf',
    lab_parameters: {
      moisture_content: 17.2,
      hmf_content: 12.0,
      reducing_sugars: 71.5,
      sucrose_content: 3.1,
      c3_c4_syrups: 1.2,
      smr_tmr_status: true,
      diastase_activity: 10.4,
    },
    lab_accreditation_hash: 'a1b2c3d4e5f6',
  });

  const final = await reconcileBatch('HC-2026-8892');
  const dag = await runDagChecks('HC-2026-8892');

  console.log('signature oracle verification:', oraclePass ? 'PASS' : 'FAIL');
  console.log('seeded batch HC-2026-8892 verdict:', final?.ai_comparison_metrics.purity_verdict);
  console.log('dag check:', dag.dag_check_status);
  return { verdict: final?.ai_comparison_metrics.purity_verdict ?? 'NONE', dag: dag.dag_check_status };
};
