import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";

interface PricePoint {
  key: string;
  productName: string;
  unit: string;
  locationName: string;
  price: number;
  currency: string;
  observedOn: string;
  count: number;
}

export function PricesPanel() {
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);

  const latest = new Map<string, PricePoint>();

  for (const record of prices) {
    const key = `${record.productId}::${record.marketName || record.county}`;
    const existing = latest.get(key);

    if (!existing || Date.parse(record.observedOn) > Date.parse(existing.observedOn)) {
      latest.set(key, {
        key,
        productName: record.productName,
        unit: record.unit,
        locationName: record.marketName || record.county,
        price: record.price,
        currency: record.currency,
        observedOn: record.observedOn,
        count: 1,
      });
    } else if (existing) {
      existing.count += 1;
    }
  }

  const rows = [...latest.values()].sort((a, b) => b.observedOn.localeCompare(a.observedOn));

  return (
    <div className="workspace-panel">
      {rows.length === 0 && (
        <div className="empty-state start-here">
          <div>
            <h3>No price records yet.</h3>
            <p>Log prices to fill this board.</p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="price-big-grid">
          {rows.slice(0, 12).map((row) => (
            <div className="price-big-card" key={row.key}>
              <span className="stat-value">
                {new Intl.NumberFormat("en-KE").format(row.price)}
              </span>
              <span className="stat-label">
                {row.currency}/{row.unit}
              </span>
              <span className="price-big-meta">
                {row.productName} · {row.locationName}
              </span>
              <span className="price-big-meta muted">
                {row.count} obs {row.count === 1 ? "" : "·"} {new Date(row.observedOn).toLocaleDateString()}
              </span>
              <span className="muted">{"·".repeat(Math.min(24, 4 + row.count))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}