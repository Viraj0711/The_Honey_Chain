import { Schema, model } from 'mongoose';

export interface IDeviceRegistry {
  device_id: string;
  public_key: string;
  registered_at: Date;
}

const DeviceRegistrySchema = new Schema<IDeviceRegistry>({
  device_id: { type: String, required: true, unique: true },
  public_key: { type: String, required: true },
  registered_at: { type: Date, required: true, default: () => new Date() },
});

export const DeviceRegistry = model<IDeviceRegistry>('DeviceRegistry', DeviceRegistrySchema, 'device_registry');
