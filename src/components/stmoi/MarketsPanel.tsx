import { useMemo, useState } from "react";

import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import { setFocusLocation } from "../../lib/focus";
import { openAppTab } from "../../lib/hash";
import type { Market } from "../../types/api";

interface MarketsPanelProps {
  markets: Market[];
}

interface MarketStats {
  supply: number;
  demand: number;
  price: number;
  total: number;
  net: number;
  topProducts: Array<{ name: string; count: number }>;
}

const fmt = (value: number): string => new Intl.NumberFormat("en-KE").format(value);

export function MarketsPanel({ markets }: MarketsPanelProps) {
  const { value: supplies = [] } = useLiveDexie(() => db.supplies.toArray(), []);
  const { value: demands = [] } = useLiveDexie(() => db.demands.toArray(), []);
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);

  const [query, setQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState("");
  const [selected, setSelected] = useState<Market | null>(null);

  const countiesInData = useMemo(
    () => [...new Set(markets.map((market) => market.county))].sort((a, b) => a.localeCompare(b)),
    [markets],
  );

  const statsByMarket = useMemo(() => {
    const map = new Map<string, MarketStats>();
    const productCounts = new Map<string, Map<string, number>>();

    const bump = (record: { marketName?: string | null; county: string; productName: string }, kind: "supply" | "demand" | "price") => {
      const name = record.marketName || record.county;
      const stats = map.get(name) ?? { supply: 0, demand: 0, price: 0, total: 0, net: 0, topProducts: [] };
      const counts = productCounts.get(name) ?? new Map<string, number>();

      counts.set(record.productName, (counts.get(record.productName) ?? 0) + 1);
      productCounts.set(name, counts);

      if (kind === "supply") {
        stats.supply += 1;
        stats.net -= 1;
      } else if (kind === "demand") {
        stats.demand += 1;
        stats.net += 1;
      } else {
        stats.price += 1;
      }

      stats.total += 1;
      map.set(name, stats);
    };

    for (const record of supplies) {
      bump(record, "supply");
    }
    for (const record of demands) {
      bump(record, "demand");
    }
    for (const record of prices) {
      bump(record, "price");
    }

    for (const [name, counts] of productCounts) {
      const stats = map.get(name);

      if (stats) {
        stats.topProducts = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([productName, count]) => ({ name: productName, count }));
      }
    }

    return map;
  }, [supplies, demands, prices]);

  const filteredMarkets = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return markets.filter((market) => {
      const matchesQuery =
        needle.length === 0 ||
        market.name.toLowerCase().includes(needle) ||
        market.county.toLowerCase().includes(needle);

      const matchesCounty = countyFilter === "" || market.county === countyFilter;

      return matchesQuery && matchesCounty;
    });
  }, [markets, query, countyFilter]);

  const viewMarket = (market: Market) => {
    setSelected(market);
  };

  const viewOpportunity = (market: Market) => {
    setFocusLocation(market.name);
    openAppTab("opportunity");
  };

  if (selected !== null) {
    const stats = statsByMarket.get(selected.name) ?? {
      supply: 0,
      demand: 0,
      price: 0,
      total: 0,
      net: 0,
      topProducts: [],
    };

    return (
      <div className="markets-panel">
        <button type="button" className="sort-button market-back" onClick={() => setSelected(null)}>
          ← All markets
        </button>

        <section className="market-overview">
          <div className="market-overview-head">
            <div>
              <p className="eyebrow">{selected.county}</p>
              <h2>{selected.name}</h2>
            </div>
            <button type="button" className="btn btn-primary flow-next" onClick={() => viewOpportunity(selected)}>
              View opportunity →
            </button>
          </div>

          <div className="saved-opp-rows market-stats">
            <div>
              <span>Activity</span>
              <strong>{fmt(stats.total)}</strong>
            </div>
            <div>
              <span>Supply records</span>
              <strong>{stats.supply}</strong>
            </div>
            <div>
              <span>Demand records</span>
              <strong>{stats.demand}</strong>
            </div>
            <div>
              <span>Price records</span>
              <strong>{stats.price}</strong>
            </div>
          </div>

          {stats.topProducts.length > 0 && (
            <div className="market-top-products">
              <h3>Top products</h3>
              <ol className="insight-list">
                {stats.topProducts.map((product) => (
                  <li key={product.name}>
                    <span className="insight-body">
                      <strong>{product.name}</strong>
                      <span className="muted">{product.count} record{product.count === 1 ? "" : "s"}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {stats.total === 0 && (
            <div className="empty-state">
              <h3>No records here yet.</h3>
              <p>Add real records and this market builds its signal.</p>
              <button type="button" className="btn btn-primary" onClick={() => openAppTab("enter")}>
                Add a record
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="markets-panel">
      <div className="surface-filter-row">
        <input
          type="search"
          className="surface-search"
          placeholder="Search markets or counties…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {countiesInData.length > 1 && (
          <select
            className="surface-select"
            value={countyFilter}
            onChange={(event) => setCountyFilter(event.target.value)}
          >
            <option value="">All counties</option>
            {countiesInData.map((county) => (
              <option key={county} value={county}>
                {county}
              </option>
            ))}
          </select>
        )}
        <span className="surface-count">{filteredMarkets.length} markets</span>
      </div>

      {markets.length === 0 && <p className="muted">Loading reference markets…</p>}

      {filteredMarkets.length === 0 && markets.length > 0 && (
        <div className="empty-state">
          <h3>No markets match.</h3>
          <p>Try a different search or county.</p>
        </div>
      )}

      <ol className="market-list">
        {filteredMarkets.map((market) => {
          const stats = statsByMarket.get(market.name);

          return (
            <li key={market.id}>
              <button type="button" className="market-row" onClick={() => viewMarket(market)}>
                <span className="market-row-main">
                  <strong>{market.name}</strong>
                  <span className="muted">{market.county}</span>
                </span>
                <span className="market-row-activity">
                  {stats && stats.total > 0 && (
                    <span className="market-row-counts">
                      <span>
                        <strong>{stats.supply}</strong> supply
                      </span>
                      <span>
                        <strong>{stats.demand}</strong> demand
                      </span>
                      <span>
                        <strong>{stats.price}</strong> prices
                      </span>
                    </span>
                  )}
                  {!stats || stats.total === 0 ? (
                    <span className="muted">No records yet</span>
                  ) : null}
                  <span className="market-row-chevron" aria-hidden="true">
                    →
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}