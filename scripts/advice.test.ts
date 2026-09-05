import assert from "node:assert/strict";
import { test } from "node:test";

import { adviceForMatch, isMatchActionable } from "../src/engine/advice";
import type { MatchRecord, MatchStatus } from "../src/lib/db";

const NOW = "2026-09-05T00:00:00.000Z";

function makeMatch(overrides: Partial<MatchRecord> = {}): MatchRecord {
  return {
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
    updatedAt: NOW,
    outcomeNotes: null,
    dismissed: false,
    ...overrides,
  };
}

function event(status: MatchStatus, at: string): { status: MatchStatus; at: string } {
  return { status, at };
}

test("adviceForMatch pushes a now-priority follow-up for stale untouched opens", () => {
  const advice = adviceForMatch(
    makeMatch({ createdAt: "2026-08-26T00:00:00.000Z" }),
    [],
    new Date(NOW),
  );

  assert.equal(advice.length, 1);
  assert.equal(advice[0].priority, "now");
  assert.match(advice[0].text, /contact attempt/i);
});

test("adviceForMatch pushes a soon-priority nudge for three-day-old opens", () => {
  const advice = adviceForMatch(
    makeMatch({ createdAt: "2026-09-02T00:00:00.000Z" }),
    [],
    new Date(NOW),
  );

  assert.equal(advice[0].priority, "soon");
  assert.match(advice[0].text, /contact attempt/i);
});

test("adviceForMatch stays quiet while an open match is fresh", () => {
  const advice = adviceForMatch(
    makeMatch({ createdAt: "2026-09-04T00:00:00.000Z" }),
    [],
    new Date(NOW),
  );

  assert.deepEqual(advice, []);
});

test("adviceForMatch escalates contact that stalls past two weeks", () => {
  const advice = adviceForMatch(
    makeMatch({
      status: "contacted",
      createdAt: "2026-08-01T00:00:00.000Z",
    }),
    [event("contacted", "2026-08-05T00:00:00.000Z")],
    new Date(NOW),
  );

  assert.equal(advice[0].priority, "now");
  assert.match(advice[0].text, /re-engage or close/i);
});

test("adviceForMatch notes thin evidence for promising cells", () => {
  const advice = adviceForMatch(
    makeMatch({
      entrySignal: "promising",
      confidenceScore: 40,
      createdAt: "2026-09-04T00:00:00.000Z",
    }),
    [],
    new Date(NOW),
  );

  assert.equal(advice.length, 1);
  assert.equal(advice[0].priority, "info");
  assert.match(advice[0].text, /evidence/i);
});

test("adviceForMatch reminds to close a deal once agreed", () => {
  const advice = adviceForMatch(
    makeMatch({ status: "deal", createdAt: "2026-09-01T00:00:00.000Z" }),
    [],
    new Date(NOW),
  );

  assert.equal(advice[0].priority, "info");
  assert.match(advice[0].text, /close/i);
});

test("adviceForMatch ignores dismissed and non-actionable matches", () => {
  assert.deepEqual(
    adviceForMatch(
      makeMatch({ dismissed: true, createdAt: "2026-08-26T00:00:00.000Z" }),
      [],
      new Date(NOW),
    ),
    [],
  );
  assert.deepEqual(
    adviceForMatch(
      makeMatch({ entrySignal: "avoid", createdAt: "2026-08-26T00:00:00.000Z" }),
      [],
      new Date(NOW),
    ),
    [],
  );
});

test("isMatchActionable only admits non-dismissed strong/promising entries", () => {
  assert.equal(isMatchActionable(makeMatch()), true);
  assert.equal(isMatchActionable(makeMatch({ entrySignal: "promising" })), true);
  assert.equal(isMatchActionable(makeMatch({ entrySignal: "avoid" })), false);
  assert.equal(isMatchActionable(makeMatch({ entrySignal: "insufficient-data" })), false);
  assert.equal(isMatchActionable(makeMatch({ dismissed: true })), false);
});