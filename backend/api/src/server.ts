import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { HttpError } from './lib/http.js';
import { loadActor, requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { telemetryRouter } from './routes/telemetry.js';
import { deviceRouter } from './routes/devices.js';
import { labRouter } from './routes/lab.js';
import { reportRouter } from './routes/reports.js';
import { passportRouter } from './routes/passport.js';
import { anchorRouter } from './routes/anchor.js';
import { uptimeRouter } from './routes/uptime.js';
import { historyCount, nodeState } from './repos/telemetry.js';
import { startRetentionSweeper, stopRetentionSweeper } from './services/retention.js';
import { chainConfigured } from './services/blockchain.js';

export const createApp = (): express.Express => {
  const app = express();

  app.use(cors({ origin: config.web.origin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(loadActor);

  app.get('/api/health', async (_req, res, next) => {
    try {
      const state = await nodeState();
      res.json({
        ok: true,
        env: config.env,
        emulator: config.isEmulated,
        chain_anchoring: chainConfigured(),
        hive: state,
        history_points: await historyCount(),
        uptime_seconds: process.uptime(),
      });
    } catch (error) {
      next(new HttpError(503, 'firebase unreachable'));
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/telemetry', telemetryRouter);
  app.use('/api/devices', deviceRouter);
  app.use('/api/lab', labRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/passport', passportRouter);
  app.use('/api/anchor', anchorRouter);
  app.use('/api/uptime', uptimeRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export const startServer = (): express.Express => {
  const app = createApp();
  startRetentionSweeper();
  app.listen(config.port, () => {
    process.stdout.write(
      `honeychain api listening on http://localhost:${config.port} (${config.env})\n`,
    );
  });
  return app;
};

const isEntrypoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  startServer();
  process.on('SIGINT', () => {
    stopRetentionSweeper();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopRetentionSweeper();
    process.exit(0);
  });
}
