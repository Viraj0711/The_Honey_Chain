import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler, HttpError } from '../lib/http.js';
import { loginSchema, profileSchema, registerSchema } from '../lib/schemas.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { usersRepo } from '../repos/users.js';
import type { UserRecord } from '../types/records.js';

const BCRYPT_ROUNDS = 10;

const publicUser = (user: UserRecord) => ({
  user_id: user.user_id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  role: user.role,
  hive_ids: user.hive_ids,
});

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    if (await usersRepo.findByPhone(input.phone)) {
      throw new HttpError(409, 'phone already registered');
    }
    if (input.email && (await usersRepo.findByEmail(input.email))) {
      throw new HttpError(409, 'email already registered');
    }
    const user = await usersRepo.create({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      password_hash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role: 'farmer',
      hive_ids: [],
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await usersRepo.findByPhone(input.phone);
    if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
      throw new HttpError(401, 'invalid phone or password');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await usersRepo.findById(req.user!.sub);
    if (!user) throw new HttpError(404, 'user no longer exists');
    res.json({ user: publicUser(user) });
  }),
);

authRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const updated = await usersRepo.update(req.user!.sub, input);
    if (!updated) throw new HttpError(404, 'user no longer exists');
    res.json({ user: publicUser(updated), token: signToken(updated) });
  }),
);
