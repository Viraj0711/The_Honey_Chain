import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { phone, password } = req.body as { phone?: string; password?: string };
  if (!phone || !password) {
    res.status(400).json({ error: 'phone and password required' });
    return;
  }
  const user = await User.findOne({ phone });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }
  res.json({
    token: signToken({ sub: user.user_id, role: user.role, name: user.name }),
    role: user.role,
    name: user.name,
  });
});
