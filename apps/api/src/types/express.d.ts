import type { TokenPayload } from '../middleware/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
