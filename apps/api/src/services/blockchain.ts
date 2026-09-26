import { JsonRpcProvider, Wallet, Contract, id as keccakId } from 'ethers';
import { FinalVerifiedReport } from '../models/FinalVerifiedReport.js';

const RPC_URL = process.env.CHAIN_RPC_URL ?? 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = process.env.HONEY_BATCH_CONTRACT ?? '';
const ESCROW_ADDRESS = process.env.POLLINATION_ESCROW ?? '';
const RECONCILER_KEY = process.env.RECONCILER_PRIVATE_KEY ?? '';

const ABI = [
  'function logBatch(uint256 tokenId, address beekeeper, bytes32 hardwareReportHash)',
  'function attachLab(uint256 tokenId, bytes32 labReportHash)',
  'function synthesize(uint256 tokenId, bytes32 finalReportHash, bool mintApproved)',
  'function mint(uint256 tokenId, uint256 amount)',
  'function generatePassport(uint256 tokenId, string passportUri)',
  'function batches(uint256 tokenId) view returns (uint8 state, bytes32 reportHash, address beekeeper, uint64 loggedAt, bool mintApproved)',
  'function reportUptime(address beekeeper, uint256 secondsOnline)',
];

const provider = new JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true, cacheTimeout: -1 });
const signer = RECONCILER_KEY ? new Wallet(RECONCILER_KEY, provider) : null;

const getContract = (): Contract => {
  if (!signer || !CONTRACT_ADDRESS) throw new Error('blockchain not configured');
  return new Contract(CONTRACT_ADDRESS, ABI, signer);
};

const tokenIdFromBatch = (batchId: string): bigint => BigInt(keccakId(batchId)) >> 64n;

export const anchorBatch = async (batchId: string) => {
  const contract = getContract();
  const final = await FinalVerifiedReport.findOne({ batch_id: batchId });
  if (!final) throw new Error('final verified report not found');

  const verdict = final.ai_comparison_metrics.purity_verdict;
  const approved = verdict === 'PASSED' || verdict === 'PARTIAL_PASSED';
  const tokenId = tokenIdFromBatch(batchId);

  let nonce = await provider.getTransactionCount(signer!.address, 'pending');
  let lastHash = '';
  const push = async (method: string, ...args: unknown[]) => {
    const tx = await contract[method](...args, { nonce });
    const receipt = await tx.wait();
    lastHash = receipt.hash;
    nonce += 1;
  };

  const state = Number((await contract.batches(tokenId))[0]);
  if (state < 1) await push('logBatch', tokenId, signer!.address, keccakId(final.model1_ref_id));
  if (state < 2) await push('attachLab', tokenId, keccakId(final.model2_ref_id));
  if (state < 3) await push('synthesize', tokenId, keccakId(final.final_report_id), approved);
  if (approved && state < 4) await push('mint', tokenId, 500);
  if (approved && state < 5) await push('generatePassport', tokenId, `/passport/${batchId}`);

  const finalState = Number((await contract.batches(tokenId))[0]);
  if (finalState < 3 || (approved && finalState < 5)) throw new Error('anchoring failed');

  if (lastHash) final.blockchain_tx_hash = lastHash;
  await final.save();

  return { batch_id: batchId, token_id: tokenId.toString(), state: finalState, blockchain_tx_hash: final.blockchain_tx_hash };
};

export const reportBeekeeperUptime = async (beekeeperAddress: string, secondsOnline: number) => {
  if (!signer || !ESCROW_ADDRESS) throw new Error('blockchain not configured');
  const escrow = new Contract(ESCROW_ADDRESS, ABI, signer);
  const nonce = await provider.getTransactionCount(signer.address, 'pending');
  const tx = await escrow.reportUptime(beekeeperAddress, secondsOnline, { nonce });
  await tx.wait();
  return { beekeeper: beekeeperAddress, seconds_online: secondsOnline };
};
