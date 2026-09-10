import { useLiveDexie } from "../../hooks/useDexie";
import { db, type DemandRecord, type SupplyRecord } from "../../lib/db";

export type LedgerKind = "supply" | "demand";

export function RecordLedger({ kind }: { kind: LedgerKind }) {
  const { value: records = [] } = useLiveDexie<Array<SupplyRecord | DemandRecord>>(
    () => (kind === "supply" ? db.supplies.toArray() : db.demands.toArray()),
    [kind],
  );

  return (
    <div className="workspace-panel">
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