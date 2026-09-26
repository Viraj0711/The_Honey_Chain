import { RTDB_PATHS } from '../firebase.js';
import { byNumberDesc, patchOne, readCollection, readOne, writeOne } from './rt.js';
import type { DeviceRegistryEntry } from '../types/records.js';

const PATH = RTDB_PATHS.devices;

export const deviceRepo = {
  async upsert(input: {
    device_id: string;
    hive_id: string;
    public_key: string | null;
  }): Promise<DeviceRegistryEntry> {
    const record: DeviceRegistryEntry = {
      device_id: input.device_id,
      hive_id: input.hive_id,
      public_key: input.public_key,
      registered_at: Date.now(),
      last_seen: null,
    };
    return writeOne(PATH, record.device_id, record);
  },

  findById: (id: string): Promise<DeviceRegistryEntry | null> => readOne<DeviceRegistryEntry>(`${PATH}/${id}`),

  async list(limit = 200): Promise<DeviceRegistryEntry[]> {
    const all = await readCollection<DeviceRegistryEntry>(PATH);
    return all.sort(byNumberDesc('registered_at')).slice(0, limit);
  },

  touch: (id: string, lastSeen: number): Promise<DeviceRegistryEntry | null> =>
    patchOne<DeviceRegistryEntry>(PATH, id, { last_seen: lastSeen }),

  update: (id: string, patch: Partial<DeviceRegistryEntry>): Promise<DeviceRegistryEntry | null> =>
    patchOne<DeviceRegistryEntry>(PATH, id, patch),
};
