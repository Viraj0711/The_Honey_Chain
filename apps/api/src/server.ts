import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import { authRouter } from './routes/auth.js';
import { reportsRouter } from './routes/reports.js';
import { passportRouter } from './routes/passport.js';
import { qrRouter } from './routes/qr.js';
import { dagRouter } from './routes/dag.js';
import { deviceRouter } from './routes/devices.js';
import { syncRouter } from './routes/sync.js';
import { anchorRouter } from './routes/anchor.js';
import { uptimeRouter } from './routes/uptime.js';

const port = Number(process.env.PORT ?? 4000);
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/honeychain';

await mongoose.connect(uri);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

if (process.env.SEED_DEMO === '1') {
  const { seedDemo } = await import('./seedDemo.js');
  await seedDemo();
}

app.use('/api/auth', authRouter);
app.use('/api', reportsRouter);
app.use('/api/passport', passportRouter);
app.use('/api/qr', qrRouter);
app.use('/api/dag', dagRouter);
app.use('/api/devices', deviceRouter);
app.use('/api/sync', syncRouter);
app.use('/api/anchor', anchorRouter);
app.use('/api/uptime', uptimeRouter);

app.listen(port, () => {
  console.log(`api listening on ${port}`);
});
