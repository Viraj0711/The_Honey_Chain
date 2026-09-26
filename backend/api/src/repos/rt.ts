import { rtdb } from '../firebase.js';

export const entriesOf = <T>(value: unknown): T[] => {
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value as Record<string, T>);
};

export const collectionRef = (path: string) => rtdb.ref(path);

export const readCollection = async <T>(path: string): Promise<T[]> => {
  const snapshot = await rtdb.ref(path).get();
  return entriesOf<T>(snapshot.val());
};

export const readOne = async <T>(path: string): Promise<T | null> => {
  const snapshot = await rtdb.ref(path).get();
  if (!snapshot.exists()) return null;
  return snapshot.val() as T;
};

export const writeOne = async <T>(path: string, id: string, record: T): Promise<T> => {
  await rtdb.ref(`${path}/${id}`).set(record);
  return record;
};

export const patchOne = async <T>(path: string, id: string, patch: Partial<T>): Promise<T | null> => {
  const current = await readOne<T>(`${path}/${id}`);
  if (!current) return null;
  const next = { ...current, ...patch };
  await rtdb.ref(`${path}/${id}`).set(next);
  return next;
};

export const removeOne = async (path: string, id: string): Promise<void> => {
  await rtdb.ref(`${path}/${id}`).remove();
};

export const byNumberDesc = (key: string) => (a: unknown, b: unknown): number => {
  const left = (a as Record<string, number>)[key] ?? 0;
  const right = (b as Record<string, number>)[key] ?? 0;
  return right - left;
};
