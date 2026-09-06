import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import type { Market } from "../../types/api";

interface MarketsPanelProps {
  markets: Market[];
}

export function MarketsPanel({ markets }: MarketsPanelProps) {
  const { value: supplies = [] } = useLiveDexie(() => db.supplies.toArray(), []);
  const { value: demands = [] } = useLiveDexie(() => db.demands.toArray(), []);
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);

  const marketRecords = new Map<string, { supply: number; demand: number; price: number }>();

  for (const record of [...supplies, ...demands, ...prices]) {
    const name = record.marketName || record.county;
    const current = marketRecords.get(name) ?? { supply: 0, demand: 0, price: 0 };

    if ("availableFrom" in record) {
      current.supply += 1;
    } else if ("neededFrom" in record) {
      current.demand += 1;
    } else {
      current.price += 1;
    }

    marketRecords.set(name, current);
  }

  return (
    <div className="workspace-panel">
      <div className="section-heading">
        <h2>Markets</h2>
        <p className="section-subnote">
          Reference markets across Kenya. Record counts show how much activity you have logged for
          each market; select any market to inspect its opportunity cell.
        </p>
      </div>

      {markets.length === 0 && <p className="muted">Loading reference markets…</p>}

      {markets.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>County</th>
                <th>Supply</th>
                <th>Demand</th>
                <th>Prices</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market) => {
                const stats = marketRecords.get(market.name) ?? { supply: 0, demand: 0, price: 0 };

                return (
                  <tr key={market.id}>
                    <td>
                      <a className="market-link" href="#/app/opportunity">
                        {market.name}
                      </a>
                    </td>
                    <td className="muted">{market.county}</td>
                    <td>{stats.supply > 0 ? stats.supply : <span className="muted">—</span>}</td>
                    <td>{stats.demand > 0 ? stats.demand : <span className="muted">—</span>}</td>
                    <td>{stats.price > 0 ? stats.price : <span className="muted">—</span>}</td>
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