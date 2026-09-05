import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DatasetImportError,
  dedupeMatchesByCellKey,
  normalizeMatchEvents,
  parseDatasetCsv,
  parseDatasetSnapshot,
  rowsToCsv,
  summarizeImport,
} from "../src/lib/export";

const HEADER = [
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

function dateToTimestamp(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function row(values: Record<string, string>): string[] {
  return HEADER.map((key) => values[key] ?? "");
}

const PRODUCTS = [
  { id: 3, name: "Maize" },
  { id: 4, name: "Beans" },
];

test("CSV: quoted fields and escaped quotes are parsed", () => {
  const csv = rowsToCsv([
    { product: "Maize, dry", note: 'said "harvest"', country: "KE" },
  ]);

  assert.ok(csv.includes('"Maize, dry"'), "comma field is quoted");
  assert.ok(csv.includes('"said ""harvest"""'), "quotes are escaped");
});

test("CSV: round-trip import parses quoted fields, numbers and booleans", async () => {
  const supplyRow = row({
    recordType: "supply",
    id: "11",
    contributor: "Alice",
    productId: "3",
    productName: "Maize",
    quantity: "2000",
    unit: "kg",
    county: "Bungoma",
    date: "2026-09-05",
    createdAt: dateToTimestamp("2026-09-05"),
  });
  const matchRow = row({
    recordType: "match",
    id: "13",
    contributor: "Dana",
    productId: "4",
    productName: "Beans",
    unit: "kg",
    locationName: "Busia Market",
    entrySignal: "strong-entry",
    status: "open",
    dismissed: "true",
    opportunityScore: "76",
    confidenceScore: "58",
    outcomeNotes: "Talked today",
    date: "2026-09-05",
    createdAt: dateToTimestamp("2026-09-05"),
  });
  const bogusRow = row({ recordType: "bogus", id: "14" });

  // Build raw CSV bytes manually so the parser is exercised: a quoted field
  // with an internal comma (productName) and doubled quotes (notes).
  const priceRow = row({
    recordType: "price",
    id: "12",
    contributor: "Bob",
    productId: "3",
    productName: "Maize, dry",
    unit: "kg",
    price: "65",
    marketName: "Wakulima Market",
    notes: 'said "harvest"',
    date: "2026-09-05",
    createdAt: dateToTimestamp("2026-09-05"),
  });
  priceRow[4] = '"Maize, dry"';
  priceRow[18] = '"said ""harvest"""';

  const csv = [
    HEADER.join(","),
    supplyRow.join(","),
    priceRow.join(","),
    matchRow.join(","),
    bogusRow.join(","),
  ].join("\r\n");

  const { snapshot, skippedRows } = await parseDatasetCsv(csv, PRODUCTS);

  assert.equal(skippedRows.length, 1, "unknown record types are skipped");
  assert.equal(skippedRows[0].line, 5, "skip reason points at the offending row");
  assert.match(skippedRows[0].reason, /bogus/, "skip reason names the record type");

  const { supplies, prices, matches } = snapshot.records;

  assert.equal(supplies.length, 1);
  assert.equal(prices.length, 1);
  assert.equal(matches.length, 1);

  const [supplyRecord] = supplies;
  assert.equal(supplyRecord.productId, 3);
  assert.equal(supplyRecord.productName, "Maize");
  assert.equal(supplyRecord.quantity, 2000);
  assert.equal(supplyRecord.marketName, null, "empty marketName becomes null");
  assert.equal(supplyRecord.availableFrom, "2026-09-05");
  assert.equal(supplyRecord.contributor, "Alice");

  const [priceRecord] = prices;
  assert.equal(priceRecord.productName, "Maize", "productId wins over raw name");
  assert.equal(priceRecord.price, 65);
  assert.equal(priceRecord.currency, "KES", "missing currency defaults");
  assert.equal(priceRecord.observedOn, "2026-09-05");
  assert.equal(priceRecord.notes, 'said "harvest"', "doubled quotes parse back");
  assert.equal(priceRecord.marketName, "Wakulima Market");

  const [matchRecord] = matches;
  assert.equal(matchRecord.cellKey, "4|Busia Market");
  assert.equal(matchRecord.status, "open");
  assert.equal(matchRecord.entrySignal, "strong-entry");
  assert.equal(matchRecord.dismissed, true);
  assert.equal(matchRecord.opportunityScore, 76);
  assert.equal(matchRecord.confidenceScore, 58);
  assert.equal(matchRecord.outcomeNotes, "Talked today");
});

test("CSV: invalid inputs are rejected cleanly", async () => {
  await assert.rejects(() => parseDatasetCsv("", PRODUCTS), DatasetImportError);
  await assert.rejects(
    () => parseDatasetCsv("recordType,id\nsupply,1\n", PRODUCTS),
    DatasetImportError,
  );
});

test("JSON: schema marker and version are enforced", () => {
  assert.throws(() => parseDatasetSnapshot("nope"), DatasetImportError);
  assert.throws(
    () => parseDatasetSnapshot(JSON.stringify({ schema: "other", version: 1 })),
    DatasetImportError,
  );
  assert.throws(
    () => parseDatasetSnapshot(JSON.stringify({ schema: "sarateal-dataset", version: 99 })),
    DatasetImportError,
  );
});

test("JSON: version 2 snapshots (with match events) parse", () => {
  const snapshot = parseDatasetSnapshot(
    JSON.stringify({
      schema: "sarateal-dataset",
      version: 2,
      exportedAt: "2026-09-05T00:00:00.000Z",
      records: { supplies: [], demands: [], prices: [], matches: [] },
      matchEvents: [{ matchId: 3, status: "open", at: "2026-09-05T00:00:00.000Z" }],
      reference: { counties: 0, products: 0, markets: 0, lastSeededAt: null },
    }),
  );

  assert.equal(snapshot.version, 2);
  assert.ok(snapshot.matchEvents?.length === 1);
});

function summaryFixture(): ReturnType<typeof parseDatasetSnapshot> {
  const snapshot = parseDatasetSnapshot(
    JSON.stringify({
      schema: "sarateal-dataset",
      version: 1,
      exportedAt: "2026-09-05T00:00:00.000Z",
      records: {
        supplies: [
          { productName: "Maize", county: "Bungoma" },
          { productName: "Beans", county: "Bungoma" },
        ],
        demands: [],
        prices: [{ productName: "Maize", county: "Bungoma" }],
        matches: [
          { cellKey: "3|A", productId: 3, locationName: "A", productName: "Maize" },
          { cellKey: "3|A", productId: 3, locationName: "A", productName: "Maize" },
        ],
      },
      reference: { counties: 0, products: 0, markets: 0, lastSeededAt: null },
    }),
  );

  return snapshot;
}

test("JSON: summarizeImport counts records, dedupes matches, samples rows", () => {
  const summary = summarizeImport(summaryFixture());

  assert.equal(summary.supplies, 2);
  assert.equal(summary.demands, 0);
  assert.equal(summary.prices, 1);
  assert.equal(summary.matches, 2);
  assert.equal(summary.matchesAfterDedupe, 1);
  assert.equal(summary.droppedMatches, 1);
  assert.equal(summary.pendingReplace, false);
  assert.ok(summary.sample.length >= 4);
});

test("JSON: summarizeImport flags an existing dataset as pendingReplace", () => {
  const summary = summarizeImport(summaryFixture(), {
    supplies: 1,
    demands: 0,
    prices: 0,
    matches: 0,
  });

  assert.equal(summary.pendingReplace, true);
  assert.equal(summary.current.supplies, 1);
});

test("JSON: dedupeMatchesByCellKey keeps one record per cell", () => {
  const result = dedupeMatchesByCellKey([
    { cellKey: "3|A", productId: 3, locationName: "A", productName: "First" } as never,
    { cellKey: "3|A", productId: 3, locationName: "A", productName: "Second" } as never,
  ]);

  assert.equal(result.length, 1);
  assert.ok(["First", "Second"].includes(result[0].productName));
});

test("JSON: normalizeMatchEvents drops invalid payloads and keeps valid ones", () => {
  const events = normalizeMatchEvents([
    { matchId: 3, status: "deal", at: "2026-09-05T00:00:00.000Z" },
    { matchId: "junk", status: "open", at: "2026-09-05T00:00:00.000Z" },
    { matchId: 5, status: "not-a-status", at: "2026-09-05T00:00:00.000Z" },
    { matchId: 7, status: "closed", at: "never" },
    "garbage",
  ]);

  assert.equal(events.length, 1);
  assert.equal(events[0].status, "deal");
  assert.equal(events[0].matchId, 3);
});