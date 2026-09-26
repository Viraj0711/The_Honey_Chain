import { createVerify } from 'node:crypto';
import { DeviceRegistry } from '../models/DeviceRegistry.js';

export interface SignedPayload {
  payload: Record<string, unknown>;
  device_id: string;
  signature: string;
}

export const verifyDeviceSignature = async (body: SignedPayload): Promise<boolean> => {
  const device = await DeviceRegistry.findOne({ device_id: body.device_id }).lean();
  if (!device) return false;
  const verifier = createVerify('SHA256');
  verifier.update(JSON.stringify(body.payload));
  verifier.end();
  try {
    return verifier.verify({ key: device.public_key, dsaEncoding: 'ieee-p1363' }, body.signature, 'base64');
  } catch {
    return false;
  }
};
