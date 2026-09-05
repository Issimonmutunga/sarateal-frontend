import assert from "node:assert/strict";
import { test } from "node:test";

import { capTrash, TRASH_CAP } from "../src/lib/trash";

test("capTrash sorts newest first and trims to the cap", () => {
  const items = Array.from({ length: TRASH_CAP + 2 }, (_, index) => ({
    id: index,
    deletedAt: `2026-09-0${(index % 9) + 1}T00:00:${String(index).padStart(2, "0")}.000Z`,
  }));

  const capped = capTrash(items);

  assert.equal(capped.length, TRASH_CAP);
});

test("capTrash keeps the most recent items in order", () => {
  const capped = capTrash([
    { id: 1, deletedAt: "2026-09-01T00:00:00.000Z" },
    { id: 2, deletedAt: "2026-09-05T00:00:00.000Z" },
    { id: 3, deletedAt: "2026-09-03T00:00:00.000Z" },
  ], 2);

  assert.deepEqual(
    capped.map((item) => item.id),
    [2, 3],
  );
});

test("capTrash never grows a small list", () => {
  const capped = capTrash([
    { id: 1, deletedAt: "2026-09-01T00:00:00.000Z" },
  ]);

  assert.equal(capped.length, 1);
  assert.equal(capped[0].id, 1);
});