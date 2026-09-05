import { evidenceConfidence } from "./confidence";
import { clamp01, haversineKm, mean, normChange, pairwiseSpread, spatialDecay, stdDev } from "./math";
import type { ComponentScore, ComponentKey } from "./types";
import { COMPONENT_WEIGHTS } from "./types";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../lib/db";

interface EvidenceRecordLite {
  id?: number;
  createdAt: string;
  observedOn?: string;
  quantity?: number;
  price?: number;
  county: string;
  marketName?: string | null;
  contributor: string;
}

export interface ProviderLocation {
  locationName: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  supplyUnits: number;
  demandUnits: number;
  pricePoints: number;
  suppliers: SupplyRecord[];
  demands: DemandRecord[];
  prices: PriceRecord[];
  records: EvidenceRecordLite[];
}

export interface CellCore {
  locationName: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  supply: SupplyRecord[];
  demand: DemandRecord[];
  prices: PriceRecord[];
}

function completed(
  key: ComponentKey,
  value: number | null,
  confidence: number,
  observations: number,
  note: string,
  weight: number = COMPONENT_WEIGHTS[key],
): ComponentScore {
  return { key, value, confidence, weight, observations, note };
}

type WeightSet = Record<ComponentKey, number>;

export function computeSupplyDemand(
  cell: { supply: SupplyRecord[]; demand: DemandRecord[] },
  weights: WeightSet = COMPONENT_WEIGHTS,
): ComponentScore {
  const records: EvidenceRecordLite[] = [...cell.supply, ...cell.demand];
  const observations = records.length;

  if (observations === 0) {
    return completed("ssd", null, 0, 0, "No supply or demand records.", weights.ssd);
  }

  const supplyUnits = cell.supply.reduce((sum, record) => sum + record.quantity, 0);
  const demandUnits = cell.demand.reduce((sum, record) => sum + record.quantity, 0);

  const imbalance = (demandUnits - supplyUnits) / (supplyUnits + demandUnits + 1);
  const value = 100 * clamp01(0.5 + 0.5 * imbalance);

  const note =
    cell.supply.length === 0 && cell.demand.length > 0
      ? "Demand logged; zero supply on record."
      : cell.demand.length === 0 && cell.supply.length > 0
        ? "Supply logged; zero demand on record."
        : `Supply ${supplyUnits.toFixed(1)} units vs demand ${demandUnits.toFixed(1)} units.`;

  return completed(
    "ssd",
    value,
    evidenceConfidence({ records }),
    observations,
    note,
    weights.ssd,
  );
}

export function computePrice(
  cell: { prices: PriceRecord[] },
  allPricesOfProduct: PriceRecord[],
  weights: WeightSet = COMPONENT_WEIGHTS,
): ComponentScore {
  const observations = cell.prices.length;

  if (observations === 0) {
    return completed("price", null, 0, 0, "No price records.", weights.price);
  }

  const sorted = [...cell.prices].sort(
    (a, b) => Date.parse(a.observedOn) - Date.parse(b.observedOn),
  );
  const values = sorted.map((record) => record.price);
  const cellMean = mean(values);

  const recent = mean(values.slice(-2));
  const earlier = mean(values.slice(0, -2));
  const trend = earlier > 1e-6 ? (recent - earlier) / earlier : 0;

  const others = allPricesOfProduct.filter(
    (record) => !sorted.some((own) => own.id === record.id),
  );
  const othersMean = others.length > 0 ? mean(others.map((record) => record.price)) : 0;
  const spatialGap = othersMean > 1e-6 ? (cellMean - othersMean) / othersMean : 0;

  const vol = cellMean > 1e-6 ? stdDev(values) / cellMean : 0;

  const value =
    100 *
    clamp01(
      0.4 * normChange(trend) +
        0.4 * normChange(spatialGap) -
        0.2 * clamp01(vol / 0.5),
    );

  const last = sorted[sorted.length - 1];
  const note = `${observations} price points (${last.price.toFixed(0)} ${last.unit}); trend ${(trend * 100).toFixed(1)}%; ${others.length > 0 ? `${(spatialGap * 100).toFixed(1)}% vs other markets` : "no other markets"}; vol ${(vol * 100).toFixed(1)}%.`;

  return completed(
    "price",
    value,
    evidenceConfidence({ records: cell.prices }),
    observations,
    note,
    weights.price,
  );
}

function reachableOf(target: { latitude: number | null; longitude: number | null }, providers: ProviderLocation[]) {
  if (target.latitude === null || target.longitude === null) {
    return [];
  }

  return providers
    .filter((provider) => provider.latitude !== null && provider.longitude !== null)
    .map((provider) => ({
      provider,
      km: haversineKm(
        target.latitude as number,
        target.longitude as number,
        provider.latitude as number,
        provider.longitude as number,
      ),
    }));
}

function coordinateBearing(providers: ProviderLocation[]): ProviderLocation[] {
  return providers.filter(
    (provider) => provider.latitude !== null && provider.longitude !== null,
  );
}

export function computeAccessibility(
  cell: CellCore,
  providers: ProviderLocation[],
  weights: WeightSet = COMPONENT_WEIGHTS,
): ComponentScore {
  if (cell.latitude === null || cell.longitude === null) {
    return completed("access", null, 0, 0, "Location coordinates unresolved.", weights.access);
  }

  const located = coordinateBearing(providers);
  const reachable = reachableOf(cell, located);

  if (reachable.length === 0) {
    return completed("access", null, 0, 0, "No coordinate-bearing locations to compare against.", weights.access);
  }

  const attractivenessOf = (provider: ProviderLocation) =>
    Math.pow(1 + provider.records.length, 0.5);

  const ownProvider = located.find((provider) => provider.locationName === cell.locationName);
  const ownAttractiveness = (ownProvider ? attractivenessOf(ownProvider) : 1) + 1e-6;

  const competitiveAccess = reachable
    .filter(({ provider }) => provider.locationName !== cell.locationName)
    .reduce(
      (sum, { provider, km }) => sum + spatialDecay(km) * attractivenessOf(provider),
      0,
    );

  const underservedFraction = ownAttractiveness / (competitiveAccess + ownAttractiveness);
  const observations = located.length;
  const confidence = evidenceConfidence({
    records: located.flatMap((provider) => provider.records).slice(0, 64),
    count: observations,
    spatialSpread: pairwiseSpread(
      located.map((provider) => [provider.latitude as number, provider.longitude as number]),
    ),
  });

  return completed(
    "access",
    100 * clamp01(underservedFraction),
    confidence,
    observations,
    `${observations} coordinate-bearing locations; reachable share ${(underservedFraction * 100).toFixed(0)}%.`,
    weights.access,
  );
}

interface MonthlyOpportunity {
  opportunity: number;
}

function monthlyOpportunity(
  records: Array<{ date: string; amount: number }>,
  wantScarcity: boolean,
): MonthlyOpportunity | null {
  if (records.length === 0) {
    return null;
  }

  const byMonth = new Map<string, number[]>();

  for (const record of records) {
    const month = record.date.slice(0, 7);

    if (!Number.isFinite(Date.parse(`${month}-01`))) {
      continue;
    }

    const bucket = byMonth.get(month) ?? [];
    bucket.push(record.amount);
    byMonth.set(month, bucket);
  }

  if (byMonth.size < 2) {
    return null;
  }

  const overallMean = mean([...byMonth.values()].flat());
  const months = [...byMonth.keys()].sort();
  const latest = mean(byMonth.get(months[months.length - 1]) ?? []);

  if (overallMean <= 1e-6) {
    return null;
  }

  const factor = (latest - overallMean) / overallMean;
  const opportunity = wantScarcity ? 1 - normChange(factor) : normChange(factor);

  return { opportunity };
}

export interface SeasonalInput {
  prices: PriceRecord[];
  supply: SupplyRecord[];
  demand: DemandRecord[];
  weatherSuitability: number | null;
}

export function computeSeasonal(
  input: SeasonalInput,
  weights: WeightSet = COMPONENT_WEIGHTS,
): ComponentScore {
  const evidence: Array<{ weight: number; opportunity: number; label: string }> = [];

  const priceSeasonality = monthlyOpportunity(
    input.prices.map((record) => ({ date: record.observedOn, amount: record.price })),
    false,
  );

  if (priceSeasonality) {
    evidence.push({
      weight: 0.3,
      opportunity: priceSeasonality.opportunity,
      label: "price seasonality",
    });
  }

  const supplySeasonality = monthlyOpportunity(
    input.supply.map((record) => ({ date: record.availableFrom, amount: record.quantity })),
    true,
  );

  if (supplySeasonality) {
    evidence.push({
      weight: 0.2,
      opportunity: supplySeasonality.opportunity,
      label: "supply seasonality",
    });
  }

  const demandSeasonality = monthlyOpportunity(
    input.demand.map((record) => ({ date: record.neededFrom, amount: record.quantity })),
    false,
  );

  if (demandSeasonality) {
    evidence.push({
      weight: 0.2,
      opportunity: demandSeasonality.opportunity,
      label: "demand seasonality",
    });
  }

  let weatherEvidence = 0;

  if (input.weatherSuitability !== null && Number.isFinite(input.weatherSuitability)) {
    evidence.push({
      weight: 0.3,
      opportunity: input.weatherSuitability,
      label: "weather suitability",
    });
    weatherEvidence = 2;
  }

  if (evidence.length === 0) {
    return completed(
      "seasonal",
      null,
      0,
      0,
      "No seasonal history or weather signal yet.",
      weights.seasonal,
    );
  }

  const weightSum = evidence.reduce((sum, item) => sum + item.weight, 0);
  const value =
    100 *
    clamp01(
      evidence.reduce((sum, item) => sum + item.weight * item.opportunity, 0) / weightSum,
    );

  const records = [
    ...input.prices,
    ...input.supply,
    ...input.demand,
  ];

  const confidence = evidenceConfidence({
    records,
    count: records.length + weatherEvidence,
  });

  return completed(
    "seasonal",
    value,
    confidence,
    records.length + weatherEvidence,
    evidence.map((item) => item.label).join(", "),
    weights.seasonal,
  );
}

export function computeRawCompetition(cell: CellCore, providers: ProviderLocation[]): {
  raw: number;
  confidence: number;
  observations: number;
} {
  if (cell.latitude === null || cell.longitude === null) {
    return { raw: 0, confidence: 0, observations: 0 };
  }

  const reachable = reachableOf(cell, providers);
  const withSupply = reachable.filter(({ provider }) => provider.supplyUnits > 0);

  const raw = withSupply.reduce(
    (sum, { provider, km }) => sum + provider.supplyUnits * spatialDecay(km),
    0,
  );

  const observations = withSupply.length;

  const confidence =
    raw > 0
      ? evidenceConfidence({
          records: withSupply.flatMap(({ provider }) => provider.suppliers).slice(0, 64),
          count: observations,
          spatialSpread: pairwiseSpread(
            withSupply.map(({ provider }) => [provider.latitude as number, provider.longitude as number]),
          ),
        })
      : 0;

  return { raw, confidence, observations };
}