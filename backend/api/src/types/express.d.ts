import type { TokenPayload } from '../middleware/auth.js';
import type { UserRecord } from './records.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      actor?: UserRecord;
    }
  }
}

export {};
