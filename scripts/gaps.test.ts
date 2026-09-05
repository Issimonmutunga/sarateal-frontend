import assert from "node:assert/strict";
import { test } from "node:test";

import { evidenceGapsForCell, surfaceCoverage } from "../src/engine/gaps";
import { computeOpportunitySurface } from "../src/engine/index";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../src/lib/db";
import type { County, Market, Product } from "../src/types/api";

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
  };
}

function demand(overrides: Partial<DemandRecord> = {}): DemandRecord {
  return {
    contributor: "B",
    productId: 3,
    productName: "Maize",
    quantity: 500,
    unit: "kg",
    county: "Nairobi",
    marketName: "Wakulima Market",
    neededFrom: "2026-09-05",
    neededUntil: null,
    notes: null,
    createdAt: NOW,
    ...overrides,
  };
}

function price(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    contributor: "C",
    productId: 3,
    productName: "Maize",
    unit: "kg",
    price: 60,
    currency: "KES",
    county: "Nairobi",
    marketName: "Wakulima Market",
    observedOn: "2026-09-05",
    notes: null,
    createdAt: NOW,
    ...overrides,
  };
}

const COUNTIES: County[] = [
  { id: 1, name: "Nairobi", code: "047", region: "Nairobi", latitude: -1.286389, longitude: 36.817223 },
];

const MARKETS: Market[] = [
  { id: 1, name: "Wakulima Market", county: "Nairobi", type: "wholesale", latitude: -1.286389, longitude: 36.817223 },
];

const PRODUCTS: Product[] = [
  { id: 3, name: "Maize", category: "Grains", unit: "kg" },
];

test("gaps: a single record surfaces blocking evidence gaps with guidance", async () => {
  const cells = await computeOpportunitySurface({
    supplies: [supply()],
    demands: [],
    prices: [],
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  assert.equal(cells.length, 1);
  const gaps = evidenceGapsForCell(cells[0]);
  const blocking = gaps.filter((item) => item.blocking);

  assert.ok(blocking.length >= 3, `expected several blocking gaps, got ${blocking.length}`);

  const ssd = gaps.find((item) => item.component === "ssd");
  assert.ok(ssd, "supply-demand gap exists");
  assert.equal(ssd?.current, 1);
  assert.equal(ssd?.needed, 3);
  assert.match(ssd?.text ?? "", /2 more/);

  const priceGap = gaps.find((item) => item.component === "price");
  assert.equal(priceGap?.blocking, true);
  assert.match(priceGap?.text ?? "", /No price records/);
});

test("gaps: fully evidenced cell is unblocked and the summary reflects it", async () => {
  const supplies = Array.from({ length: 3 }, (_, index) => supply({ contributor: `S${index}` }));
  const demands = Array.from({ length: 3 }, (_, index) => demand({ contributor: `D${index}` }));
  const priceDays = ["2026-08-22", "2026-08-28", "2026-09-03"];
  const prices = priceDays.map((observedOn, index) => price({ price: 50 + index * 5, observedOn }));

  const cells = await computeOpportunitySurface({
    supplies,
    demands,
    prices,
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  const [cell] = cells;
  const gaps = evidenceGapsForCell(cell);

  assert.ok(
    gaps.every((item) => !item.blocking),
    `no blocking gaps expected, got ${JSON.stringify(gaps)}`,
  );

  const coverage = surfaceCoverage(cells);
  assert.equal(coverage.cells, 1);
  assert.equal(coverage.unblocked, 1);
});

test("gaps: coverage summary counts blocked cells and gaps", async () => {
  const cells = await computeOpportunitySurface({
    supplies: [],
    demands: [demand()],
    prices: [],
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  const coverage = surfaceCoverage(cells);

  assert.equal(coverage.cells, 1);
  assert.equal(coverage.scored, 0, "a single record never reaches the three-point floor");
  assert.equal(coverage.unblocked, 0);
  assert.ok(coverage.totalGaps >= 4, "multiple components lack evidence");
});