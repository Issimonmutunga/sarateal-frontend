import Dexie, { type Table } from "dexie";

import type { ScoringConfig } from "../engine/config";
import type { County, Market, Product, WeatherRiskSignal } from "../types/api";

export interface SupplyRecord {
  id?: number;
  contributor: string;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  county: string;
  marketName?: string | null;
  availableFrom: string;
  availableUntil?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface DemandRecord {
  id?: number;
  contributor: string;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  county: string;
  marketName?: string | null;
  neededFrom: string;
  neededUntil?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PriceRecord {
  id?: number;
  contributor: string;
  productId: number;
  productName: string;
  unit: string;
  price: number;
  currency: string;
  county: string;
  marketName?: string | null;
  observedOn: string;
  notes?: string | null;
  createdAt: string;
}

export interface GeocodeCacheRecord {
  key: string;
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
  sourceName: string;
  fetchedAt: string;
}

export interface WeatherCacheRecord {
  key: string;
  latitude: number;
  longitude: number;
  forecastDays: number;
  sourceName: string;
  signals: WeatherRiskSignal[];
  fetchedAt: string;
}

export type MatchStatus = "open" | "contacted" | "deal" | "closed";

export type EntrySignalRef = "strong-entry" | "promising" | "avoid" | "insufficient-data";

export interface MatchRecord {
  id?: number;
  cellKey: string;
  productId: number;
  productName: string;
  productUnit: string;
  locationName: string;
  county: string;
  opportunityScore: number;
  confidenceScore: number;
  entrySignal: EntrySignalRef;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
  outcomeNotes?: string | null;
  dismissed?: boolean;
}

export interface MetaRecord {
  key: string;
  value: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface MatchEventRecord {
  id?: number;
  matchId: number;
  status: MatchStatus;
  at: string;
}

export type RecordKind = "supply" | "demand" | "price" | "match";

export interface TrashRecord {
  id?: number;
  kind: RecordKind;
  payload: unknown;
  deletedAt: string;
}

class SaratealDatabase extends Dexie {
  supplies!: Table<SupplyRecord, number>;
  demands!: Table<DemandRecord, number>;
  prices!: Table<PriceRecord, number>;
  locations!: Table<GeocodeCacheRecord, string>;
  weatherCache!: Table<WeatherCacheRecord, string>;
  meta!: Table<MetaRecord, string>;
  counties!: Table<County, number>;
  products!: Table<Product, number>;
  markets!: Table<Market, number>;
  matches!: Table<MatchRecord, number>;
  settings!: Table<SettingRecord, string>;
  matchEvents!: Table<MatchEventRecord, number>;
  trash!: Table<TrashRecord, number>;

  constructor() {
    super("sarateal");
    this.version(1).stores({
      supplies: "++id, productId, county, createdAt",
      demands: "++id, productId, county, createdAt",
      prices: "++id, productId, county, observedOn",
      locations: "key",
      weatherCache: "key",
      meta: "key",
      counties: "id, name",
      products: "id, name, category",
      markets: "id, name, county",
      matches: "++id, productId, county, createdAt",
    });
    this.version(2).stores({
      matches: "++id, productId, county, createdAt, updatedAt, status, dismissed, &cellKey",
    });
    this.version(3).stores({
      settings: "key",
    });
    this.version(4)
      .stores({
        matchEvents: "++id, matchId, at",
      })
      .upgrade(async (transaction) => {
        const matches = await transaction.table("matches").toArray();
        const baseline = matches.map((match) => ({
          matchId: match.id,
          status: match.status,
          at: match.updatedAt ?? match.createdAt,
        }));

        if (baseline.length > 0) {
          await transaction.table("matchEvents").bulkAdd(baseline);
        }
      });
    this.version(5).stores({
      trash: "++id, kind, deletedAt",
    });
  }
}

export const db = new SaratealDatabase();

export async function getScoringConfig(): Promise<ScoringConfig | undefined> {
  const record = await db.settings.get("scoring");

  return record?.value as ScoringConfig | undefined;
}

export async function saveScoringConfig(config: ScoringConfig): Promise<void> {
  await db.settings.put({ key: "scoring", value: config });
}

export async function clearScoringConfig(): Promise<void> {
  await db.settings.delete("scoring");
}

export type UserRole = "farmer" | "buyer" | "observer";

export async function getRole(): Promise<UserRole | null> {
  const record = await db.settings.get("role");

  return (record?.value as UserRole) ?? null;
}

export async function saveRole(role: UserRole): Promise<void> {
  await db.settings.put({ key: "role", value: role });
}

export async function getOnboardingDone(): Promise<boolean> {
  const record = await db.settings.get("onboardingDone");

  return record?.value === true;
}

export async function setOnboardingDone(value: boolean): Promise<void> {
  await db.settings.put({ key: "onboardingDone", value });
}

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}