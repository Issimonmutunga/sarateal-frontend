import { Suspense, lazy } from "react";

import { SIGNAL_LABELS, type OpportunityCell } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { db, type DemandRecord, type PriceRecord, type SupplyRecord, type UserRole } from "../../lib/db";
import { setFocusLocation } from "../../lib/focus";
import { openAppTab } from "../../lib/hash";
import { openHelp } from "../../lib/journey";
import type { County, Market } from "../../types/api";
import { AppIcon } from "../AppIcon";

const MarketMap = lazy(() => import("./MarketMap").then((module) => ({ default: module.MarketMap })));

interface WorkspaceOverviewProps {
  cells: OpportunityCell[];
  cellsLoading: boolean;
  supplies: SupplyRecord[];
  demands: DemandRecord[];
  prices: PriceRecord[];
  counties: County[];
  markets: Market[];
  role: UserRole | null;
}

const NEXT_ACTION: Record<UserRole, { title: string; body: string; cta: string; href: string }> = {
  farmer: {
    title: "Have produce to sell?",
    body: "Add what you have and where. We'll show you which markets need it most.",
    cta: "Add produce for sale",
    href: "#/app/enter?kind=supply",
  },
  buyer: {
    title: "Looking for produce?",
    body: "Add what you need and where. We'll show you where supply is available.",
    cta: "Add what I need",
    href: "#/app/enter?kind=demand",
  },
  observer: {
    title: "Explore the market map",
    body: "See which markets and products look promising right now.",
    cta: "Open the map",
    href: "#/app/opportunity",
  },
};

export function WorkspaceOverview({
  cells,
  cellsLoading,
  supplies,
  demands,
  prices,
  counties,
  markets,
  role,
}: WorkspaceOverviewProps) {
  const { value: openMatches = 0 } = useLiveDexie(
    () => db.matches.filter((match) => match.status === "open" && !match.dismissed).count(),
    [],
  );
  const { value: totalMatches = 0 } = useLiveDexie(() => db.matches.count(), []);

  const scored = cells.filter((cell) => cell.opportunity !== null);
  const good = scored.filter((cell) => cell.entrySignal === "strong-entry" || cell.entrySignal === "promising");
  const top = [...scored].slice(0, 5);
  const recordsTotal = supplies.length + demands.length + prices.length;
  const next = NEXT_ACTION[role ?? "observer"];

  const checklist = [
    {
      done: role !== null,
      title: "Tell us who you are",
      body: "Seller, buyer, or just looking.",
      action: { label: "Choose", href: "#/app/settings" },
    },
    {
      done: recordsTotal > 0,
      title: "Add your first record",
      body: "Something you sell, need, or a price you saw.",
      action: { label: "Add", href: "#/app/enter" },
    },
    {
      done: scored.length > 0,
      title: "Get your first score",
      body: "Add a few records for the same product and county.",
      action: { label: "Add a price", href: "#/app/enter?kind=price" },
    },
    {
      done: totalMatches > 0,
      title: "Follow up on a deal",
      body: "Good opportunities are saved to My deals automatically.",
      action: { label: "See deals", href: "#/app/matches" },
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const allDone = doneCount === checklist.length;
  const nextItem = checklist.find((item) => !item.done);

  const openCell = (cell: OpportunityCell) => {
    setFocusLocation(cell.locationName);
    openAppTab("opportunity");
  };

  return (
    <div className="workspace-panel overview-panel">
      <section className="next-action-card">
        <div>
          <p className="eyebrow">Start here</p>
          <h2>{next.title}</h2>
          <p>{next.body}</p>
        </div>
        <a className="btn btn-primary" href={next.href}>
          {next.cta}
          <AppIcon name="arrow" size={16} />
        </a>
      </section>

      {!allDone && (
        <section className="checklist-card" aria-labelledby="checklist-title">
          <div className="checklist-head">
            <h3 id="checklist-title">Getting started</h3>
            <span className="checklist-count">
              {doneCount} of {checklist.length} done
            </span>
          </div>
          <div className="checklist-bar" aria-hidden="true">
            <span style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <ol className="checklist">
            {checklist.map((item) => (
              <li key={item.title} className={item.done ? "is-done" : item === nextItem ? "is-next" : undefined}>
                <span className="checklist-dot" aria-hidden="true">
                  {item.done && <AppIcon name="check" size={14} />}
                </span>
                <div className="checklist-text">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
                {!item.done && item === nextItem && (
                  <a className="btn btn-secondary btn-sm" href={item.action.href}>
                    {item.action.label}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="overview-stat-grid plain-stats">
        <a className="plain-stat" href="#/app/opportunity">
          <strong>{cellsLoading ? "…" : good.length}</strong>
          <span>good opportunities</span>
          <small>{cellsLoading ? "Checking markets…" : `out of ${scored.length} place${scored.length === 1 ? "" : "s"} with a score`}</small>
        </a>
        <a className="plain-stat" href="#/app/matches">
          <strong>{openMatches}</strong>
          <span>deals to follow up</span>
          <small>{openMatches > 0 ? "Open My deals to take the next step" : "Good opportunities land here"}</small>
        </a>
        <a className="plain-stat" href="#/app/supply">
          <strong>{recordsTotal}</strong>
          <span>records logged</span>
          <small>
            {supplies.length} for sale · {demands.length} wanted · {prices.length} prices
          </small>
        </a>
      </div>

      <section className="overview-top">
        <div className="section-heading">
          <h3>Best opportunities right now</h3>
          {top.length > 0 && (
            <a className="text-link" href="#/app/opportunity">
              See all on the map →
            </a>
          )}
        </div>

        {top.length === 0 ? (
          <div className="empty-state soft-empty">
            <p>
              {cellsLoading
                ? "Checking markets…"
                : "Nothing scored yet. Scores show up once a product has a few records in the same county."}
            </p>
            <button type="button" className="text-button" onClick={openHelp}>
              How do scores work?
            </button>
          </div>
        ) : (
          <ol className="opportunity-list plain-opportunities">
            {top.map((cell) => (
              <li key={cell.key}>
                <button type="button" className="plain-opportunity" onClick={() => openCell(cell)}>
                  <span className="plain-opportunity-main">
                    <strong>{cell.productName}</strong>
                    <span>
                      {cell.locationName}
                      {cell.county !== cell.locationName ? `, ${cell.county}` : ""}
                    </span>
                  </span>
                  <span className={`signal-chip is-${cell.entrySignal}`}>{SIGNAL_LABELS[cell.entrySignal]}</span>
                  <span className="plain-scores">
                    <span title="How attractive this looks (0–100)">
                      Opportunity <b>{cell.opportunity === null ? "—" : Math.round(cell.opportunity)}</b>
                    </span>
                    <span title="How sure we are (0–100)">
                      Confidence <b>{Math.round(cell.confidence)}</b>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Suspense
        fallback={
          <aside className="market-map-panel">
            <div className="workspace-note is-loading">Loading map…</div>
          </aside>
        }
      >
        <MarketMap supplies={supplies} demands={demands} prices={prices} counties={counties} markets={markets} />
      </Suspense>
    </div>
  );
}
