import assert from "node:assert/strict";
import { test } from "node:test";

import { findNearDuplicates, plausibilityOf } from "../src/lib/hygiene";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../src/lib/db";

const NOW = "2026-09-05T00:00:00.000Z";

function supply(overrides: Partial<SupplyRecord> = {}): SupplyRecord {
  return {
    contributor: "A",
    productId: 3,
    productName: "Maize",
    quantity: 500,
    unit: "kg",
    county: "Nairobi",
    marketName: "Wakulima Market",
    availableFrom: "2026-09-05",
    availableUntil: null,
    notes: null,
    createdAt: NOW,
    ...overrides,
  } as SupplyRecord;
}

function demand(overrides: Partial<DemandRecord> = {}): DemandRecord {
  return {
    contributor: "B",
    productId: 3,
    productName: "Maize",
    quantity: 200,
    unit: "kg",
    county: "Nairobi",
    marketName: "Wakulima Market",
    neededFrom: "2026-09-05",
    neededUntil: null,
    notes: null,
    createdAt: NOW,
    ...overrides,
  } as DemandRecord;
}

function price(overrides: Partial<PriceRecord> = {}): PriceRecord {
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
    createdAt: NOW,
    ...overrides,
  } as PriceRecord;
}

test("plausibilityOf flags zero and absurd prices and quantities", () => {
  assert.equal(plausibilityOf(price()).ok, true);

  assert.deepEqual(plausibilityOf(price({ price: 0 })).reasons, [
    "price outside a plausible range",
  ]);
  assert.deepEqual(plausibilityOf(price({ quantity: 2_000_000 })).reasons, [
    "quantity outside a plausible range",
  ]);
  assert.equal(plausibilityOf(price({ price: 0, quantity: -3 })).ok, false);
});

test("plausibilityOf flags missing or unparseable dates", () => {
  assert.deepEqual(plausibilityOf(price({ observedOn: "not-a-date" })).reasons, [
    "missing or unparseable date",
  ]);
});

test("near-duplicates pair same product + market + contributor within 7 days", () => {
  const pairs = findNearDuplicates(
    [
      price({ id: 1, contributor: "A", observedOn: "2026-09-01" }),
      price({ id: 2, contributor: "A", observedOn: "2026-09-05" }),
    ],
    [],
    [],
  );

  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].kind, "price");
  assert.deepEqual([pairs[0].firstId, pairs[0].secondId], [1, 2]);
});

test("near-duplicates ignore different kinds, markets or far dates", () => {
  const differentKinds = findNearDuplicates(
    [price({ id: 1, contributor: "A", observedOn: "2026-09-01" })],
    [supply({ contributor: "A" })],
    [],
  );

  const differentMarkets = findNearDuplicates(
    [
      price({ id: 1, observedOn: "2026-09-01", marketName: "Market One" }),
      price({ id: 2, observedOn: "2026-09-02", marketName: "Market Two" }),
    ],
    [],
    [],
  );

  const oldAndNew = findNearDuplicates(
    [
      price({ id: 1, observedOn: "2026-08-01" }),
      price({ id: 2, observedOn: "2026-09-05" }),
    ],
    [],
    [],
  );

  assert.equal(differentKinds.length, 0);
  assert.equal(differentMarkets.length, 0);
  assert.equal(oldAndNew.length, 0);
});

test("near-duplicates cover demands and supplies too", () => {
  const supplyPairs = findNearDuplicates(
    [],
    [
      supply({ id: 1, contributor: "A", availableFrom: "2026-09-01" }),
      supply({ id: 2, contributor: "A", availableFrom: "2026-09-06" }),
    ],
    [],
  );
  const demandPairs = findNearDuplicates(
    [],
    [],
    [
      demand({ id: 1, contributor: "C", neededFrom: "2026-09-01" }),
      demand({ id: 2, contributor: "C", neededFrom: "2026-09-02" }),
    ],
  );

  assert.equal(supplyPairs.length, 1);
  assert.equal(supplyPairs[0].kind, "supply");
  assert.equal(demandPairs.length, 1);
  assert.equal(demandPairs[0].kind, "demand");
});