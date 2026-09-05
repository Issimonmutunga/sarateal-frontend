import { ensureReferenceData } from "./cache";
import { db, type EntrySignalRef, type MatchEventRecord, type MatchStatus } from "./db";
import type {
  DemandRecord,
  MatchRecord,
  MetaRecord,
  PriceRecord,
  SupplyRecord,
} from "./db";
import type { OpportunityCell } from "../engine/types";

interface ReferenceCounts {
  counties: number;
  products: number;
  markets: number;
  lastSeededAt: number | null;
}

export interface DatasetSnapshot {
  schema: "sarateal-dataset";
  version: 1 | 2;
  exportedAt: string;
  records: {
    supplies: SupplyRecord[];
    demands: DemandRecord[];
    prices: PriceRecord[];
    matches: MatchRecord[];
  };
  matchEvents?: MatchEventRecord[];
  reference: ReferenceCounts;
}

type CsvRow = Record<string, string | number | boolean | null | undefined>;

const CSV_COLUMN_ORDER = [
  "recordType",
  "id",
  "contributor",
  "productId",
  "productName",
  "quantity",
  "unit",
  "price",
  "currency",
  "county",
  "marketName",
  "locationName",
  "entrySignal",
  "status",
  "dismissed",
  "opportunityScore",
  "confidenceScore",
  "outcomeNotes",
  "notes",
  "date",
  "createdAt",
];

export async function buildDatasetSnapshot(): Promise<DatasetSnapshot> {
  const [supplies, demands, prices, matches, matchEvents, counties, products, markets, seeded] =
    await Promise.all([
      db.supplies.toArray(),
      db.demands.toArray(),
      db.prices.toArray(),
      db.matches.toArray(),
      db.matchEvents.toArray(),
      db.counties.count(),
      db.products.count(),
      db.markets.count(),
      db.meta.get("counties"),
    ]);

  const lastSeeded = seeded as MetaRecord | undefined;

  return {
    schema: "sarateal-dataset",
    version: 2,
    exportedAt: new Date().toISOString(),
    records: { supplies, demands, prices, matches },
    matchEvents,
    reference: {
      counties,
      products,
      markets,
      lastSeededAt:
        typeof lastSeeded?.value === "number" ? lastSeeded.value : null,
    },
  };
}

function supplyRow(record: SupplyRecord): CsvRow {
  return {
    recordType: "supply",
    id: record.id ?? "",
    contributor: record.contributor,
    productId: record.productId,
    productName: record.productName,
    quantity: record.quantity,
    unit: record.unit,
    county: record.county,
    marketName: record.marketName ?? "",
    notes: record.notes ?? "",
    date: record.availableFrom,
    createdAt: record.createdAt,
  };
}

function demandRow(record: DemandRecord): CsvRow {
  return {
    recordType: "demand",
    id: record.id ?? "",
    contributor: record.contributor,
    productId: record.productId,
    productName: record.productName,
    quantity: record.quantity,
    unit: record.unit,
    county: record.county,
    marketName: record.marketName ?? "",
    notes: record.notes ?? "",
    date: record.neededFrom,
    createdAt: record.createdAt,
  };
}

function priceRow(record: PriceRecord): CsvRow {
  return {
    recordType: "price",
    id: record.id ?? "",
    contributor: record.contributor,
    productId: record.productId,
    productName: record.productName,
    unit: record.unit,
    price: record.price,
    currency: record.currency,
    county: record.county,
    marketName: record.marketName ?? "",
    notes: record.notes ?? "",
    date: record.observedOn,
    createdAt: record.createdAt,
  };
}

function matchRow(record: MatchRecord): CsvRow {
  return {
    recordType: "match",
    id: record.id ?? "",
    productId: record.productId,
    productName: record.productName,
    unit: record.productUnit,
    county: record.county,
    locationName: record.locationName,
    entrySignal: record.entrySignal,
    status: record.status,
    dismissed: record.dismissed ? "true" : "false",
    opportunityScore: record.opportunityScore,
    confidenceScore: record.confidenceScore,
    outcomeNotes: record.outcomeNotes ?? "",
    date: record.updatedAt,
    createdAt: record.createdAt,
  };
}

function recordsToRows(snapshot: DatasetSnapshot): CsvRow[] {
  return [
    ...snapshot.records.supplies.map(supplyRow),
    ...snapshot.records.demands.map(demandRow),
    ...snapshot.records.prices.map(priceRow),
    ...snapshot.records.matches.map(matchRow),
  ];
}

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function rowsToCsv(rows: CsvRow[], columnOrder: string[] = CSV_COLUMN_ORDER): string {
  if (rows.length === 0) {
    return "";
  }

  const presentKeys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      presentKeys.add(key);
    }
  }

  const headerKeys = [
    ...columnOrder.filter((column) => presentKeys.has(column)),
    ...[...presentKeys].filter((key) => !columnOrder.includes(key)).sort(),
  ];

  const lines = [headerKeys.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headerKeys.map((key) => csvEscape(row[key])).join(","));
  }

  return lines.join("\r\n");
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function exportFilename(extension: "json" | "csv"): string {
  const stamp = new Date().toISOString().slice(0, 10);

  return `sarateal-export-${stamp}.${extension}`;
}

const SURFACE_COLUMN_ORDER = [
  "productName",
  "productUnit",
  "locationName",
  "county",
  "entrySignal",
  "actionable",
  "opportunity",
  "confidence",
  "latestMatchStatus",
  "ssd",
  "price",
  "access",
  "seasonal",
  "competition",
  "supplyUnits",
  "demandUnits",
  "pricePoints",
  "supplyEntries",
  "demandEntries",
  "priceEntries",
];

function componentNumber(
  cell: OpportunityCell,
  key: keyof OpportunityCell["components"],
): number | "" {
  const component = cell.components[key];

  return component.value !== null ? component.value : "";
}

export function surfaceCsv(cells: OpportunityCell[], matches: MatchRecord[] = []): string {
  interface StatusCandidate {
    status: string;
    stamp: string;
    id?: number;
  }

  const latestByCell = new Map<string, StatusCandidate>();

  for (const match of matches) {
    const candidate: StatusCandidate = {
      status: match.status,
      stamp: match.updatedAt || match.createdAt,
      id: match.id,
    };
    const existing = latestByCell.get(match.cellKey);

    if (
      !existing ||
      candidate.stamp > existing.stamp ||
      (candidate.stamp === existing.stamp && (candidate.id ?? 0) > (existing.id ?? 0))
    ) {
      latestByCell.set(match.cellKey, candidate);
    }
  }

  const scored = cells
    .filter((cell) => cell.opportunity !== null)
    .sort(
      (a, b) =>
        (b.opportunity as number) - (a.opportunity as number) ||
        b.confidence - a.confidence,
    );

  const rows: CsvRow[] = scored.map((cell) => ({
    productName: cell.productName,
    productUnit: cell.productUnit,
    locationName: cell.locationName,
    county: cell.county,
    entrySignal: cell.entrySignal,
    actionable:
      cell.entrySignal === "strong-entry" || cell.entrySignal === "promising",
    opportunity: cell.opportunity,
    confidence: cell.confidence,
    latestMatchStatus: latestByCell.get(cell.key)?.status ?? "",
    ssd: componentNumber(cell, "ssd"),
    price: componentNumber(cell, "price"),
    access: componentNumber(cell, "access"),
    seasonal: componentNumber(cell, "seasonal"),
    competition: componentNumber(cell, "competition"),
    supplyUnits: cell.supplyUnits,
    demandUnits: cell.demandUnits,
    pricePoints: cell.pricePoints,
    supplyEntries: cell.supplyEntries,
    demandEntries: cell.demandEntries,
    priceEntries: cell.priceEntries,
  }));

  return rowsToCsv(rows, SURFACE_COLUMN_ORDER);
}

export async function downloadSurfaceCsv(
  cells: OpportunityCell[],
  matches: MatchRecord[] = [],
): Promise<string> {
  const blob = new Blob([surfaceCsv(cells, matches)], {
    type: "text/csv;charset=utf-8",
  });

  downloadBlob(`sarateal-surface-${new Date().toISOString().slice(0, 10)}.csv`, blob);

  const exported = surfaceCsv(cells, matches);

  return `${exported.length > 0 ? exported.trim().split(/\r?\n/).length - 1 : 0} scored cells exported`;
}

export async function exportJson(): Promise<string> {
  const snapshot = await buildDatasetSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });

  downloadBlob(exportFilename("json"), blob);
  return `${snapshot.records.supplies.length + snapshot.records.demands.length + snapshot.records.prices.length + snapshot.records.matches.length} records exported`;
}

export async function exportCsv(): Promise<string> {
  const snapshot = await buildDatasetSnapshot();
  const blob = new Blob([rowsToCsv(recordsToRows(snapshot))], {
    type: "text/csv;charset=utf-8",
  });

  downloadBlob(exportFilename("csv"), blob);
  return `${snapshot.records.supplies.length + snapshot.records.demands.length + snapshot.records.prices.length + snapshot.records.matches.length} records exported`;
}

export async function refreshReferenceCache(): Promise<void> {
  await ensureReferenceData(true);
}

export class DatasetImportError extends Error {}

const MATCH_STATUSES: MatchStatus[] = ["open", "contacted", "deal", "closed"];

function normalizeMatch(record: unknown): MatchRecord | null {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const candidate = record as Partial<MatchRecord>;
  const productId = Number(candidate.productId);
  const locationName =
    typeof candidate.locationName === "string" && candidate.locationName.trim()
      ? candidate.locationName
      : "";
  const productNumber = Number.isFinite(productId) ? productId : 0;

  if (!productNumber || !locationName) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    cellKey:
      typeof candidate.cellKey === "string" && candidate.cellKey
        ? candidate.cellKey
        : `${productNumber}|${locationName}`,
    productId: productNumber,
    productName:
      typeof candidate.productName === "string" ? candidate.productName : "Unknown product",
    productUnit:
      typeof candidate.productUnit === "string" ? candidate.productUnit : "",
    locationName,
    county: typeof candidate.county === "string" ? candidate.county : "",
    opportunityScore: Number.isFinite(Number(candidate.opportunityScore))
      ? Number(candidate.opportunityScore)
      : 0,
    confidenceScore: Number.isFinite(Number(candidate.confidenceScore))
      ? Number(candidate.confidenceScore)
      : 0,
    entrySignal:
      candidate.entrySignal === "strong-entry" ||
      candidate.entrySignal === "promising" ||
      candidate.entrySignal === "avoid" ||
      candidate.entrySignal === "insufficient-data"
        ? candidate.entrySignal
        : "insufficient-data",
    status:
      candidate.status && MATCH_STATUSES.includes(candidate.status as MatchStatus)
        ? (candidate.status as MatchStatus)
        : "open",
    createdAt:
      typeof candidate.createdAt === "string" ? candidate.createdAt : now,
    updatedAt:
      typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
    outcomeNotes:
      typeof candidate.outcomeNotes === "string" ? candidate.outcomeNotes : null,
    dismissed: Boolean(candidate.dismissed),
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function parseDatasetSnapshot(text: string): DatasetSnapshot {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DatasetImportError("Not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new DatasetImportError("Expected an object, got something else.");
  }

  const snapshot = parsed as Partial<DatasetSnapshot>;

  if (snapshot.schema !== "sarateal-dataset") {
    throw new DatasetImportError("Not a Sarateal dataset export (missing schema marker).");
  }

  if (snapshot.version !== 1 && snapshot.version !== 2) {
    throw new DatasetImportError(`Unsupported export version ${snapshot.version ?? "unknown"}.`);
  }

  return parsed as DatasetSnapshot;
}

export function dedupeMatchesByCellKey(matches: MatchRecord[]): MatchRecord[] {
  return [...new Map(matches.map((match) => [match.cellKey, match])).values()];
}

export function normalizeMatchEvents(raw: unknown): MatchEventRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const events: MatchEventRecord[] = [];

  for (const item of raw) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const candidate = item as Partial<MatchEventRecord>;
    const matchId = Number(candidate.matchId);
    const status = candidate.status;
    const at = typeof candidate.at === "string" ? candidate.at : "";

    if (
      !Number.isInteger(matchId) ||
      matchId <= 0 ||
      !MATCH_STATUSES.includes(status as MatchStatus) ||
      !Number.isFinite(Date.parse(at))
    ) {
      continue;
    }

    events.push({ matchId, status: status as MatchStatus, at });
  }

  return events;
}

export interface ImportSummary {
  supplies: number;
  demands: number;
  prices: number;
  matches: number;
  matchesAfterDedupe: number;
  droppedMatches: number;
  current: { supplies: number; demands: number; prices: number; matches: number };
  pendingReplace: boolean;
  sample: Array<{ kind: string; text: string }>;
}

export function summarizeImport(
  snapshot: DatasetSnapshot,
  current?: { supplies: number; demands: number; prices: number; matches: number },
): ImportSummary {
  const records = snapshot.records ?? {};
  const supplies = asArray<SupplyRecord>(records.supplies);
  const demands = asArray<DemandRecord>(records.demands);
  const prices = asArray<PriceRecord>(records.prices);
  const matches = asArray<MatchRecord>(records.matches)
    .map(normalizeMatch)
    .filter((match): match is MatchRecord => match !== null);

  const deduped = dedupeMatchesByCellKey(matches);

  const sample: Array<{ kind: string; text: string }> = [];
  const pushSample = (kind: string, rows: Array<{ productName?: string; county?: string; locationName?: string }>) => {
    if (rows.length === 0) {
      sample.push({ kind, text: "none" });
      return;
    }

    for (const row of rows.slice(0, 3)) {
      const place = kind === "match" ? row.locationName : row.county;

      sample.push({ kind, text: `${row.productName ?? "?"} · ${place ?? ""}`.trim() });
    }
  };

  pushSample("supply", supplies);
  pushSample("demand", demands);
  pushSample("price", prices);
  pushSample("match", matches);

  const existing = current ?? { supplies: 0, demands: 0, prices: 0, matches: 0 };

  return {
    supplies: supplies.length,
    demands: demands.length,
    prices: prices.length,
    matches: matches.length,
    matchesAfterDedupe: deduped.length,
    droppedMatches: matches.length - deduped.length,
    current: existing,
    pendingReplace:
      existing.supplies > 0 ||
      existing.demands > 0 ||
      existing.prices > 0 ||
      existing.matches > 0,
    sample,
  };
}

export async function importDatasetSnapshot(snapshot: DatasetSnapshot): Promise<string> {
  const supplies = asArray<SupplyRecord>(snapshot.records?.supplies).filter(
    (record) => typeof record === "object" && record !== null,
  );
  const demands = asArray<DemandRecord>(snapshot.records?.demands).filter(
    (record) => typeof record === "object" && record !== null,
  );
  const prices = asArray<PriceRecord>(snapshot.records?.prices).filter(
    (record) => typeof record === "object" && record !== null,
  );
  const matches = asArray<MatchRecord>(snapshot.records?.matches)
    .map(normalizeMatch)
    .filter((match): match is MatchRecord => match !== null);

  const uniqueMatches = dedupeMatchesByCellKey(matches);
  const importedEvents = normalizeMatchEvents(snapshot.matchEvents);
  const eventsByOriginalMatchId = new Map<number, MatchEventRecord[]>();

  for (const event of importedEvents) {
    const bucket = eventsByOriginalMatchId.get(event.matchId) ?? [];

    bucket.push(event);
    eventsByOriginalMatchId.set(event.matchId, bucket);
  }

  await db.transaction(
    "rw",
    [db.supplies, db.demands, db.prices, db.matches, db.matchEvents],
    async () => {
      await Promise.all([
        db.supplies.clear(),
        db.demands.clear(),
        db.prices.clear(),
        db.matches.clear(),
        db.matchEvents.clear(),
      ]);
      const matchKeys = (await db.matches.bulkPut(uniqueMatches)) as unknown as number[];

      for (let index = 0; index < uniqueMatches.length; index += 1) {
        const match = uniqueMatches[index];
        const newMatchId = matchKeys[index] ?? match.id;

        if (newMatchId === undefined) {
          continue;
        }

        const originalId = match.id;
        const imported = originalId !== undefined ? eventsByOriginalMatchId.get(originalId) : undefined;
        const events = imported?.length ? imported : [{ status: match.status, at: match.updatedAt }];

        for (const event of events) {
          await db.matchEvents.add({
            matchId: newMatchId as number,
            status: event.status,
            at: event.at,
          });
        }
      }

      await Promise.all([
        db.supplies.bulkPut(supplies),
        db.demands.bulkPut(demands),
        db.prices.bulkPut(prices),
      ]);
    },
  );

  return `${supplies.length} supplies, ${demands.length} demands, ${prices.length} prices and ${uniqueMatches.length} matches restored.`;
}

export function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  const fields: string[] = [];
  let buffer = "";
  let quoted = false;

  const pushField = () => {
    fields.push(buffer);
    buffer = "";
  };

  const pushLine = () => {
    if (fields.length > 1 || fields[0] !== "") {
      lines.push([...fields]);
    }
    fields.length = 0;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          buffer += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        buffer += char;
      }

      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\n") {
      pushField();
      pushLine();
    } else if (char !== "\r") {
      buffer += char;
    }
  }

  if (quoted) {
    throw new DatasetImportError("Unterminated quoted field in CSV.");
  }

  if (buffer.length > 0 || fields.length > 0) {
    pushField();
    pushLine();
  }

  return lines;
}

function rowValue(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value) !== "") {
      return String(value);
    }
  }

  return "";
}

function rowNumber(row: CsvRow, keys: string[]): number {
  const value = Number(rowValue(row, keys));

  return Number.isFinite(value) ? value : 0;
}

const ENTRY_SIGNALS: EntrySignalRef[] = [
  "strong-entry",
  "promising",
  "avoid",
  "insufficient-data",
];

interface CsvParseResult {
  snapshot: DatasetSnapshot;
  skippedRows: Array<{ line: number; reason: string }>;
}

export async function parseDatasetCsv(
  text: string,
  knownProducts?: Array<{ id: number; name: string }>,
): Promise<CsvParseResult> {
  const lines = parseCsv(text);

  if (lines.length === 0) {
    throw new DatasetImportError("CSV has no header row.");
  }

  const header = lines[0];
  const rows: CsvRow[] = lines.slice(1).map((line) => {
    const row: CsvRow = {};

    header.forEach((key, index) => {
      if (key) {
        row[key] = line[index] ?? "";
      }
    });

    return row;
  });

  if (rows.length === 0) {
    throw new DatasetImportError("CSV contains no records.");
  }

  const products = knownProducts ?? (await db.products.toArray());
  const productById = new Map(products.map((product) => [product.id, product.name]));
  const productNameToId = new Map(
    products.map((product) => [product.name.toLowerCase(), product.id]),
  );
  const [countyCount, marketCount] =
    knownProducts !== undefined
      ? [0, 0]
      : await Promise.all([db.counties.count(), db.markets.count()]);

  const supplies: SupplyRecord[] = [];
  const demands: DemandRecord[] = [];
  const prices: PriceRecord[] = [];
  const matches: MatchRecord[] = [];
  const skippedRows: Array<{ line: number; reason: string }> = [];
  const skip = (line: number, reason: string) => {
    skippedRows.push({ line, reason });
  };

  rows.forEach((row, dataIndex) => {
    const line = dataIndex + 2;
    const recordType = rowValue(row, ["recordType", "type"]).toLowerCase();
    const now = new Date().toISOString();

    const id = rowNumber(row, ["id"]) || undefined;
    const county = rowValue(row, ["county"]);
    const marketName = rowValue(row, ["marketName"]) || null;
    const notes = rowValue(row, ["notes"]) || null;
    const contributor = rowValue(row, ["contributor"]) || "Unknown";

    let productId = rowNumber(row, ["productId"]);
    const productName = rowValue(row, ["productName"]);
    const productByName = productNameToId.get(productName.toLowerCase());
    const resolvedId = productId > 0 ? productId : (productByName ?? 0);
    const resolvedName = productById.get(resolvedId) ?? productName;

    if (recordType === "supply" || recordType === "demand") {
      const quantity = rowNumber(row, ["quantity"]);

      if (quantity <= 0) {
        skip(line, "supply/demand needs a positive quantity");
        return;
      }

      const record = {
        id,
        contributor,
        productId: resolvedId,
        productName: resolvedName || "Unknown product",
        quantity,
        unit: rowValue(row, ["unit"]) || "units",
        county,
        marketName,
        availableUntil: null,
        notes,
        createdAt: rowValue(row, ["createdAt"]) || now,
      };

      if (recordType === "supply") {
        supplies.push({ ...record, availableFrom: rowValue(row, ["date"]) } as SupplyRecord);
      } else {
        demands.push({ ...record, neededFrom: rowValue(row, ["date"]) } as DemandRecord);
      }

      return;
    }

    if (recordType === "price") {
      const amount = rowNumber(row, ["price"]);

      if (amount <= 0) {
        skip(line, "price needs a positive amount");
        return;
      }

      prices.push({
        id,
        contributor,
        productId: resolvedId,
        productName: resolvedName || "Unknown product",
        unit: rowValue(row, ["unit"]) || "units",
        price: amount,
        currency: rowValue(row, ["currency"]) || "KES",
        county,
        marketName,
        observedOn: rowValue(row, ["date"]),
        notes,
        createdAt: rowValue(row, ["createdAt"]) || now,
      });

      return;
    }

    if (recordType === "match") {
      productId = resolvedId;
      const locationName = rowValue(row, ["locationName"]);

      if (!productId || !locationName) {
        skip(line, "match needs a productId and locationName");
        return;
      }

      const entrySignal = rowValue(row, ["entrySignal"]);
      const status = rowValue(row, ["status"]);

      matches.push({
        cellKey: rowValue(row, ["cellKey"]) || `${productId}|${locationName}`,
        productId,
        productName: resolvedName || "Unknown product",
        productUnit: rowValue(row, ["unit"]),
        locationName,
        county,
        opportunityScore: rowNumber(row, ["opportunityScore"]),
        confidenceScore: rowNumber(row, ["confidenceScore"]),
        entrySignal: ENTRY_SIGNALS.includes(entrySignal as EntrySignalRef)
          ? (entrySignal as EntrySignalRef)
          : "insufficient-data",
        status: MATCH_STATUSES.includes(status as MatchStatus)
          ? (status as MatchStatus)
          : "open",
        createdAt: rowValue(row, ["createdAt"]) || now,
        updatedAt: rowValue(row, ["date"]) || now,
        outcomeNotes: rowValue(row, ["outcomeNotes"]) || null,
        dismissed: rowValue(row, ["dismissed"]).toLowerCase() === "true",
      });

      return;
    }

    skip(line, `unknown record type "${recordType || "<empty>"}"`);
  });

  if (supplies.length + demands.length + prices.length + matches.length === 0) {
    throw new DatasetImportError("No valid records found in the CSV.");
  }

  return {
    snapshot: {
      schema: "sarateal-dataset",
      version: 1,
      exportedAt: new Date().toISOString(),
      records: { supplies, demands, prices, matches },
      reference: {
        counties: countyCount,
        products: products.length,
        markets: marketCount,
        lastSeededAt: null,
      },
    },
    skippedRows,
  };
}