import {
  computeAccessibility,
  computePrice,
  computeRawCompetition,
  computeSeasonal,
  computeSupplyDemand,
  type CellCore,
  type ProviderLocation,
} from "./components";
import { DEFAULT_SCORING_CONFIG, normalizeWeights, type ScoringConfig } from "./config";
import { mean } from "./math";
import { entrySignalFor, MIN_COMPONENT_PRESENCE_CONFIDENCE } from "./types";
import type { ComponentKey, ComponentScore, OpportunityCell } from "./types";
import type { County, Market, WeatherRiskSignal } from "../types/api";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../lib/db";

interface ProductReference {
  id: number;
  name: string;
  category: string;
  unit: string;
}

export interface EngineInput {
  supplies: SupplyRecord[];
  demands: DemandRecord[];
  prices: PriceRecord[];
  products: ProductReference[];
  markets: Market[];
  counties: County[];
  resolveUnknownLocation?: (
    locationName: string,
  ) => Promise<{ latitude: number; longitude: number } | null>;
  fetchWeather?: (
    latitude: number,
    longitude: number,
  ) => Promise<number | null>;
}

interface CellBucket extends CellCore {
  key: string;
  productId: number;
  productName: string;
  productUnit: string;
  category: string;
  supplyUnits: number;
  demandUnits: number;
  pricePoints: number;
}

const COMPONENT_ORDER: ComponentKey[] = ["ssd", "price", "access", "seasonal", "competition"];
const SIGNAL_RANK: Record<OpportunityCell["entrySignal"], number> = {
  "strong-entry": 0,
  promising: 1,
  avoid: 2,
  "insufficient-data": 3,
};

function cellKey(productId: number, locationName: string): string {
  return `${productId}|${locationName}`;
}

function locationOf(marketName: string | null | undefined, county: string): string {
  return marketName?.trim() || county;
}

function buildBuckets(
  supplies: SupplyRecord[],
  demands: DemandRecord[],
  prices: PriceRecord[],
  productById: Map<number, ProductReference>,
): Map<string, CellBucket> {
  const buckets = new Map<string, CellBucket>();

  const ensure = (productId: number, locationName: string, county: string) => {
    const key = cellKey(productId, locationName);
    let bucket = buckets.get(key);

    if (!bucket) {
      const product = productById.get(productId);

      bucket = {
        key,
        locationName,
        county,
        latitude: null,
        longitude: null,
        supply: [],
        demand: [],
        prices: [],
        productId,
        productName: product?.name ?? `Product ${productId}`,
        productUnit: product?.unit ?? "",
        category: product?.category ?? "",
        supplyUnits: 0,
        demandUnits: 0,
        pricePoints: 0,
      };
      buckets.set(key, bucket);
    }

    return bucket;
  };

  for (const supply of supplies) {
    const bucket = ensure(supply.productId, locationOf(supply.marketName, supply.county), supply.county);
    bucket.supply.push(supply);
    bucket.supplyUnits += supply.quantity;
  }

  for (const demand of demands) {
    const bucket = ensure(demand.productId, locationOf(demand.marketName, demand.county), demand.county);
    bucket.demand.push(demand);
    bucket.demandUnits += demand.quantity;
  }

  for (const price of prices) {
    const bucket = ensure(price.productId, locationOf(price.marketName, price.county), price.county);
    bucket.prices.push(price);
    bucket.pricePoints += 1;
  }

  return buckets;
}

function weatherSuitability(signals: WeatherRiskSignal[]): number | null {
  if (signals.length === 0) {
    return null;
  }

  const heatScore = (risk: string) =>
    risk === "low" ? 1 : risk === "medium" ? 0.65 : risk === "high" ? 0.25 : 0.6;

  const rainScore = (signal: string) =>
    signal === "dry"
      ? 0.8
      : signal === "light_rain"
        ? 0.95
        : signal === "moderate_rain"
          ? 0.7
          : signal === "heavy_rain"
            ? 0.3
            : 0.6;

  const perDay = signals.map(
    (signal) => 0.5 * heatScore(signal.heat_risk) + 0.5 * rainScore(signal.rainfall_signal),
  );

  return mean(perDay);
}

export function suitabilityFromWeatherSignals(signals: WeatherRiskSignal[]): number | null {
  return weatherSuitability(signals);
}

export async function computeOpportunitySurface(
  input: EngineInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): Promise<OpportunityCell[]> {
  const weights = normalizeWeights(config.weights);
  const productById = new Map(input.products.map((product) => [product.id, product]));
  const buckets = buildBuckets(input.supplies, input.demands, input.prices, productById);

  if (buckets.size === 0) {
    return [];
  }

  const coordinateCache = new Map<string, { latitude: number; longitude: number } | null>();
  const weatherCache = new Map<string, number | null>();
  const marketByCounty = new Map<string, Market>();
  const marketByName = new Map<string, Market>();
  const countyByName = new Map<string, County>();

  for (const market of input.markets) {
    marketByName.set(market.name, market);

    if (market.latitude != null && !marketByCounty.has(market.county)) {
      marketByCounty.set(market.county, market);
    }
  }

  for (const county of input.counties) {
    countyByName.set(county.name, county);
  }

  const resolveCoordinates = async (
    locationName: string,
    county: string,
  ): Promise<{ latitude: number; longitude: number } | null> => {
    const cached = coordinateCache.get(locationName);

    if (cached !== undefined) {
      return cached;
    }

    let resolved: { latitude: number; longitude: number } | null = null;

    const market = marketByName.get(locationName);

    if (market?.latitude != null && market.longitude != null) {
      resolved = { latitude: market.latitude, longitude: market.longitude };
    }

    if (resolved === null) {
      const fallbackCounty =
        market?.county && market.latitude == null ? market.county : county;
      const countyRef = countyByName.get(fallbackCounty);

      if (countyRef?.latitude != null && countyRef.longitude != null) {
        resolved = { latitude: countyRef.latitude, longitude: countyRef.longitude };
      }
    }

    if (resolved === null && input.resolveUnknownLocation) {
      resolved = await input.resolveUnknownLocation(locationName).catch(() => null);
    }

    coordinateCache.set(locationName, resolved);

    return resolved;
  };

  const resolveWeather = async (
    latitude: number,
    longitude: number,
  ): Promise<number | null> => {
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

    if (weatherCache.has(key)) {
      return weatherCache.get(key) ?? null;
    }

    if (!input.fetchWeather) {
      weatherCache.set(key, null);

      return null;
    }

    const suitability = await input.fetchWeather(latitude, longitude).catch(() => null);
    weatherCache.set(key, suitability);

    return suitability;
  };

  const productKeys = new Set(
    [...buckets.keys()].map((key) => key.split("|")[0]),
  );
  const finalized: OpportunityCell[] = [];
  const competitionRaw = new Map<string, { raw: number; confidence: number; observations: number }>();

  for (const productId of productKeys) {
    const productCells = [...buckets.values()].filter(
      (cell) => cell.productId === Number(productId),
    );
    const locationNames = [...new Set(productCells.map((cell) => cell.locationName))];
    const allPricesOfProduct = productCells.flatMap((cell) => cell.prices);

    const providers: ProviderLocation[] = [];

    for (const locationName of locationNames) {
      const locationCells = productCells.filter((cell) => cell.locationName === locationName);
      const records = [
        ...locationCells.flatMap((cell) => cell.supply),
        ...locationCells.flatMap((cell) => cell.demand),
        ...locationCells.flatMap((cell) => cell.prices),
      ];
      const first = locationCells[0];
      const coords = await resolveCoordinates(locationName, first.county);

      providers.push({
        locationName,
        county: first.county,
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        supplyUnits: locationCells.reduce((sum, cell) => sum + cell.supplyUnits, 0),
        demandUnits: locationCells.reduce((sum, cell) => sum + cell.demandUnits, 0),
        pricePoints: locationCells.reduce((sum, cell) => sum + cell.pricePoints, 0),
        suppliers: locationCells.flatMap((cell) => cell.supply),
        demands: locationCells.flatMap((cell) => cell.demand),
        prices: locationCells.flatMap((cell) => cell.prices),
        records,
      });
    }

    for (const cell of productCells) {
      const coords = await resolveCoordinates(cell.locationName, cell.county);
      cell.latitude = coords?.latitude ?? null;
      cell.longitude = coords?.longitude ?? null;

      competitionRaw.set(
        cellKey(cell.productId, cell.locationName),
        computeRawCompetition(cell, providers),
      );
    }

    const maxRaw = Math.max(
      1e-9,
      ...productCells.map(
        (cell) => competitionRaw.get(cellKey(cell.productId, cell.locationName))?.raw ?? 0,
      ),
    );

    for (const cell of productCells) {
      const rawCompetition = competitionRaw.get(
        cellKey(cell.productId, cell.locationName),
      );

      const weatherSuitability =
        cell.latitude !== null && cell.longitude !== null
          ? await resolveWeather(cell.latitude, cell.longitude)
          : null;

      const components: Record<ComponentKey, ComponentScore> = {
        ssd: computeSupplyDemand(cell, weights),
        price: computePrice(cell, allPricesOfProduct, weights),
        access: computeAccessibility(cell, providers, weights),
        seasonal: computeSeasonal(
          {
            prices: cell.prices,
            supply: cell.supply,
            demand: cell.demand,
            weatherSuitability,
          },
          weights,
        ),
        competition: {
          key: "competition",
          value:
            rawCompetition && rawCompetition.raw > 0
              ? 100 * (1 - rawCompetition.raw / maxRaw)
              : 100,
          confidence: rawCompetition?.confidence ?? 0,
          weight: weights.competition,
          observations: rawCompetition?.observations ?? 0,
          note:
            rawCompetition && rawCompetition.observations > 0
              ? `${rawCompetition.observations} supplier location(s) within reach.`
              : "No supplier competition within reach.",
        },
      };

      const present = COMPONENT_ORDER.filter(
        (key) => components[key].value !== null &&
          components[key].confidence >= MIN_COMPONENT_PRESENCE_CONFIDENCE,
      );

      const presentWeightSum = present.reduce(
        (sum, key) => sum + components[key].weight,
        0,
      );

      const opportunity =
        presentWeightSum > 0
          ? present.reduce(
              (sum, key) => sum + (components[key].weight * (components[key].value as number)) / presentWeightSum,
              0,
            )
          : null;

      const totalWeightSum = COMPONENT_ORDER.reduce(
        (sum, key) => sum + components[key].weight,
        0,
      );

      const confidence =
        totalWeightSum > 0
          ? COMPONENT_ORDER.reduce(
              (sum, key) => sum + (components[key].weight * components[key].confidence) / totalWeightSum,
              0,
            ) * 100
          : 0;

      const entrySignal =
        opportunity === null
          ? "insufficient-data"
          : entrySignalFor(opportunity, confidence, {
              opportunityHigh: config.opportunityHigh,
              confidenceHigh: config.confidenceHigh,
            });

      finalized.push({
        key: cellKey(cell.productId, cell.locationName),
        productId: cell.productId,
        productName: cell.productName,
        productUnit: cell.productUnit,
        category: cell.category,
        locationName: cell.locationName,
        county: cell.county,
        latitude: cell.latitude,
        longitude: cell.longitude,
        supplyUnits: cell.supplyUnits,
        demandUnits: cell.demandUnits,
        pricePoints: cell.pricePoints,
        supplyEntries: cell.supply.length,
        demandEntries: cell.demand.length,
        priceEntries: cell.prices.length,
        components,
        opportunity,
        confidence,
        entrySignal,
        records: {
          supply: cell.supply,
          demand: cell.demand,
          prices: cell.prices,
        },
      });
    }
  }

  return finalized.sort((a, b) => {
    const rankDelta =
      SIGNAL_RANK[a.entrySignal] - SIGNAL_RANK[b.entrySignal];

    if (rankDelta !== 0) {
      return rankDelta;
    }

    return (b.opportunity ?? -1) - (a.opportunity ?? -1);
  });
}