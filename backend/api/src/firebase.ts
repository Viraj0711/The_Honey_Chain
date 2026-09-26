import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';
import { config } from './config.js';

const app =
  getApps()[0] ??
  initializeApp({
    credential: config.firebase.serviceAccount ? cert(config.firebase.serviceAccount) : undefined,
    databaseURL: config.firebase.databaseURL,
    storageBucket: config.firebase.storageBucket,
    projectId: config.firebase.projectId,
  });

export const rtdb = getDatabase(app);
export const bucket = getStorage(app).bucket(config.firebase.storageBucket);

export const RTDB_PATHS = {
  deviceLatest: 'beehive/latest',
  deviceHistory: 'beehive/history',
  nodes: 'nodes',
  hardwareReports: 'hardware-reports',
  labReports: 'lab-reports',
  finalReports: 'final-reports',
  dagEvidence: 'dag-evidence',
  devices: 'devices',
  users: 'users',
} as const;
