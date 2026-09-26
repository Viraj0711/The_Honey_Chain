import { RTDB_PATHS } from '../firebase.js';
import { newId } from '../lib/ids.js';
import type { UserRecord } from '../types/records.js';
import { byNumberDesc, patchOne, readCollection, readOne, removeOne, writeOne } from './rt.js';

const PATH = RTDB_PATHS.users;

export const usersRepo = {
  async create(input: {
    name: string;
    phone: string;
    email: string | null;
    password_hash: string;
    role: UserRecord['role'];
    hive_ids: string[];
  }): Promise<UserRecord> {
    const record: UserRecord = { ...input, user_id: newId(), created_at: Date.now() };
    return writeOne(PATH, record.user_id, record);
  },

  findById: (id: string): Promise<UserRecord | null> => readOne<UserRecord>(`${PATH}/${id}`),

  async findByPhone(phone: string): Promise<UserRecord | null> {
    const all = await readCollection<UserRecord>(PATH);
    return all.find((user) => user.phone === phone) ?? null;
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const all = await readCollection<UserRecord>(PATH);
    return all.find((user) => user.email === email) ?? null;
  },

  async list(limit = 200): Promise<UserRecord[]> {
    const all = await readCollection<UserRecord>(PATH);
    return all.sort(byNumberDesc('created_at')).slice(0, limit);
  },

  update: (id: string, patch: Partial<UserRecord>): Promise<UserRecord | null> =>
    patchOne<UserRecord>(PATH, id, patch),

  remove: (id: string): Promise<void> => removeOne(PATH, id),
};
