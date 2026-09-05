import { fetchFromApi } from "./api";
import { db, isIndexedDBAvailable } from "./db";
import type { WeatherRiskSignal } from "../types/api";

export const WEATHER_TTL_MS = 3 * 60 * 60 * 1000;
export const GEOCODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface LiveWeatherResult {
  signals: WeatherRiskSignal[];
  sourceName: string;
  fetchedAt: string;
  fromCache: boolean;
}

export async function getWeatherSignals(
  latitude: number,
  longitude: number,
  forecastDays = 7,
): Promise<LiveWeatherResult> {
  const key = `${latitude.toFixed(6)},${longitude.toFixed(6)},${forecastDays}`;

  if (isIndexedDBAvailable()) {
    const cached = await db.weatherCache.get(key);

    if (cached && Date.now() - Date.parse(cached.fetchedAt) < WEATHER_TTL_MS) {
      return {
        signals: cached.signals,
        sourceName: cached.sourceName,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
      };
    }
  }

  const signals = await fetchFromApi<WeatherRiskSignal[]>(
    `/weather/forecast?latitude=${latitude}&longitude=${longitude}&forecast_days=${forecastDays}`,
  );

  const record = {
    key,
    latitude,
    longitude,
    forecastDays,
    sourceName: signals[0]?.source_name ?? "Open-Meteo",
    signals,
    fetchedAt: new Date().toISOString(),
  };

  if (isIndexedDBAvailable()) {
    await db.weatherCache.put(record);
  }

  return {
    signals,
    sourceName: record.sourceName,
    fetchedAt: record.fetchedAt,
    fromCache: false,
  };
}

export interface LiveGeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  sourceName: string;
  fetchedAt: string;
  fromCache: boolean;
}

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

interface NominatimSearchResult {
  display_name?: string;
  lat?: string;
  lon?: string;
}

async function fetchNominatim(
  query: string,
): Promise<NominatimSearchResult | null> {
  const url = new URL(NOMINATIM_SEARCH_URL);
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    countrycodes: "ke",
    "accept-language": "en",
  }).toString();

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Nominatim request failed: ${response.status} ${response.statusText}`,
    );
  }

  const results = (await response.json()) as NominatimSearchResult[];

  return results[0] ?? null;
}

export async function resolveLocation(
  name: string,
  country = "Kenya",
): Promise<LiveGeocodeResult | null> {
  const key = `${name.trim().toLowerCase()}|${country.trim().toLowerCase()}`;

  if (isIndexedDBAvailable()) {
    const cached = await db.locations.get(key);

    if (cached && Date.now() - Date.parse(cached.fetchedAt) < GEOCODE_TTL_MS) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        displayName: cached.displayName,
        sourceName: cached.sourceName,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
      };
    }
  }

  const first = await fetchNominatim(`${name.trim()}, ${country}`);

  if (!first) {
    return null;
  }

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const record = {
    key,
    locationName: name.trim(),
    country,
    latitude,
    longitude,
    displayName: first.display_name ?? name.trim(),
    sourceName: "OpenStreetMap Nominatim",
    fetchedAt: new Date().toISOString(),
  };

  if (isIndexedDBAvailable()) {
    await db.locations.put(record);
  }

  return {
    latitude: record.latitude,
    longitude: record.longitude,
    displayName: record.displayName,
    sourceName: record.sourceName,
    fetchedAt: record.fetchedAt,
    fromCache: false,
  };
}