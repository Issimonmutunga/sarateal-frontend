import { useLiveDexie } from "../../hooks/useDexie";
import { db, type DemandRecord, type SupplyRecord } from "../../lib/db";
import { openAppTab } from "../../lib/hash";

export type LedgerKind = "supply" | "demand";

const TITLES: Record<LedgerKind, { heading: string; sub: string; add: string }> = {
  supply: {
    heading: "Supply",
    sub: "What's available, where.",
    add: "Add supply entry",
  },
  demand: {
    heading: "Demand",
    sub: "What buyers need, where.",
    add: "Add demand entry",
  },
};

export function RecordLedger({ kind }: { kind: LedgerKind }) {
  const { value: records = [] } = useLiveDexie<Array<SupplyRecord | DemandRecord>>(
    () => (kind === "supply" ? db.supplies.toArray() : db.demands.toArray()),
    [kind],
  );

  const title = TITLES[kind];

  return (
    <div className="workspace-panel">
      <div className="panel-toolbar">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            openAppTab("enter");
          }}
        >
          {title.add}
        </button>
      </div>

      {records.length === 0 && (
        <div className="empty-state start-here">
          <div>
            <h3>No {kind} records yet.</h3>
            <p>Add a real {kind} record to feed the surface.</p>
          </div>
        </div>
      )}

      {records.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Location</th>
                <th>Window</th>
                <th>Logged</th>
              </tr>
            </thead>
            <tbody>
              {[...records]
                .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
                .map((record) => {
                  const windowStart =
                    "availableFrom" in record ? record.availableFrom : record.neededFrom;

                  return (
                    <tr key={record.id}>
                      <td>{record.productName}</td>
                      <td>
                        {record.quantity} {record.unit}
                      </td>
                      <td>{record.marketName || record.county}</td>
                      <td className="muted">{windowStart}</td>
                      <td className="muted">{new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}