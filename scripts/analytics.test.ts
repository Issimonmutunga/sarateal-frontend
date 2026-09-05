import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildTimeline,
  medianDealDays,
  timeToDealDays,
} from "../src/engine/matchAnalytics";
import type { MatchLifecycleEvent } from "../src/engine/matchAnalytics";

const open = (at: string): MatchLifecycleEvent => ({ status: "open", at });
const contacted = (at: string): MatchLifecycleEvent => ({ status: "contacted", at });
const deal = (at: string): MatchLifecycleEvent => ({ status: "deal", at });
const closed = (at: string): MatchLifecycleEvent => ({ status: "closed", at });

test("buildTimeline sorts events chronologically", () => {
  const before = [deal("2026-09-10T00:00:00.000Z"), open("2026-09-01T00:00:00.000Z")];

  assert.deepEqual(
    buildTimeline(before).map((event) => event.status),
    ["open", "deal"],
  );
});

test("timeToDealDays measures from first open to first deal", () => {
  const duration = timeToDealDays([
    contacted("2026-09-03T00:00:00.000Z"),
    open("2026-09-01T00:00:00.000Z"),
    deal("2026-09-10T12:00:00.000Z"),
  ]);

  assert.ok(duration !== null);
  assert.ok(duration > 9 && duration < 10);
});

test("timeToDealDays is null without a deal, and 0 for a match born as deal", () => {
  assert.equal(timeToDealDays([open("2026-09-01T00:00:00.000Z"), contacted("2026-09-03T00:00:00.000Z")]), null);
  assert.equal(timeToDealDays([]), null);
  assert.equal(timeToDealDays([deal("2026-09-10T00:00:00.000Z")]), 0);
});

test("medianDealDays returns the middle duration on odd counts", () => {
  const median = medianDealDays([
    [open("2026-09-01T00:00:00.000Z"), deal("2026-09-06T00:00:00.000Z")],
    [open("2026-09-01T00:00:00.000Z"), deal("2026-09-11T00:00:00.000Z")],
    [open("2026-09-01T00:00:00.000Z"), deal("2026-09-16T00:00:00.000Z")],
  ]);

  assert.ok(median !== null);
  assert.ok(Math.abs(median - 10) < 0.01);
});

test("medianDealDays averages even counts and ignores matches without deals", () => {
  const median = medianDealDays([
    [open("2026-09-01T00:00:00.000Z"), deal("2026-09-06T00:00:00.000Z")],
    [open("2026-09-01T00:00:00.000Z"), deal("2026-09-16T00:00:00.000Z")],
    [open("2026-09-01T00:00:00.000Z"), contacted("2026-09-03T00:00:00.000Z")],
  ]);

  assert.equal(median, 10);
  assert.equal(medianDealDays([]), null);
  assert.equal(medianDealDays([[open("2026-09-01T00:00:00.000Z")]]), null);
});

test("closing a match counts as tracked but not as a deal date", () => {
  assert.equal(timeToDealDays([open("2026-09-01T00:00:00.000Z"), closed("2026-09-20T00:00:00.000Z")]), null);
});