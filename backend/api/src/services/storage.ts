import { bucket } from '../firebase.js';

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg']);
export const MAX_LAB_REPORT_BYTES = 10 * 1024 * 1024;

const sanitize = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-120);

export interface StoredObject {
  document_uri: string;
  document_name: string;
  size: number;
  content_type: string;
}

export const uploadLabReport = async (
  batchId: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<StoredObject> => {
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw Object.assign(new Error(`unsupported content type: ${contentType}`), { status: 400 });
  }
  if (buffer.byteLength > MAX_LAB_REPORT_BYTES) {
    throw Object.assign(new Error('lab report exceeds 10 MB limit'), { status: 400 });
  }
  const objectName = `${sanitize(batchId)}/${Date.now()}-${sanitize(filename)}`;
  const file = bucket.file(objectName);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { metadata: { batchId } },
  });
  return {
    document_uri: `gs://${bucket.name}/${objectName}`,
    document_name: filename,
    size: buffer.byteLength,
    content_type: contentType,
  };
};

export const labReportDownloadUrl = async (documentUri: string, expiresMinutes = 15): Promise<string> => {
  const withoutScheme = documentUri.replace(/^gs:\/\//, '');
  const slash = withoutScheme.indexOf('/');
  if (slash === -1) {
    throw Object.assign(new Error('malformed document uri'), { status: 400 });
  }
  const objectName = withoutScheme.slice(slash + 1);
  const [file] = await bucket.file(objectName).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresMinutes * 60 * 1000,
  });
  return file;
};
