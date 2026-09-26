import QRCode from 'qrcode';
import { config } from '../config.js';

export const passportPath = (batchId: string): string => `/passport/${encodeURIComponent(batchId)}`;

export const passportUrl = (batchId: string): string =>
  `${config.web.publicOrigin.replace(/\/+$/, '')}${passportPath(batchId)}`;

export interface QrPayload {
  qr_code_uri: string;
  qr_target_url: string;
}

export const renderQr = async (batchId: string): Promise<QrPayload> => {
  const qr_target_url = passportUrl(batchId);
  const qr_code_uri = await QRCode.toDataURL(qr_target_url, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
  return { qr_code_uri, qr_target_url };
};
