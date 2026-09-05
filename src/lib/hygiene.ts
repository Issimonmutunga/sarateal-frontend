import type { DemandRecord, PriceRecord, SupplyRecord } from "./db";

export interface HygieneIssue {
  kind: "implausible" | "duplicate";
  key: string;
  text: string;
}

export interface PlausibilityCheck {
  ok: boolean;
  reasons: string[];
}

interface PlausibilityInput {
  price?: unknown;
  quantity?: unknown;
  observedOn?: string;
  availableFrom?: string;
  neededFrom?: string;
  createdAt?: string;
}

export function plausibilityOf(record: PlausibilityInput): PlausibilityCheck {
  const reasons: string[] = [];

  if (record.price !== undefined && record.price !== null && typeof record.price === "number") {
    if (!Number.isFinite(record.price) || record.price <= 0 || record.price > 10_000_000) {
      reasons.push("price outside a plausible range");
    }
  }

  if (record.quantity !== undefined && record.quantity !== null && typeof record.quantity === "number") {
    if (!Number.isFinite(record.quantity) || record.quantity <= 0 || record.quantity > 1_000_000) {
      reasons.push("quantity outside a plausible range");
    }
  }

  const reference = record.observedOn ?? record.availableFrom ?? record.neededFrom ?? record.createdAt;

  if (!reference || !Number.isFinite(Date.parse(reference))) {
    reasons.push("missing or unparseable date");
  }

  return { ok: reasons.length === 0, reasons };
}

export interface NearDuplicatePair {
  kind: "price" | "supply" | "demand";
  firstId: number | undefined;
  secondId: number | undefined;
  text: string;
}

export interface UnitConflict {
  productId: number;
  productName: string;
  county: string;
  marketName?: string | null;
  units: string[];
  count: number;
}

export function unitConflicts(prices: PriceRecord[]): UnitConflict[] {
  const byKey = new Map<string, { productId: number; productName: string; county: string; marketName?: string | null; units: Set<string>; count: number }>();

  for (const record of prices) {
    if (!record.unit) {
      continue;
    }

    const key = `${record.productId}|${record.county}|${record.marketName ?? ""}`;
    const bucket = byKey.get(key) ?? {
      productId: record.productId,
      productName: record.productName,
      county: record.county,
      marketName: record.marketName,
      units: new Set<string>(),
      count: 0,
    };

    bucket.units.add(record.unit);
    bucket.count += 1;
    byKey.set(key, bucket);
  }

  return [...byKey.values()]
    .filter((bucket) => bucket.units.size > 1)
    .map((bucket) => ({
      productId: bucket.productId,
      productName: bucket.productName,
      county: bucket.county,
      marketName: bucket.marketName,
      units: [...bucket.units].sort(),
      count: bucket.count,
    }))
    .sort((a, b) => b.count - a.count);
}

const DAY_MS = 86_400_000;
const MAX_NEAR_DAYS = 7;

function windowKey(
  kind: NearDuplicatePair["kind"],
  record: { productId: number; county: string; contributor: string; marketName?: string | null },
): string {
  return `${kind}|${record.productId}|${record.county}|${record.marketName ?? ""}|${record.contributor}`;
}

function dateOf(record: { observedOn?: string; availableFrom?: string; neededFrom?: string; createdAt?: string }): number {
  const reference = record.observedOn ?? record.availableFrom ?? record.neededFrom ?? (record.createdAt ?? "");

  return Number.isFinite(Date.parse(reference)) ? Date.parse(reference) : 0;
}

export function findNearDuplicates(
  prices: PriceRecord[],
  supplies: SupplyRecord[],
  demands: DemandRecord[],
): NearDuplicatePair[] {
  const pairs: NearDuplicatePair[] = [];

  const buckets: Record<string, Array<{ kind: NearDuplicatePair["kind"]; id: number | undefined; at: number }>> = {};

  const register = (
    kind: NearDuplicatePair["kind"],
    record: PriceRecord | SupplyRecord | DemandRecord,
  ) => {
    const bucket = buckets[windowKey(kind, record)] ?? [];
    bucket.push({ kind, id: record.id, at: dateOf(record) });
    buckets[windowKey(kind, record)] = bucket;
  };

  prices.forEach((record) => register("price", record));
  supplies.forEach((record) => register("supply", record));
  demands.forEach((record) => register("demand", record));

  for (const bucket of Object.values(buckets)) {
    const withinWindow = bucket.filter((item) => item.at > 0);

    for (let i = 0; i < withinWindow.length; i += 1) {
      for (let j = i + 1; j < withinWindow.length; j += 1) {
        if (Math.abs(withinWindow[i].at - withinWindow[j].at) <= MAX_NEAR_DAYS * DAY_MS) {
          pairs.push({
            kind: withinWindow[i].kind,
            firstId: withinWindow[i].id,
            secondId: withinWindow[j].id,
            text: `same product, market and contributor within ${MAX_NEAR_DAYS} days`,
          });
        }
      }
    }
  }

  return pairs;
}