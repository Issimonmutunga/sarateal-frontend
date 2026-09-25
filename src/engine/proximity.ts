import { haversineKm } from "./math";
import type { OpportunityCell } from "./types";

export const REACH_RADII_KM = [25, 50, 100] as const;
export const GAP_KM = 40;
export const DISPATCH_KM = 300;
export const NEARBY_LIMIT = 5;

export interface ReachBand {
  radiusKm: number;
  markets: number;
  supplyUnits: number;
  demandUnits: number;
  pricePoints: number;
}

export interface NearbyMarket {
  locationName: string;
  county: string;
  km: number;
  bearing: string;
  supplyUnits: number;
  demandUnits: number;
  pricePoints: number;
  records: number;
  arrivalScore: number;
}

export interface ProximityCoverage {
  localSupply: boolean;
  nearestSupplyMarket: string | null;
  kmToNearestSupply: number | null;
  supplyGap: boolean;
  nearestDemandMarket: string | null;
  kmToNearestDemand: number | null;
  demandGap: boolean;
}

export interface ProximityAnalysis {
  reach: ReachBand[];
  nearby: NearbyMarket[];
  coverage: ProximityCoverage | null;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function bearingDeg(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const phi1 = toRadians(latA);
  const phi2 = toRadians(latB);
  const deltaLambda = toRadians(lonB - lonA);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

function compass(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  return directions[Math.round(((bearing % 360) + 360) / 45) % directions.length];
}

function siblingCells(cell: OpportunityCell, cells: OpportunityCell[]): OpportunityCell[] {
  return cells.filter(
    (candidate) =>
      candidate.productId === cell.productId &&
      candidate.key !== cell.key &&
      candidate.latitude !== null &&
      candidate.longitude !== null,
  );
}

export function proximityForCell(
  cell: OpportunityCell,
  cells: OpportunityCell[],
): ProximityAnalysis | null {
  if (cell.latitude === null || cell.longitude === null) {
    return null;
  }

  const lat = cell.latitude;
  const lon = cell.longitude;
  const siblings = siblingCells(cell, cells);

  const reach = REACH_RADII_KM.map((radiusKm) => {
    const within = [cell, ...siblings].filter(
      (candidate) =>
        haversineKm(lat, lon, candidate.latitude as number, candidate.longitude as number) <=
        radiusKm,
    );

    const locations = new Set(within.map((candidate) => candidate.locationName));

    return {
      radiusKm,
      markets: locations.size,
      supplyUnits: within.reduce((sum, candidate) => sum + candidate.supplyUnits, 0),
      demandUnits: within.reduce((sum, candidate) => sum + candidate.demandUnits, 0),
      pricePoints: within.reduce((sum, candidate) => sum + candidate.pricePoints, 0),
    };
  });

  const byLocation = new Map<string, OpportunityCell>();

  for (const candidate of siblings) {
    if (!byLocation.has(candidate.locationName)) {
      byLocation.set(candidate.locationName, candidate);
    }
  }

  const located = [...byLocation.values()].filter(
    (candidate) =>
      candidate.latitude !== null &&
      candidate.longitude !== null &&
      haversineKm(lat, lon, candidate.latitude, candidate.longitude) <= DISPATCH_KM,
  );

  const maxRecords = Math.max(
    1,
    ...located.map((candidate) => candidate.supplyEntries + candidate.demandEntries + candidate.priceEntries),
  );

  const nearby = located
    .map((candidate) => {
      const km = haversineKm(
        lat,
        lon,
        candidate.latitude as number,
        candidate.longitude as number,
      );

      const records =
        candidate.supplyEntries + candidate.demandEntries + candidate.priceEntries;
      const distanceNorm = Math.exp(-km / 150);
      const activityNorm = records / maxRecords;

      return {
        locationName: candidate.locationName,
        county: candidate.county,
        km,
        bearing: compass(bearingDeg(lat, lon, candidate.latitude as number, candidate.longitude as number)),
        supplyUnits: candidate.supplyUnits,
        demandUnits: candidate.demandUnits,
        pricePoints: candidate.pricePoints,
        records,
        arrivalScore: 100 * (0.75 * distanceNorm + 0.25 * activityNorm),
      };
    })
    .sort((a, b) => b.arrivalScore - a.arrivalScore)
    .slice(0, NEARBY_LIMIT);

  const supplyLocations = located.filter((candidate) => candidate.supplyUnits > 0);
  const demandLocations = located.filter((candidate) => candidate.demandUnits > 0);

  const nearestSupply = supplyLocations.length > 0
    ? supplyLocations
        .map((candidate) => ({
          name: candidate.locationName,
          km: haversineKm(lat, lon, candidate.latitude as number, candidate.longitude as number),
        }))
        .sort((a, b) => a.km - b.km)[0]
    : null;

  const nearestDemand = demandLocations.length > 0
    ? demandLocations
        .map((candidate) => ({
          name: candidate.locationName,
          km: haversineKm(lat, lon, candidate.latitude as number, candidate.longitude as number),
        }))
        .sort((a, b) => a.km - b.km)[0]
    : null;

  const localSupply = cell.supplyUnits > 0;
  const localDemand = cell.demandUnits > 0;

  const coverage: ProximityCoverage | null =
    cell.latitude !== null
      ? {
          localSupply,
          nearestSupplyMarket: localSupply ? cell.locationName : (nearestSupply?.name ?? null),
          kmToNearestSupply: localSupply ? 0 : (nearestSupply?.km ?? null),
          supplyGap: !localSupply && (nearestSupply === null || nearestSupply.km > GAP_KM),
          nearestDemandMarket: localDemand ? cell.locationName : (nearestDemand?.name ?? null),
          kmToNearestDemand: localDemand ? 0 : (nearestDemand?.km ?? null),
          demandGap: !localDemand && (nearestDemand === null || nearestDemand.km > GAP_KM),
        }
      : null;

  return { reach, nearby, coverage };
}