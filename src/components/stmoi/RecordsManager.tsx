import { useMemo, useState } from "react";

import { useLiveDexie } from "../../hooks/useDexie";
import {
  db,
  type DemandRecord,
  type MatchRecord,
  type PriceRecord,
  type RecordKind,
  type SupplyRecord,
} from "../../lib/db";
import { findNearDuplicates, plausibilityOf, unitConflicts } from "../../lib/hygiene";
import { capTrash, TRASH_CAP } from "../../lib/trash";

interface RecordListItem {
  key: string;
  kind: RecordKind;
  id: number;
  title: string;
  detail: string;
  createdAt: string;
}

type RecordTable = typeof db.supplies | typeof db.demands | typeof db.prices | typeof db.matches;

function tableFor(kind: RecordKind): RecordTable {
  switch (kind) {
    case "supply":
      return db.supplies;
    case "demand":
      return db.demands;
    case "price":
      return db.prices;
    case "match":
      return db.matches;
  }
}

function supplyItem(record: SupplyRecord, index: number): RecordListItem {
  return {
    key: `supply-${record.id ?? index}`,
    kind: "supply",
    id: record.id as number,
    title: `${record.productName}`,
    detail: `${record.quantity} ${record.unit} · ${record.marketName || record.county} · from ${record.availableFrom}`,
    createdAt: record.createdAt,
  };
}

function demandItem(record: DemandRecord, index: number): RecordListItem {
  return {
    key: `demand-${record.id ?? index}`,
    kind: "demand",
    id: record.id as number,
    title: `${record.productName}`,
    detail: `${record.quantity} ${record.unit} · ${record.marketName || record.county} · needed from ${record.neededFrom}`,
    createdAt: record.createdAt,
  };
}

function priceItem(record: PriceRecord, index: number): RecordListItem {
  return {
    key: `price-${record.id ?? index}`,
    kind: "price",
    id: record.id as number,
    title: `${record.productName}`,
    detail: `${record.price} ${record.currency}/${record.unit} · ${record.marketName || record.county} · on ${record.observedOn}`,
    createdAt: record.createdAt,
  };
}

function matchItem(record: MatchRecord, index: number): RecordListItem {
  return {
    key: `match-${record.id ?? index}`,
    kind: "match",
    id: record.id as number,
    title: `${record.productName}`,
    detail: `${record.locationName} · O ${record.opportunityScore.toFixed(0)} / C ${record.confidenceScore.toFixed(0)} · ${record.status}`,
    createdAt: record.createdAt,
  };
}

function buildImplausible(
  kind: RecordKind,
  records: Array<{ id?: number; productName: string }>,
): Array<{ key: string; kind: RecordKind; id: number; text: string }> {
  return records.flatMap((record) => {
    const reasons = plausibilityOf(record as Parameters<typeof plausibilityOf>[0]).reasons;

    return reasons.length > 0 && record.id !== undefined
      ? [
          {
            key: `${kind}-implausible-${record.id}`,
            kind,
            id: record.id as number,
            text: `${record.productName} — ${reasons.join(", ")}`,
          },
        ]
      : [];
  });
}

export function RecordsManager() {
  const { value: supplies = [] } = useLiveDexie(() => db.supplies.toArray(), []);
  const { value: demands = [] } = useLiveDexie(() => db.demands.toArray(), []);
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);
  const { value: matches = [] } = useLiveDexie(() => db.matches.toArray(), []);
  const { value: trash = [] } = useLiveDexie(() => db.trash.toArray(), []);

  const [trashError, setTrashError] = useState<string | null>(null);

  const items: RecordListItem[] = [
    ...supplies.map(supplyItem),
    ...demands.map(demandItem),
    ...prices.map(priceItem),
    ...matches.map(matchItem),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const implausible = useMemo(
    () => [
      ...buildImplausible("supply", supplies),
      ...buildImplausible("demand", demands),
      ...buildImplausible("price", prices),
    ],
    [supplies, demands, prices],
  );

  const duplicatePairs = useMemo(
    () => findNearDuplicates(prices, supplies, demands),
    [supplies, demands, prices],
  );

  const unitConflictsList = useMemo(() => unitConflicts(prices), [prices]);

  const removeKind = async (kind: RecordKind, id: number) => {
    const table = tableFor(kind);

    await db.transaction("rw", [table, db.trash], async () => {
      const record = await table.get(id);

      if (record !== undefined) {
        await db.trash.add({
          kind,
          payload: record,
          deletedAt: new Date().toISOString(),
        });
      }

      await table.delete(id);

      const all = await db.trash.toArray();
      const kept = new Set(capTrash(all).map((item) => item.id));
      const expired = all.filter((item) => item.id !== undefined && !kept.has(item.id));

      if (expired.length > 0) {
        await db.trash.bulkDelete(
          expired.map((item) => item.id as number),
        );
      }
    });
  };

  const restoreTrash = async (trashId: number) => {
    const entry = await db.trash.get(trashId);

    if (!entry) {
      return;
    }

    try {
      await tableFor(entry.kind).put(entry.payload as never);
      await db.trash.delete(trashId);
      setTrashError(null);
    } catch (error) {
      setTrashError(
        error instanceof Error
          ? error.message
          : "Could not restore the record (it may conflict with an existing one).",
      );
    }
  };

  const purgeTrash = async () => {
    await db.trash.clear();
    setTrashError(null);
  };

  return (
    <div className="records-manager">
      <div className="section-heading">
        <h3>Record management</h3>
        <p className="section-subnote">
          Review and delete records stored in this browser. Deletions move to trash and can be
          restored.
        </p>
      </div>

      {trash.length > 0 && (
        <details className="hygiene-block trash-block">
          <summary>
            Recently deleted ({trash.length}
            {trash.length >= TRASH_CAP ? `, capped at ${TRASH_CAP}` : ""})
          </summary>
          {trashError !== null && (
            <p className="workspace-note is-warning">{trashError}</p>
          )}
          <ul className="record-list">
            {trash.map((entry) => (
              <li className="record-row" key={entry.id}>
                <span className={`record-type record-type-${entry.kind}`}>{entry.kind}</span>
                <span className="record-title">
                  {(entry.payload as { productName?: string }).productName ?? "Record"}
                </span>
                <span className="record-time">
                  deleted {new Date(entry.deletedAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  className="restore-button"
                  title="Restore this record"
                  onClick={() => void restoreTrash(entry.id as number)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="record-delete"
            onClick={() => void purgeTrash()}
          >
            Purge trash
          </button>
        </details>
      )}

      {(implausible.length > 0 || duplicatePairs.length > 0 || unitConflictsList.length > 0) && (
        <details className="hygiene-block">
          <summary>
            Data hygiene
            <span className="hygiene-badge">
              {implausible.length + duplicatePairs.length + unitConflictsList.length} flag(s)
            </span>
          </summary>

          {implausible.length > 0 && (
            <>
              <h4>Implausible records</h4>
              <ul className="record-list">
                {implausible.map((entry) => (
                  <li className="record-row" key={entry.key}>
                    <span className={`record-type record-type-${entry.kind}`}>{entry.kind}</span>
                    <span className="record-detail">{entry.text || "implausible values"}</span>
                    <button
                      type="button"
                      className="record-delete"
                      title="Move this record to trash"
                      onClick={() => void removeKind(entry.kind, entry.id)}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {duplicatePairs.length > 0 && (
            <>
              <h4>Potential near-duplicates</h4>
              <ul className="record-list">
                {duplicatePairs.map((pair) => (
                  <li className="record-row" key={`dup-${pair.firstId}-${pair.secondId}`}>
                    <span className={`record-type record-type-${pair.kind}`}>{pair.kind}</span>
                    <span className="record-detail">{pair.text}</span>
                    {pair.firstId !== undefined && (
                      <button
                        type="button"
                        className="record-delete"
                        title="Keep the second record, delete the first"
                        onClick={() => void removeKind(pair.kind, pair.firstId as number)}
                      >
                        Remove first
                      </button>
                    )}
                    {pair.secondId !== undefined && pair.secondId !== pair.firstId && (
                      <button
                        type="button"
                        className="record-delete"
                        title="Keep the first record, delete the second"
                        onClick={() => void removeKind(pair.kind, pair.secondId as number)}
                      >
                        Remove second
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {unitConflictsList.length > 0 && (
            <>
              <h4>Unit-coherence conflicts</h4>
              <ul className="record-list">
                {unitConflictsList.map((conflict) => (
                  <li className="record-row" key={`unit-${conflict.productId}-${conflict.county}-${conflict.marketName ?? ""}`}>
                    <span className="record-type record-type-price">price</span>
                    <span className="record-detail">
                      {conflict.productName} in {conflict.marketName || conflict.county} mixes units:{" "}
                      {conflict.units.join(" / ")} across {conflict.count} records
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}

      {items.length === 0 && <p className="muted">No records yet.</p>}

      {items.length > 0 && (
        <ol className="record-list">
          {items.map((item) => (
            <li className="record-row" key={item.key}>
              <span className={`record-type record-type-${item.kind}`}>{item.kind}</span>
              <span className="record-title">{item.title}</span>
              <span className="record-detail">{item.detail}</span>
              <span className="record-time">{new Date(item.createdAt).toLocaleDateString()}</span>
              <button
                type="button"
                className="record-delete"
                title="Move this record to trash"
                onClick={() => void removeKind(item.kind, item.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}