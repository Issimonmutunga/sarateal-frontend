import assert from "node:assert/strict";
import { test } from "node:test";

import { computeOpportunitySurface } from "../src/engine/index";
import type { ComponentKey, ComponentScore, OpportunityCell } from "../src/engine/types";
import { surfaceCsv } from "../src/lib/export";
import type { MatchRecord } from "../src/lib/db";
import type { County, Market, Product } from "../src/types/api";

const NOW = "2026-09-05T00:00:00.000Z";

function score(key: ComponentKey, value: number | null, confidence = 0): ComponentScore {
  return { key, value, confidence, weight: 0, observations: 0, note: "" };
}

function makeCell(overrides: Partial<OpportunityCell> = {}): OpportunityCell {
  return {
    key: "3|Nairobi",
    productId: 3,
    productName: "Maize",
    productUnit: "kg",
    category: "Grains",
    locationName: "Nairobi",
    county: "Nairobi",
    latitude: null,
    longitude: null,
    supplyUnits: 0,
    demandUnits: 0,
    pricePoints: 0,
    supplyEntries: 0,
    demandEntries: 0,
    priceEntries: 0,
    components: {
      ssd: score("ssd", null),
      price: score("price", null),
      access: score("access", null),
      seasonal: score("seasonal", null),
      competition: score("competition", 100),
    },
    opportunity: null,
    confidence: 0,
    entrySignal: "insufficient-data",
    records: { supply: [], demand: [], prices: [] },
    ...overrides,
  };
}

const COUNTIES: County[] = [
  { id: 1, name: "Nairobi", code: "047", region: "Nairobi", latitude: -1.286389, longitude: 36.817223 },
];

const MARKETS: Market[] = [
  { id: 1, name: "Wakulima Market", county: "Nairobi", type: "wholesale", latitude: -1.286389, longitude: 36.817223 },
];

const PRODUCTS: Product[] = [{ id: 3, name: "Maize", category: "Grains", unit: "kg" }];

test("surfaceCsv exports only scored cells and flags actionable rows", () => {
  const csv = surfaceCsv([
    makeCell({
      opportunity: 70,
      confidence: 60,
      entrySignal: "strong-entry",
      components: { ...makeCell().components, ssd: score("ssd", 70, 0.5) },
    }),
    makeCell({
      key: "3|Nakuru",
      locationName: "Nakuru",
      county: "Nakuru",
      entrySignal: "insufficient-data",
    }),
  ]);

  const lines = csv.trim().split(/\r?\n/);

  assert.equal(lines.length, 2, "one data row for one scored cell");
  assert.match(lines[0], /actionable/);
  assert.match(lines[0], /latestMatchStatus/);
  assert.match(lines[1], /,true,/);
  assert.doesNotMatch(lines[1], /Nakuru/);
});

test("surfaceCsv sorts scored cells by opportunity then confidence", () => {
  const csv = surfaceCsv([
    makeCell({ key: "3|A", locationName: "A", opportunity: 30, confidence: 10 }),
    makeCell({ key: "3|B", locationName: "B", opportunity: 80, confidence: 20 }),
    makeCell({
      key: "3|C",
      locationName: "C",
      opportunity: 80,
      confidence: 90,
    }),
  ]);

  const lines = csv.trim().split(/\r?\n/);
  const order = lines.slice(1).map((line) => line.split(",")[2]);

  assert.deepEqual(order, ["C", "B", "A"]);
});

test("surfaceCsv carries the latest match status per cell", () => {
  const matches: MatchRecord[] = [
    {
      id: 1,
      cellKey: "3|Nairobi",
      productId: 3,
      productName: "Maize",
      productUnit: "kg",
      locationName: "Nairobi",
      county: "Nairobi",
      opportunityScore: 70,
      confidenceScore: 60,
      entrySignal: "strong-entry",
      status: "open",
      createdAt: NOW,
      updatedAt: "2026-09-04T00:00:00.000Z",
      outcomeNotes: null,
      dismissed: false,
    },
    {
      id: 2,
      cellKey: "3|Nairobi",
      productId: 3,
      productName: "Maize",
      productUnit: "kg",
      locationName: "Nairobi",
      county: "Nairobi",
      opportunityScore: 70,
      confidenceScore: 60,
      entrySignal: "strong-entry",
      status: "deal",
      createdAt: "2026-09-02T00:00:00.000Z",
      updatedAt: "2026-09-05T00:00:00.000Z",
      outcomeNotes: "done",
      dismissed: false,
    },
  ];

  const csv = surfaceCsv([makeCell({ opportunity: 70, confidence: 60 })], matches);
  const line = csv.trim().split(/\r?\n/)[1];
  const columns = csv.trim().split(/\r?\n/)[0].split(",");
  const status = line.split(",")[columns.indexOf("latestMatchStatus")];

  assert.equal(status, "deal");
});

test("surfaceCsv returns empty text when nothing is scored", () => {
  assert.equal(surfaceCsv([makeCell()]), "");
});

test("surfaceCsv round-trips real engine cells with match status", async () => {
  const demands = Array.from({ length: 3 }, (_, index) => ({
    contributor: `B${index}`,
    productId: 3,
    productName: "Maize",
    quantity: 1000,
    unit: "kg",
    county: "Nairobi",
    marketName: "Wakulima Market",
    neededFrom: "2026-09-05",
    neededUntil: null,
    notes: null,
    createdAt: NOW,
  }));

  const cells = await computeOpportunitySurface({
    supplies: [],
    demands,
    prices: [],
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  assert.equal(cells.length, 1);
  assert.equal(cells[0].entrySignal, "promising");

  const matches: MatchRecord[] = [
    {
      id: 1,
      cellKey: cells[0].key,
      productId: 3,
      productName: "Maize",
      productUnit: "kg",
      locationName: cells[0].locationName,
      county: cells[0].county,
      opportunityScore: cells[0].opportunity as number,
      confidenceScore: cells[0].confidence,
      entrySignal: cells[0].entrySignal,
      status: "contacted",
      createdAt: NOW,
      updatedAt: NOW,
      outcomeNotes: null,
      dismissed: false,
    },
  ];

  const csv = surfaceCsv(cells, matches);
  const header = csv.trim().split(/\r?\n/)[0].split(",");
  const line = csv.trim().split(/\r?\n/)[1].split(",");
  const read = (column: string) => line[header.indexOf(column)];

  assert.equal(read("actionable"), "true");
  assert.equal(read("latestMatchStatus"), "contacted");
  assert.ok(Number(read("opportunity")) > 90);
  assert.equal(read("entrySignal"), "promising");
});