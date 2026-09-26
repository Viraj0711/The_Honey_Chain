import { Router } from 'express';
import { Contract, JsonRpcProvider, Wallet, isAddress } from 'ethers';
import { asyncHandler, HttpError } from '../lib/http.js';
import { config } from '../config.js';
import { uptimeReportSchema } from '../lib/schemas.js';
import { requireRole } from '../middleware/auth.js';
import { requireAuth } from '../middleware/auth.js';

const ESCROW_ABI = [
  'function uptimeSeconds(address beekeeper) view returns (uint256)',
  'function REQUIRED_UPTIME() view returns (uint256)',
  'function CREDIT_AMOUNT() view returns (uint256)',
  'function claimed(address beekeeper) view returns (bool)',
  'function escrowBalance() view returns (uint256)',
  'function reportUptime(address beekeeper,uint256 secondsOnline)',
] as const;

export const REQUIRED_UPTIME_SECONDS = 30 * 24 * 60 * 60;

const escrowConfigured = (): boolean =>
  config.chain.pollinationEscrow !== '' && config.chain.reconcilerPrivateKey !== '';

const requireEscrow = (): void => {
  if (!escrowConfigured()) {
    throw new HttpError(503, 'pollination escrow is not configured');
  }
};

const readContract = (): Contract => {
  const provider = new JsonRpcProvider(config.chain.rpcUrl);
  return new Contract(config.chain.pollinationEscrow, ESCROW_ABI, provider);
};

export const uptimeRouter = Router();

uptimeRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    if (!escrowConfigured()) {
      res.json({ configured: false, required_uptime_seconds: REQUIRED_UPTIME_SECONDS });
      return;
    }
    const contract = readContract();
    const [required, credit, balance] = await Promise.all([
      contract.REQUIRED_UPTIME(),
      contract.CREDIT_AMOUNT(),
      contract.escrowBalance(),
    ]);
    res.json({
      configured: true,
      required_uptime_seconds: Number(required),
      credit_wei: credit.toString(),
      escrow_balance_wei: balance.toString(),
    });
  }),
);

uptimeRouter.get(
  '/:beekeeper',
  asyncHandler(async (req, res) => {
    requireEscrow();
    const beekeeper = req.params.beekeeper;
    if (!isAddress(beekeeper)) {
      throw new HttpError(400, 'beekeeper must be a valid address');
    }
    const contract = readContract();
    const [seconds, claimed] = await Promise.all([
      contract.uptimeSeconds(beekeeper),
      contract.claimed(beekeeper),
    ]);
    const accrued = Number(seconds);
    res.json({
      beekeeper,
      uptime_seconds: accrued,
      required_uptime_seconds: REQUIRED_UPTIME_SECONDS,
      eligible: accrued >= REQUIRED_UPTIME_SECONDS,
      claimed,
    });
  }),
);

uptimeRouter.post(
  '/report',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    requireEscrow();
    const input = uptimeReportSchema.parse(req.body);
    const provider = new JsonRpcProvider(config.chain.rpcUrl);
    const wallet = new Wallet(config.chain.reconcilerPrivateKey, provider);
    const contract = new Contract(config.chain.pollinationEscrow, ESCROW_ABI, wallet);
    const tx = await contract.reportUptime(input.beekeeper, input.seconds_online);
    const receipt = await tx.wait();
    if (!receipt) throw new HttpError(502, 'uptime report produced no receipt');
    res.json({ tx_hash: receipt.hash, beekeeper: input.beekeeper, seconds_online: input.seconds_online });
  }),
);
