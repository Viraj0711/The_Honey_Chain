import { createVerify } from 'node:crypto';
import { deviceRepo } from '../repos/devices.js';

export interface SignedPayload {
  payload: Record<string, unknown>;
  device_id: string;
  signature: string;
}

export const verifyDeviceSignature = async (body: SignedPayload): Promise<boolean> => {
  const device = await deviceRepo.findById(body.device_id);
  if (!device?.public_key) return false;
  const verifier = createVerify('SHA256');
  verifier.update(JSON.stringify(body.payload));
  verifier.end();
  try {
    return verifier.verify(
      { key: device.public_key, dsaEncoding: 'ieee-p1363' },
      body.signature,
      'base64',
    );
  } catch {
    return false;
  }
};
