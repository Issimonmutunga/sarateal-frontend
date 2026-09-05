import assert from "node:assert/strict";
import { test } from "node:test";

import {
  countyLeaderboard,
  pipelineFunnel,
  surfaceCoverage,
  topOpportunities,
} from "../src/engine/insights";
import type { OpportunityCell } from "../src/engine/types";
import { unitConflicts } from "../src/lib/hygiene";
import type { PriceRecord } from "../src/lib/db";

const BASE_CELL: Omit<OpportunityCell, "entrySignal" | "county" | "opportunity"> = {
  key: "k",
  productId: 1,
  productName: "Maize",
  productUnit: "kg",
  locationName: "Wakulima Market",
  supplyUnits: 0,
  demandUnits: 0,
  pricePoints: 0,
  supplyEntries: 0,
  demandEntries: 0,
  priceEntries: 0,
  confidence: 50,
  components: {
    ssd: { key: "ssd", value: 80, confidence: 0.9, weight: 0.3, observations: 5, note: "" },
    price: { key: "price", value: 70, confidence: 0.8, weight: 0.3, observations: 5, note: "" },
    access: { key: "access", value: 60, confidence: 0.7, weight: 0.15, observations: 5, note: "" },
    seasonal: { key: "seasonal", value: 50, confidence: 0.6, weight: 0.15, observations: 5, note: "" },
    competition: { key: "competition", value: 40, confidence: 0.5, weight: 0.1, observations: 5, note: "" },
  },
};

function cell(overrides: Partial<OpportunityCell>): OpportunityCell {
  return { ...BASE_CELL, ...overrides };
}

test("topOpportunities ranks strong-entry before promising, opportunity inside a band", () => {
  const cells = [
    cell({ key: "a", county: "Nairobi", entrySignal: "promising", opportunity: 90 }),
    cell({ key: "b", county: "Kiambu", entrySignal: "strong-entry", opportunity: 70 }),
    cell({ key: "c", county: "Machakos", entrySignal: "strong-entry", opportunity: 80 }),
    cell({ key: "d", county: "Nakuru", entrySignal: "avoid", opportunity: 95 }),
  ];

  const top = topOpportunities(cells, 3);

  assert.deepEqual(top.map((entry) => entry.cell.key), ["c", "b", "a"]);
});

test("topOpportunities skips cells without an opportunity", () => {
  const top = topOpportunities([
    cell({ key: "a", entrySignal: "insufficient-data", opportunity: null }),
    cell({ key: "b", entrySignal: "strong-entry", opportunity: 80 }),
  ]);

  assert.deepEqual(top.map((entry) => entry.cell.key), ["b"]);
});

test("countyLeaderboard aggregates actionable counts and average opportunity", () => {
  const counties = countyLeaderboard([
    cell({ key: "a", county: "Nairobi", entrySignal: "strong-entry", opportunity: 80, demandUnits: 10, supplyUnits: 5 }),
    cell({ key: "b", county: "Nairobi", entrySignal: "promising", opportunity: 60, demandUnits: 2, supplyUnits: 0 }),
    cell({ key: "c", county: "Kiambu", entrySignal: "avoid", opportunity: 50, demandUnits: 0, supplyUnits: 0 }),
  ]);

  assert.equal(counties[0].county, "Nairobi");
  assert.equal(counties[0].actionable, 2);
  assert.equal(counties[0].avgOpportunity, 70);
  assert.equal(counties[0].entryUnits, 17);
  assert.equal(counties.length, 2);
});

test("pipelineFunnel counts every status bucket", () => {
  const funnel = pipelineFunnel([
    { status: "open" },
    { status: "open" },
    { status: "contacted" },
    { status: "deal" },
    { status: "closed" },
  ]);

  assert.deepEqual(funnel, { open: 2, contacted: 1, deal: 1, closed: 1 });
});

test("surfaceCoverage separates scored, actionable and avoid cells", () => {
  const coverage = surfaceCoverage([
    cell({ key: "a", entrySignal: "strong-entry", opportunity: 80 }),
    cell({ key: "b", entrySignal: "promising", opportunity: 62 }),
    cell({ key: "c", entrySignal: "avoid", opportunity: 55 }),
    cell({ key: "d", entrySignal: "insufficient-data", opportunity: null }),
  ]);

  assert.deepEqual(coverage, { scored: 3, actionable: 2, insufficient: 1 });
});

function price(overrides: Partial<PriceRecord>): PriceRecord {
  return {
    contributor: "A",
    productId: 3,
    productName: "Maize",
    price: 60,
    currency: "KES",
    unit: "kg",
    county: "Nairobi",
    marketName: "Wakulima Market",
    observedOn: "2026-09-05",
    notes: null,
    createdAt: "2026-09-05T00:00:00.000Z",
    ...overrides,
  } as PriceRecord;
}

test("unitConflicts flags one market whose prices mix unit families", () => {
  const conflicts = unitConflicts([
    price({ unit: "kg" }),
    price({ unit: "kg" }),
    price({ unit: "tonnes" }),
    price({ unit: "kg" }),
  ]);

  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].units, ["kg", "tonnes"]);
  assert.equal(conflicts[0].count, 4);
  assert.equal(conflicts[0].marketName, "Wakulima Market");
});

test("unitConflicts ignores consistent markets and empty units", () => {
  const conflicts = unitConflicts([
    price({ unit: "kg" }),
    price({ unit: "kg" }),
    price({ productId: 4, productName: "Beans", marketName: "Kongowea" }),
    price({ unit: "" }),
  ]);

  assert.equal(conflicts.length, 0);
});