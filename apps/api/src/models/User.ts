import { Schema, model } from 'mongoose';
import { randomUUID } from 'node:crypto';

export type Role = 'farmer' | 'admin';

export interface IUser {
  user_id: string;
  name: string;
  phone: string;
  password_hash: string;
  role: Role;
}

const UserSchema = new Schema<IUser>({
  user_id: { type: String, required: true, unique: true, default: () => randomUUID() },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'admin'], required: true },
});

export const User = model<IUser>('User', UserSchema);
