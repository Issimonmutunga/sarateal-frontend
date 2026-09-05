import { fetchFromApi } from "./api";
import { db, isIndexedDBAvailable } from "./db";
import type { County, Market, Product } from "../types/api";

export const REFERENCE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function lastSeededAt(namespace: string): Promise<number> {
  const row = await db.meta.get(namespace);

  return typeof row?.value === "number" ? row.value : 0;
}

async function seedTable(
  namespace: string,
  fetchRecords: () => Promise<unknown[]>,
  writer: (records: unknown[]) => Promise<unknown>,
): Promise<void> {
  const lastSeed = await lastSeededAt(namespace);

  if (Date.now() - lastSeed < REFERENCE_TTL_MS) {
    return;
  }

  const records = await fetchRecords();

  if (records.length === 0) {
    return;
  }

  await writer(records);
  await db.meta.put({ key: namespace, value: Date.now() });
}

export async function ensureReferenceData(force = false): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  if (force) {
    await db.meta.bulkDelete(["counties", "products", "markets"]);
  }

  await Promise.all([
    seedTable("counties", () => fetchFromApi<County[]>("/counties/"), (records) =>
      db.counties.bulkPut(records as County[]),
    ),
    seedTable("products", () => fetchFromApi<Product[]>("/products/"), (records) =>
      db.products.bulkPut(records as Product[]),
    ),
    seedTable("markets", () => fetchFromApi<Market[]>("/markets"), (records) =>
      db.markets.bulkPut(records as Market[]),
    ),
  ]);
}

export async function getCachedCounties(): Promise<County[]> {
  return db.counties.toArray();
}

export async function getCachedProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function getCachedMarkets(): Promise<Market[]> {
  return db.markets.toArray();
}

export async function getReferenceAvailability(): Promise<{
  allSeeded: boolean;
  lastSeededAt: number | null;
}> {
  const lastSeed = await lastSeededAt("counties");

  return {
    allSeeded:
      (await db.counties.count()) > 0 &&
      (await db.products.count()) > 0 &&
      (await db.markets.count()) > 0,
    lastSeededAt: lastSeed || null,
  };
}