import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeAccessibility,
  computePrice,
  computeRawCompetition,
  computeSeasonal,
  computeSupplyDemand,
  type CellCore,
  type ProviderLocation,
} from "../src/engine/components";
import { evidenceConfidence } from "../src/engine/confidence";
import { computeOpportunitySurface, suitabilityFromWeatherSignals } from "../src/engine/index";
import { COMPONENT_WEIGHTS, entrySignalFor } from "../src/engine/types";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../src/lib/db";
import type { County, Market, Product, WeatherRiskSignal } from "../src/types/api";

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
  { id: 4, name: "Cabbage", category: "Vegetables", unit: "kg" },
];

function cellCore(overrides: Partial<CellCore> = {}): CellCore {
  return {
    locationName: "Wakulima Market",
    county: "Nairobi",
    latitude: -1.286389,
    longitude: 36.817223,
    supply: [],
    demand: [],
    prices: [],
    ...overrides,
  };
}

function providerOf(core: CellCore): ProviderLocation {
  return {
    locationName: core.locationName,
    county: core.county,
    latitude: core.latitude,
    longitude: core.longitude,
    supplyUnits: core.supply.reduce((sum, record) => sum + record.quantity, 0),
    demandUnits: core.demand.reduce((sum, record) => sum + record.quantity, 0),
    pricePoints: core.prices.length,
    suppliers: core.supply,
    demands: core.demand,
    prices: core.prices,
    records: [...core.supply, ...core.demand, ...core.prices],
  };
}

test("entry signal truth table follows the 2x2 rule", () => {
  assert.equal(entrySignalFor(70, 65), "strong-entry");
  assert.equal(entrySignalFor(70, 40), "promising");
  assert.equal(entrySignalFor(40, 65), "avoid");
  assert.equal(entrySignalFor(30, 25), "insufficient-data");
});

test("component weights are fixed by the methodology", () => {
  assert.deepEqual(COMPONENT_WEIGHTS, {
    ssd: 0.3,
    price: 0.3,
    access: 0.15,
    seasonal: 0.15,
    competition: 0.1,
  });
});

test("supply-demand favours unmet demand", () => {
  const balanced = computeSupplyDemand(cellCore({ supply: [supply()], demand: [demand()] }));
  assert.ok(Math.abs((balanced.value as number) - 50) < 1, "balanced cell scores ~50");

  const demandOnly = computeSupplyDemand(
    cellCore({ demand: [demand({ contributor: "C" }), demand({ contributor: "D" }), demand({ contributor: "E" })] }),
  );
  assert.ok((demandOnly.value as number) > 65, `demand-only scores high, got ${demandOnly.value}`);
  assert.match(demandOnly.note, /zero supply/);

  const supplyOnly = computeSupplyDemand(
    cellCore({ supply: [supply(), supply({ contributor: "D" }), supply({ contributor: "E" })] }),
  );
  assert.ok((supplyOnly.value as number) < 35, `supply-only scores low, got ${supplyOnly.value}`);
});

test("confidence requires at least three real points", () => {
  assert.equal(evidenceConfidence({ records: [] }), 0);

  const one = [demand()];
  const two = [demand(), demand({ contributor: "D" })];
  const three = [demand(), demand({ contributor: "D" }), demand({ contributor: "E" })];

  assert.equal(evidenceConfidence({ records: one }), 0, "one point = no confidence");
  assert.equal(evidenceConfidence({ records: two }), 0, "two points = no confidence");
  assert.ok(
    evidenceConfidence({ records: three }) > 0,
    "three points begin contributing",
  );
});

test("confidence saturates at fifteen real points", () => {
  const fresh = Array.from({ length: 15 }, (_, index) =>
    demand({ contributor: `C${index % 3}`, createdAt: NOW }),
  );

  assert.ok(
    evidenceConfidence({ records: fresh }) > 0.98,
    "15 fresh plausible points nearly saturate confidence",
  );
});

test("stale evidence dilutes confidence", () => {
  const fresh = evidenceConfidence({ records: [demand(), demand({ contributor: "D" }), demand({ contributor: "E" })] });
  const stale = evidenceConfidence({
    records: [
      demand({ createdAt: "2020-01-01T00:00:00.000Z" }),
      demand({ createdAt: "2020-01-02T00:00:00.000Z", contributor: "D" }),
      demand({ createdAt: "2020-01-03T00:00:00.000Z", contributor: "E" }),
    ],
  });

  assert.ok(stale < fresh, `stale (${stale}) must be below fresh (${fresh})`);
});

test("plausibility rejects impossible observations", () => {
  const bad = demand({ price: 0, quantity: -5, contributor: "D" } as Partial<DemandRecord>);
  const good = evidenceConfidence({ records: [demand(), demand({ contributor: "D" }), demand({ contributor: "E" })] });
  const mixed = evidenceConfidence({ records: [demand(), demand({ contributor: "D" }), bad] });

  assert.ok(mixed < good, `impossible point suppresses confidence (${mixed} < ${good})`);
});

test("price component rewards rising markets with thin competition", () => {
  const rising = computePrice(
    cellCore({
      prices: [
        price({ price: 40, observedOn: "2026-07-01" }),
        price({ price: 50, observedOn: "2026-08-01" }),
        price({ price: 60, observedOn: "2026-09-01" }),
      ],
    }),
    [
      price({ price: 40, observedOn: "2026-07-01" }),
      price({ price: 50, observedOn: "2026-08-01" }),
      price({ price: 60, observedOn: "2026-09-01" }),
    ],
  );

  const falling = computePrice(
    cellCore({
      prices: [
        price({ price: 60, observedOn: "2026-07-01" }),
        price({ price: 50, observedOn: "2026-08-01" }),
        price({ price: 40, observedOn: "2026-09-01" }),
      ],
    }),
    [
      price({ price: 60, observedOn: "2026-07-01" }),
      price({ price: 50, observedOn: "2026-08-01" }),
      price({ price: 40, observedOn: "2026-09-01" }),
    ],
  );

  assert.ok((rising.value as number) > (falling.value as number), "trend direction moves the price score");
});

test("weather suitability maps risk signals to a 0-1 score", () => {
  const mild: WeatherRiskSignal[] = [
    { signal_date: "2026-09-05", heat_risk: "low", rainfall_signal: "light_rain", summary: "", latitude: 0, longitude: 0, source_name: "test" },
  ];
  const harsh: WeatherRiskSignal[] = [
    { signal_date: "2026-09-05", heat_risk: "high", rainfall_signal: "heavy_rain", summary: "", latitude: 0, longitude: 0, source_name: "test" },
  ];

  const mildScore = suitabilityFromWeatherSignals(mild) as number;
  const harshScore = suitabilityFromWeatherSignals(harsh) as number;

  assert.ok(mildScore > 0.8, `mild weather scores high, got ${mildScore}`);
  assert.ok(harshScore < 0.35, `harsh weather scores low, got ${harshScore}`);
});

test("seasonal component waits for multi-month history", () => {
  const singleMonth = computeSeasonal({
    prices: [price()],
    supply: [],
    demand: [],
    weatherSuitability: null,
  });

  assert.equal(singleMonth.value, null, "no seasonality from one month");
  assert.equal(singleMonth.confidence, 0);

  const withWeather = computeSeasonal({
    prices: [price()],
    supply: [],
    demand: [],
    weatherSuitability: 0.9,
  });

  assert.ok(withWeather.value !== null, "weather alone can drive the seasonal term");
  assert.ok(
    withWeather.confidence > 0,
    "weather evidence plus a real record reaches the three-point floor",
  );
});

test("competition counts supplier weight within reach", () => {
  const target = cellCore({ demand: [demand()] });
  const rival = cellCore({
    locationName: "Gikomba Market",
    latitude: -1.290029,
    longitude: 36.839428,
    supply: [supply({ quantity: 900, contributor: "D" })],
  });

  const raw = computeRawCompetition(target, [providerOf(target), providerOf(rival)]);

  assert.ok(raw.raw > 0, "nearby supplier registers as competition");
  assert.equal(raw.observations, 1);
});

test("accessibility favours underserved locations", () => {
  const loner = cellCore({ supply: [supply()], demand: [demand()] });
  const access = computeAccessibility(loner, [providerOf(loner), providerOf(loner)]);

  assert.ok((access.value as number) > 50, `own reach dominates, got ${access.value}`);
  assert.equal(access.observations, 2);
});

test("integration: demand-only cell has high opportunity but thin confidence", async () => {
  const demands = Array.from({ length: 3 }, (_, index) =>
    demand({ contributor: `B${index}`, quantity: 1000 }),
  );

  const cells = await computeOpportunitySurface({
    supplies: [],
    demands,
    prices: [],
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  assert.equal(cells.length, 1);
  const cell = cells[0];

  assert.ok((cell.opportunity as number) > 90, `demand-only opportunity, got ${cell.opportunity}`);
  assert.ok(cell.confidence < 50, `three records stay thin, got ${cell.confidence}`);
  assert.equal(cell.entrySignal, "promising");
  assert.deepEqual([...(cell.records.demand.map((record) => record))].length, 3, "drill-down records attached");

  const presentKeys = Object.entries(cell.components)
    .filter(([, component]) => component.value !== null && component.confidence >= 0.05)
    .map(([key]) => key);

  assert.deepEqual(presentKeys, ["ssd"], "renormalization: only the evidence-backed component participates");
});

test("integration: abundant diverse evidence moves a match to strong entry", async () => {
  const supplies = Array.from({ length: 8 }, (_, index) =>
    supply({ contributor: `S${index % 2}`, quantity: 10 }),
  );
  const demands = Array.from({ length: 8 }, (_, index) =>
    demand({ contributor: `B${index % 4}`, quantity: 5000 }),
  );
  const priceDays = [
    "2026-08-22", "2026-08-23", "2026-08-24", "2026-08-25", "2026-08-26",
    "2026-08-27", "2026-08-28", "2026-08-29", "2026-08-30", "2026-08-31",
    "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05",
  ];
  const prices = priceDays.map((observedOn, index) =>
    price({ price: 40 + index * 2, observedOn }),
  );

  const cells = await computeOpportunitySurface({
    supplies,
    demands,
    prices,
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  assert.equal(cells.length, 1);
  const cell = cells[0];

  assert.ok((cell.opportunity as number) > 55, `opportunity, got ${cell.opportunity}`);
  assert.ok(cell.confidence >= 50, `confidence hardened, got ${cell.confidence}`);
  assert.equal(cell.entrySignal, "strong-entry");
});

test("integration: with no real records the cell stays silently low", async () => {
  const cells = await computeOpportunitySurface({
    supplies: [],
    demands: [],
    prices: [],
    products: PRODUCTS,
    markets: MARKETS,
    counties: COUNTIES,
  });

  assert.equal(cells.length, 0, "no cells are fabricated from empty data");
});