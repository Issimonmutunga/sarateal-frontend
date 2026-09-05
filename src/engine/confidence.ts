import { clamp, mean, recencyMultiplier } from "./math";

const MIN_POINTS = 3;
const TARGET_POINTS = 15;

export interface EvidenceRecord {
  id?: number;
  createdAt: string;
  observedOn?: string;
  quantity?: number;
  price?: number;
  county: string;
  marketName?: string | null;
  contributor: string;
}

function isPlausible(record: EvidenceRecord): boolean {
  if (record.price !== undefined && (!Number.isFinite(record.price) || record.price <= 0 || record.price > 10_000_000)) {
    return false;
  }

  if (record.quantity !== undefined && (!Number.isFinite(record.quantity) || record.quantity <= 0 || record.quantity > 1_000_000)) {
    return false;
  }

  const reference = record.observedOn ?? record.createdAt;

  if (!Number.isFinite(Date.parse(reference))) {
    return false;
  }

  return true;
}

export interface EvidenceConfidenceInput {
  records: EvidenceRecord[];
  count?: number;
  spatialSpread?: number;
}

export function evidenceConfidence(input: EvidenceConfidenceInput): number {
  const records = input.records;
  const n = input.count ?? records.length;

  if (n <= 0) {
    return 0;
  }

  const countFactor =
    n < MIN_POINTS
      ? 0
      : clamp((n - MIN_POINTS + 1) / (TARGET_POINTS - MIN_POINTS + 1), 0, 1);

  const referenceDates = records.length > 0
    ? records.map((record) => record.observedOn ?? record.createdAt)
    : [];

  const recencyAverage =
    referenceDates.length > 0
      ? mean(referenceDates.map((reference) => recencyMultiplier(reference, 30)))
      : 0.5;

  const plausible =
    records.length > 0 ? records.filter(isPlausible).length / records.length : 0.5;

  const spatialUnique = new Set(
    records.map((record) => record.marketName ?? record.county),
  ).size;
  const courierUnique = new Set(records.map((record) => record.contributor)).size;

  const spatialFactor =
    input.spatialSpread !== undefined
      ? input.spatialSpread
      : Math.min(1, spatialUnique);
  const contributorFactor = courierUnique >= 2 ? 1 : Math.min(1, courierUnique);

  return (
    countFactor *
    recencyAverage *
    plausible *
    (0.85 + 0.15 * spatialFactor) *
    (0.85 + 0.15 * contributorFactor)
  );
}