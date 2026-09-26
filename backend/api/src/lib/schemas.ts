import { z } from 'zod';
import { N_FEATURES } from '../types/telemetry.js';

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10,15}$/, 'phone must be 10 to 15 digits');

export const passwordSchema = z.string().min(8, 'password must be at least 8 characters').max(128);

export const batchIdSchema = z
  .string()
  .trim()
  .min(3, 'batch id must be at least 3 characters')
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/, 'batch id may contain letters, digits, underscore and hyphen only');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  email: z.string().trim().email().max(120).nullish(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).nullable(),
  hive_ids: z.array(z.string().trim().min(1).max(64)).max(32),
});

export const labParametersSchema = z.object({
  moisture_content: z.number().min(0).max(100),
  hmf_content: z.number().min(0).max(1000),
  reducing_sugars: z.number().min(0).max(100),
  sucrose_content: z.number().min(0).max(100),
  c3_c4_syrups: z.number().min(0).max(100),
  smr_tmr_status: z.boolean(),
  diastase_activity: z.number().min(0).max(100),
});

export const bandsSchema = z.array(z.number().finite()).length(N_FEATURES);

export const captureSchema = z.object({
  signature: z.string().trim().max(512).nullish(),
  auto_synthesize: z.boolean().default(true),
});

export const registerDeviceSchema = z.object({
  device_id: z.string().trim().min(3).max(64),
  hive_id: z.string().trim().min(1).max(64),
  public_key: z.string().trim().min(16).max(512).nullish(),
});

export const signedPayloadSchema = z.object({
  payload: z.record(z.unknown()),
  device_id: z.string().trim().min(3).max(64),
  signature: z.string().min(8).max(2048),
});

export const uptimeReportSchema = z.object({
  beekeeper: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, 'beekeeper must be a 20 byte address'),
  seconds_online: z.number().int().min(0).max(10 * 365 * 24 * 60 * 60),
});
