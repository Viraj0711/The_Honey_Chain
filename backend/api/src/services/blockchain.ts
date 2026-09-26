import { createHash } from 'node:crypto';
import { Contract, JsonRpcProvider, Wallet, ZeroAddress, id as keccakId } from 'ethers';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { QR_ELIGIBLE_VERDICTS } from './dag.js';
import { renderQr } from './qr.js';
import type { FinalVerifiedReport, PurityVerdict } from '../types/records.js';

const HONEY_BATCH_ABI = [
  'function reconcileFullLifecycle(uint256 tokenId,address beekeeper,bytes32 hardwareReportHash,bytes32 labReportHash,bytes32 finalReportHash,bool mintApproved,uint256 amount,string passportUri)',
  'function batches(uint256 tokenId) view returns (uint8 state,bytes32 reportHash,address beekeeper,uint64 loggedAt,bool mintApproved)',
  'function balanceOf(address account,uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
  'event PassportGenerated(uint256 indexed tokenId,string passportUri)',
  'event TokenMinted(uint256 indexed tokenId,bytes32 finalReportHash,uint256 amount)',
] as const;

const ESCROW_ABI = [
  'function uptimeSeconds(address beekeeper) view returns (uint256)',
  'function REQUIRED_UPTIME() view returns (uint256)',
  'function reportUptime(address beekeeper,uint256 secondsOnline)',
  'event UptimeReported(address indexed beekeeper,uint256 secondsOnline,uint256 totalUptime)',
] as const;

const REQUIRED_UPTIME_SECONDS = 30 * 24 * 60 * 60;
const QUEST_SPLIT_BPS = 7000;
const CHAIN_FEE_SHARE_BPS = 500;

export const reportHash = (value: unknown): string =>
  `0x${keccakId(JSON.stringify(value))}`;

export const tokenIdFor = (batchId: string): bigint =>
  BigInt(`0x${createHash('sha256').update(batchId).digest('hex').slice(0, 32)}`);

export const chainConfigured = (): boolean =>
  config.chain.honeyBatchContract !== '' && config.chain.reconcilerPrivateKey !== '';

export interface AnchorResult {
  tx_hash: string;
  token_id: string;
  contract: string;
}

export const anchorFinalReport = async (report: FinalVerifiedReport): Promise<AnchorResult> => {
  if (!chainConfigured()) {
    throw new HttpError(503, 'blockchain anchoring is not configured');
  }
  const verdict: PurityVerdict = report.ai_comparison_metrics.purity_verdict;
  if (!QR_ELIGIBLE_VERDICTS.has(verdict)) {
    throw new HttpError(409, `verdict ${verdict} is not eligible for anchoring`);
  }
  if (!report.qr_target_url) {
    throw new HttpError(409, 'passport QR has not been generated for this batch');
  }

  const provider = new JsonRpcProvider(config.chain.rpcUrl);
  const wallet = new Wallet(config.chain.reconcilerPrivateKey, provider);
  const contract = new Contract(config.chain.honeyBatchContract, HONEY_BATCH_ABI, wallet);
  const tokenId = tokenIdFor(report.batch_id);

  const hardwareHash = reportHash({ model1: report.model1_ref_id, batch: report.batch_id });
  const labHash = reportHash({ model2: report.model2_ref_id, batch: report.batch_id });
  const finalHash = reportHash({
    verdict,
    score: report.ai_comparison_metrics.data_consistency_score,
    discrepancies: report.ai_comparison_metrics.detected_discrepancies,
  });

  const beekeeper = wallet.address;
  const onChainAmount = BigInt(QUEST_SPLIT_BPS + CHAIN_FEE_SHARE_BPS) * 10n ** 12n;

  const tx = await contract.reconcileFullLifecycle(
    tokenId,
    beekeeper,
    hardwareHash,
    labHash,
    finalHash,
    verdict === 'PASSED',
    onChainAmount,
    report.qr_target_url,
  );
  const receipt = await tx.wait();
  if (!receipt) {
    throw new HttpError(502, 'anchoring transaction produced no receipt');
  }
  return {
    tx_hash: receipt.hash,
    token_id: tokenId.toString(),
    contract: config.chain.honeyBatchContract,
  };
};

export const passportOnChain = async (
  tokenId: string,
): Promise<{ state: number; beekeeper: string; uri: string; balance: string } | null> => {
  if (!chainConfigured()) return null;
  const provider = new JsonRpcProvider(config.chain.rpcUrl);
  const contract = new Contract(config.chain.honeyBatchContract, HONEY_BATCH_ABI, provider);
  const id = BigInt(tokenId);
  const [batch, balance, uri] = await Promise.all([
    contract.batches(id),
    contract.balanceOf(ZeroAddress, id).catch(() => 0n),
    contract.uri(id).catch(() => ''),
  ]);
  return {
    state: Number(batch[0]),
    beekeeper: batch[2] === ZeroAddress ? '' : batch[2],
    uri,
    balance: balance.toString(),
  };
};

export const ensurePassportQr = async (
  report: FinalVerifiedReport,
): Promise<{ qr_code_uri: string; qr_target_url: string }> => {
  if (report.qr_code_uri && report.qr_target_url) {
    return { qr_code_uri: report.qr_code_uri, qr_target_url: report.qr_target_url };
  }
  return renderQr(report.batch_id);
};
