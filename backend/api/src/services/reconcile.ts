import { queenVerdictOf } from '../types/telemetry.js';
import type {
  FarmerLabReport,
  HardwareBatchReport,
  LabParameters,
  PurityVerdict,
} from '../types/records.js';

export const FSSAI_LIMITS = {
  moistureMax: 20.0,
  hmfMax: 40.0,
  reducingMin: 65.0,
  sucroseMax: 5.0,
  c3c4Max: 7.0,
  diastaseMin: 8.0,
} as const;

export const QUEEN_ABSENT_ALERT = 0.5;
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export const evaluateLabParameters = (p: LabParameters): string[] => {
  const violations: string[] = [];
  if (p.moisture_content > FSSAI_LIMITS.moistureMax) violations.push('moisture above 20.0%');
  if (p.hmf_content > FSSAI_LIMITS.hmfMax) violations.push('HMF above 40.0 mg/kg');
  if (p.reducing_sugars < FSSAI_LIMITS.reducingMin) violations.push('reducing sugars below 65.0%');
  if (p.sucrose_content > FSSAI_LIMITS.sucroseMax) violations.push('sucrose above 5.0%');
  if (p.c3_c4_syrups > FSSAI_LIMITS.c3c4Max) violations.push('C3/C4 syrups above 7.0%');
  if (!p.smr_tmr_status) violations.push('SMR/TMR marker positive');
  if (p.diastase_activity < FSSAI_LIMITS.diastaseMin) violations.push('diastase below 8.0 Schade');
  return violations;
};

export interface VerdictInput {
  hardware: HardwareBatchReport;
  lab: FarmerLabReport;
}

export interface VerdictOutput {
  verdict: PurityVerdict;
  discrepancies: string[];
  score: number;
  summary: string;
}

const pct = (value: number): string => `${(value * 100).toFixed(1)}%`;

export const decideVerdict = ({ hardware, lab }: VerdictInput): VerdictOutput => {
  const physicochemical = evaluateLabParameters(lab.lab_parameters);
  const queenAbsent =
    queenVerdictOf(hardware.prob_present, hardware.prob_absent) === 'QUEEN_ABSENT';
  const telemetryWeak = (hardware.prob_present ?? 0) + (hardware.prob_absent ?? 0) < LOW_CONFIDENCE_THRESHOLD;

  if (physicochemical.some((item) => item.includes('SMR/TMR'))) {
    const score = 0.2;
    return {
      verdict: 'REJECTED',
      discrepancies: physicochemical,
      score,
      summary: `Batch ${lab.batch_id} rejected outright. ${physicochemical.join('; ')}. Rice syrup marker is an automatic blacklist under FSSAI rules.`,
    };
  }

  if (physicochemical.length > 0) {
    const score = 0.3;
    return {
      verdict: 'REJECTED',
      discrepancies: physicochemical,
      score,
      summary: `Batch ${lab.batch_id} failed physicochemical compliance (${physicochemical.join('; ')}). Token minting is blocked.`,
    };
  }

  if (queenAbsent) {
    const score = 0.6;
    return {
      verdict: 'FLAGGED',
      discrepancies: [
        `hive acoustic model reports queen absent at ${pct(hardware.prob_absent ?? 0)} confidence`,
      ],
      score,
      summary: `Batch ${lab.batch_id} passed laboratory limits but hive ${hardware.hive_id} logged a queen-absent alert (${hardware.status}). Harvest volume is unverified until the colony is inspected.`,
    };
  }

  if (telemetryWeak) {
    const score = 0.75;
    return {
      verdict: 'PARTIAL_PASSED',
      discrepancies: ['edge model confidence too low to confirm colony state'],
      score,
      summary: `Batch ${lab.batch_id} passed laboratory limits. Hive ${hardware.hive_id} telemetry was captured with low model confidence, so the hardware leg of the verification is incomplete.`,
    };
  }

  const score = 0.95;
  return {
    verdict: 'PASSED',
    discrepancies: [],
    score,
    summary: `Batch ${lab.batch_id} passed with ${pct(score)} consistency. All FSSAI physicochemical parameters are within legal limits and hive ${hardware.hive_id} reported the queen present at ${pct(hardware.prob_present ?? 0)} confidence.`,
  };
};
