import { Suspense, lazy } from "react";

import type { OpportunityCell } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { db, type DemandRecord, type PriceRecord, type SupplyRecord } from "../../lib/db";
import { openAppTab } from "../../lib/hash";
import type { County, Market } from "../../types/api";

const MarketMap = lazy(() => import("./MarketMap").then((module) => ({ default: module.MarketMap })));

interface WorkspaceOverviewProps {
  cells: OpportunityCell[];
  cellsLoading: boolean;
  supplies: SupplyRecord[];
  demands: DemandRecord[];
  prices: PriceRecord[];
  counties: County[];
  markets: Market[];
}

export function WorkspaceOverview({
  cells,
  cellsLoading,
  supplies,
  demands,
  prices,
  counties,
  markets,
}: WorkspaceOverviewProps) {
  const { value: openMatches = 0 } = useLiveDexie(
    () => db.matches.filter((match) => match.status === "open" && !match.dismissed).count(),
    [],
  );

  const actionable = cells.filter((cell) => cell.opportunity !== null);
  const highConfidence = cells.filter((cell) => cell.confidence >= 50);
  const top = [...cells].slice(0, 5);

  const kpi = [
    { label: "Active markets", value: markets.length > 0 ? String(markets.length) : "—", note: "reference markets" },
    { label: "Scored cells", value: cellsLoading ? "…" : String(actionable.length), note: actionable.length > 0 ? `${highConfidence.length} high confidence` : "add records to score" },
    { label: "Supply entries", value: String(supplies.length), note: "this browser" },
    { label: "Demand entries", value: String(demands.length), note: "this browser" },
    { label: "Price entries", value: String(prices.length), note: "this browser" },
    { label: "Open matches", value: String(openMatches), note: "ready to act" },
  ];

  return (
    <div className="workspace-panel overview-panel">
      <div className="kpi-grid">
        {kpi.map((item) => (
          <div className="kpi-card" key={item.label}>
            <span className="stat-value">{item.value}</span>
            <span className="stat-label">{item.label}</span>
            <span className="kpi-note">{item.note}</span>
          </div>
        ))}
      </div>

      <nav className="overview-shortcuts" aria-label="Next steps">
        <a className="overview-shortcut" href="#/app/signals">
          <span>
            <strong>Signals</strong>
            <small>What changed, and why it matters</small>
          </span>
          <span className="overview-shortcut-arrow" aria-hidden="true">→</span>
        </a>
        <a className="overview-shortcut" href="#/app/matches">
          <span>
            <strong>{openMatches > 0 ? `${openMatches} match${openMatches === 1 ? "" : "es"} ready to act` : "Open matches"}</strong>
            <small>Your pipeline from signal to deal</small>
          </span>
          <span className="overview-shortcut-arrow" aria-hidden="true">→</span>
        </a>
      </nav>

      {cells.length === 0 && !cellsLoading && (
        <div className="empty-state start-here">
          <div>
            <h3>Not enough market data yet.</h3>
            <p>Log real records and scored cells appear here.</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              openAppTab("enter");
            }}
          >
            Add a record
          </button>
        </div>
      )}

      <Suspense
        fallback={
          <aside className="market-map-panel">
            <div className="workspace-note is-loading">Loading map…</div>
          </aside>
        }
      >
        <MarketMap supplies={supplies} demands={demands} prices={prices} counties={counties} markets={markets} />
      </Suspense>

      {top.length > 0 && (
        <section className="overview-top">
          <div className="section-heading">
            <h3>Top opportunities</h3>
            <a className="text-link" href="#/app/opportunity">
              Open opportunity surface →
            </a>
          </div>
          <ol className="opportunity-list">
            {top.map((cell) => (
              <li className="record-row" key={cell.key}>
                <span className="record-title">
                  {cell.productName} · {cell.locationName}
                </span>
                <span className="score-chip">
                  <span>O</span>
                  <strong>{cell.opportunity === null ? "—" : Math.round(cell.opportunity)}</strong>
                </span>
                <span className="score-chip">
                  <span>C</span>
                  <strong>{Math.round(cell.confidence)}</strong>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}