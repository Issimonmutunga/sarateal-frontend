export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stdDev(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const average = mean(values);

  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      (values.length - 1),
  );
}

export function normChange(x: number, k = 3): number {
  return 0.5 + 0.5 * Math.tanh(x * k);
}

export function recencyMultiplier(isoDate: string, halfLifeDays = 30): number {
  const ageDays = (Date.now() - Date.parse(isoDate)) / 86_400_000;

  if (!Number.isFinite(ageDays) || ageDays < 0) {
    return 0;
  }

  return Math.exp(-ageDays / halfLifeDays);
}

export function haversineKm(
  latA: number,
  lonA: number,
  latB: number,
  lonB: number,
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const SPATIAL_DECAY_KM = 80;

export function spatialDecay(distanceKm: number): number {
  return Math.exp(-distanceKm / SPATIAL_DECAY_KM);
}

export function pairwiseSpread(points: number[][]): number {
  if (points.length < 2) {
    return points.length;
  }

  const distances: number[] = [];

  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      distances.push(haversineKm(points[i][0], points[i][1], points[j][0], points[j][1]));
    }
  }

  return Math.min(1, Math.sqrt(mean(distances)) / 200);
}