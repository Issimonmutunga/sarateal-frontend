import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_SCORING_CONFIG,
  isDefaultConfig,
  normalizeWeights,
  sanitizeConfig,
} from "../src/engine/config";
import { entrySignalFor } from "../src/engine/types";

test("normalizeWeights keeps methodology defaults when all weights are zero", () => {
  const result = normalizeWeights({ ssd: 0, price: 0, access: 0, seasonal: 0, competition: 0 });

  assert.deepEqual(result, DEFAULT_SCORING_CONFIG.weights);
});

test("normalizeWeights renormalizes a set of raw weights to 100%", () => {
  const result = normalizeWeights({ ssd: 40, price: 10, access: 10, seasonal: 0, competition: 0 });

  assert.ok(Math.abs(result.ssd - 0.6666) < 0.001);
  assert.ok(Math.abs(result.price - 0.1666) < 0.001);
  assert.ok(Math.abs(result.access - 0.1666) < 0.001);
  assert.equal(result.seasonal, 0);
  assert.equal(result.competition, 0);
});

test("normalizeWeights clamps negative weights to zero", () => {
  const result = normalizeWeights({ ssd: -5, price: 5, access: 0, seasonal: 0, competition: 0 });

  assert.equal(result.ssd, 0);
  assert.equal(result.price, 1);
});

test("isDefaultConfig is true for defaults and false after any deviation", () => {
  assert.equal(isDefaultConfig({ ...DEFAULT_SCORING_CONFIG }), true);

  assert.equal(
    isDefaultConfig({ ...DEFAULT_SCORING_CONFIG, opportunityHigh: 55 }),
    false,
  );

  assert.equal(
    isDefaultConfig({
      ...DEFAULT_SCORING_CONFIG,
      weights: { ...DEFAULT_SCORING_CONFIG.weights, price: 0.35 },
    }),
    false,
  );
});

test("sanitizeConfig tolerates unknown / partial stored shapes", () => {
  assert.deepEqual(sanitizeConfig(undefined), DEFAULT_SCORING_CONFIG);
  assert.deepEqual(sanitizeConfig("junk"), DEFAULT_SCORING_CONFIG);

  const fromStorage = sanitizeConfig({
    opportunityHigh: 70,
    weights: { ssd: 40, price: 10, access: 10, seasonal: null, competition: 100 },
  });

  assert.equal(fromStorage.opportunityHigh, 70);
  assert.equal(fromStorage.confidenceHigh, DEFAULT_SCORING_CONFIG.confidenceHigh);
  assert.equal(fromStorage.weights.seasonal, 0);
  assert.ok(Math.abs(fromStorage.weights.competition - 0.625) < 0.001);
});

test("entrySignalFor honors custom thresholds without changing defaults", () => {
  assert.equal(entrySignalFor(60, 50), "strong-entry");
  assert.equal(entrySignalFor(60, 50, { opportunityHigh: 70, confidenceHigh: 60 }), "insufficient-data");
  assert.equal(entrySignalFor(72, 45, { opportunityHigh: 70, confidenceHigh: 60 }), "promising");
  assert.equal(entrySignalFor(50, 65, { opportunityHigh: 70, confidenceHigh: 60 }), "avoid");
});

test("default config is recognized as methodology-default", () => {
  assert.equal(isDefaultConfig(DEFAULT_SCORING_CONFIG), true);
});