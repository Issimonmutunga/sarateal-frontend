import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { evidenceGapsForCell, surfaceCoverage } from "../../engine/gaps";
import type { ComponentKey, OpportunityCell } from "../../engine/types";
import { ENTRY_SIGNALS, SIGNAL_DESCRIPTIONS, SIGNAL_LABELS } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import { downloadSurfaceCsv } from "../../lib/export";
import { consumeFocusLocation } from "../../lib/focus";
import { openAppTab } from "../../lib/hash";
import type { County, Market } from "../../types/api";

const OpportunityMap = lazy(() =>
  import("./OpportunityMap").then((module) => ({ default: module.OpportunityMap })),
);

const SIGNAL_CLASS: Record<OpportunityCell["entrySignal"], string> = {
  "strong-entry": "is-strong-entry",
  promising: "is-promising",
  avoid: "is-avoid",
  "insufficient-data": "is-insufficient-data",
};

const COMPONENT_LABELS: Record<ComponentKey, string> = {
  ssd: "Supply–demand",
  price: "Price",
  access: "Access",
  seasonal: "Seasonal · weather",
  competition: "Competition",
};

interface OpportunityScreenProps {
  cells: OpportunityCell[];
  loading: boolean;
  counties: County[];
  markets: Market[];
  recordCounts: { supply: number; demand: number; price: number };
  referenceReady: boolean;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-KE").format(n);
}

function CellDetail({ cell }: { cell: OpportunityCell }) {
  const gaps = useMemo(() => evidenceGapsForCell(cell), [cell]);
  const gap = cell.demandUnits - cell.supplyUnits;
  const why =
    gap > 0
      ? `${fmt(gap)} ${cell.productUnit} of unmet demand here — buyers want more than current supply.`
      : `Logged supply currently covers demand in this cell.`;

  return (
    <article className="cell-card detail-cell">
      <div className="cell-main">
        <div className="cell-heading">
          <h4>
            {cell.productName} <span className="cell-unit">({cell.productUnit})</span>
          </h4>
          <p>{cell.county}</p>
        </div>
        <div className="cell-ranks">
          {cell.opportunity !== null ? (
            <>
              <div className="rank-metric">
                <span className="rank-metric-label">Opportunity</span>
                <div className="rank-bar">
                  <div
                    className="rank-fill bar-o"
                    style={{ width: `${Math.max(0, Math.min(100, cell.opportunity))}%` }}
                  />
                </div>
                <strong>{cell.opportunity.toFixed(0)}</strong>
              </div>
              <div className="rank-metric">
                <span className="rank-metric-label">Confidence</span>
                <div className="rank-bar">
                  <div
                    className="rank-fill bar-c"
                    style={{ width: `${Math.max(0, Math.min(100, cell.confidence))}%` }}
                  />
                </div>
                <strong>{cell.confidence.toFixed(0)}</strong>
              </div>
            </>
          ) : (
            <span className="muted">No component has 3+ real records yet.</span>
          )}
        </div>
      </div>

      <div className="cell-meta">
        <span
          className={`signal-chip ${SIGNAL_CLASS[cell.entrySignal]}`}
          title={SIGNAL_DESCRIPTIONS[cell.entrySignal]}
        >
          {SIGNAL_LABELS[cell.entrySignal]}
        </span>
        <span className="confidence-badge">
          {[
            cell.supplyEntries > 0 ? `${cell.supplyEntries} supply` : null,
            cell.demandEntries > 0 ? `${cell.demandEntries} demand` : null,
            cell.priceEntries > 0 ? `${cell.priceEntries} price` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "no records logged"}
        </span>
      </div>

      <div className="detail-numbers">
        <div className="detail-number">
          <span className="stat-value">{fmt(cell.supplyUnits)}</span>
          <span className="stat-label">supply · {cell.productUnit}</span>
        </div>
        <div className="detail-number">
          <span className="stat-value">{fmt(cell.demandUnits)}</span>
          <span className="stat-label">demand · {cell.productUnit}</span>
        </div>
        <div className="detail-number">
          <span className="stat-value">{cell.pricePoints}</span>
          <span className="stat-label">price points</span>
        </div>
      </div>

      {cell.opportunity !== null && <p className="why-note">{why}</p>}

      {cell.components.seasonal.value !== null &&
        cell.components.seasonal.note.includes("weather suitability") && (
          <p className="weather-note">
            Live weather signals are contributing to this score (seasonal component).
          </p>
        )}

      <button
        type="button"
        className="btn btn-primary flow-next match-cta"
        onClick={() => openAppTab("matches")}
      >
        Find a match →
      </button>

      {gaps.length > 0 && (
        <details className="gaps-details">
          <summary>What's missing ({gaps.filter((item) => item.blocking).length} blocking)</summary>
          <ul className="gaps-list">
            {gaps.map((item) => (
              <li key={item.component} className={`gap-line${item.blocking ? " is-blocking" : ""}`}>
                <span className="gap-component">{COMPONENT_LABELS[item.component]}</span>
                <span className="gap-text">{item.text}</span>
                <span className="gap-count">
                  {item.current} of {item.needed}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details className="component-details">
        <summary>Component breakdown</summary>
        <ul>
          {(Object.keys(cell.components) as Array<ComponentKey>).map((key) => {
            const component = cell.components[key];

            return (
              <li key={key}>
                <span className="component-name">{key}</span>
                <span className="component-value">
                  {component.value !== null ? `${component.value.toFixed(1)} / 100` : "—"}
                </span>
                <span className="component-conf">conf {(component.confidence * 100).toFixed(0)}%</span>
                <span className="component-note">{component.note}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </article>
  );
}

export function OpportunityScreen({
  cells,
  loading,
  counties,
  markets,
  recordCounts,
  referenceReady,
}: OpportunityScreenProps) {
  const { value: matches = [] } = useLiveDexie(() => db.matches.toArray(), []);
  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [signalFilter, setSignalFilter] = useState<"" | OpportunityCell["entrySignal"]>("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [focusPending, setFocusPending] = useState<string | null>(() => consumeFocusLocation());

  useEffect(() => {
    if (focusPending === null || cells.length === 0) {
      return;
    }

    const byLocation = new Set(cells.map((cell) => cell.locationName));

    const timer = window.setTimeout(() => {
      if (byLocation.has(focusPending)) {
        setSelectedLocation(focusPending);
      }

      setFocusPending(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [focusPending, cells]);

  const productsInCells = useMemo(
    () => [...new Set(cells.map((cell) => cell.productName))].sort((a, b) => a.localeCompare(b)),
    [cells],
  );

  const filteredCells = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return cells.filter((cell) => {
      const matchesQuery =
        needle.length === 0 ||
        cell.productName.toLowerCase().includes(needle) ||
        cell.locationName.toLowerCase().includes(needle) ||
        cell.county.toLowerCase().includes(needle);

      const matchesProduct = productFilter === "" || cell.productName === productFilter;

      const matchesSignal = signalFilter === "" || cell.entrySignal === signalFilter;

      return matchesQuery && matchesProduct && matchesSignal;
    });
  }, [cells, query, productFilter, signalFilter]);

  const locationCells = useMemo(() => {
    const byLocation = new Map<string, OpportunityCell[]>();

    for (const cell of filteredCells) {
      const bucket = byLocation.get(cell.locationName) ?? [];

      bucket.push(cell);
      byLocation.set(cell.locationName, bucket);
    }

    return byLocation;
  }, [filteredCells]);

  const selectedCells = selectedLocation === null ? [] : (locationCells.get(selectedLocation) ?? []);

  const topCells = useMemo(() => [...cells].slice(0, 8), [cells]);

  const coverage = surfaceCoverage(cells);
  const scoredCount = cells.filter((cell) => cell.opportunity !== null).length;

  const selectLocation = (location: string | null) => {
    if (location === null || locationCells.has(location)) {
      setSelectedLocation(location);
    }
  };

  return (
    <div className="opportunity-screen">
      <div className="opportunity-screen-top">
        <div className="surface-meta">
          <span className="surface-count">
            {scoredCount} scored cell{scoredCount === 1 ? "" : "s"} across {cells.length} market–
            product cell{cells.length === 1 ? "" : "s"}
          </span>
          {cells.length > 0 && (
            <button
              type="button"
              className="sort-button"
              onClick={() => void downloadSurfaceCsv(cells, matches)}
            >
              Export scored cells (CSV)
            </button>
          )}
        </div>
      </div>

      {cells.length > 0 && (
        <div className="surface-filter-row">
          <input
            type="search"
            className="surface-search"
            placeholder="Filter by product, market or county…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {productsInCells.length > 1 && (
            <select
              className="surface-select"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            >
              <option value="">All products</option>
              {productsInCells.map((productItem) => (
                <option key={productItem} value={productItem}>
                  {productItem}
                </option>
              ))}
            </select>
          )}
          <div className="filter-chips surface-signal-chips" role="group" aria-label="Filter by signal">
            <button
              type="button"
              className={`filter-chip${signalFilter === "" ? " is-active" : ""}`}
              onClick={() => setSignalFilter("")}
            >
              All
            </button>
            {ENTRY_SIGNALS.map((signal) => (
              <button
                key={signal}
                type="button"
                className={`filter-chip is-${signal}${signalFilter === signal ? " is-active" : ""}`}
                aria-pressed={signalFilter === signal}
                onClick={() => setSignalFilter(signalFilter === signal ? "" : signal)}
              >
                {SIGNAL_LABELS[signal]}
              </button>
            ))}
          </div>
          <span className="surface-count">{filteredCells.length} shown</span>
        </div>
      )}

      <div className="opportunity-layout">
        <div className="opportunity-map-panel">
          <div className="map-legend" role="group" aria-label="Opportunity legend">
            <span className="signal-chip is-strong-entry">High opportunity</span>
            <span className="signal-chip is-promising">Promising</span>
            <span className="signal-chip is-avoid">Low</span>
            <span className="signal-chip is-insufficient-data">Insufficient data</span>
          </div>

          {!loading ? (
            <Suspense
              fallback={
                <div className="opportunity-map-canvas">
                  <div className="skeleton-block opportunity-map-skeleton" />
                </div>
              }
            >
              <OpportunityMap
                cells={filteredCells}
                counties={counties}
                markets={markets}
                selectedLocation={selectedLocation}
                onSelect={selectLocation}
              />
            </Suspense>
          ) : (
            <div className="opportunity-map-canvas">
              <div className="skeleton-block opportunity-map-skeleton" />
            </div>
          )}

          {cells.length === 0 && !loading && (
            <div className="empty-state is-map-overlay">
              <h3>Not enough market data yet.</h3>
              <p>
                Log real records and scored locations appear here — currently {recordCounts.supply}{" "}
                supply, {recordCounts.demand} demand, {recordCounts.price} price.
              </p>
            </div>
          )}
        </div>

        <aside className="opportunity-detail" aria-label="Opportunity details">
          {selectedLocation === null ? (
            <div className="opportunity-detail-inner">
              <div className="section-heading">
                <h3>Top opportunities</h3>
                <p className="muted">Select a location on the map to inspect it.</p>
              </div>

              {cells.length > 0 && (
                <p className="coverage-summary">
                  <span className="coverage-chip">{coverage.scored} scored</span>
                  <span className="coverage-chip is-good">{coverage.unblocked} ready to act</span>
                </p>
              )}

              {loading && (
                <div className="detail-skeleton">
                  <div className="skeleton-block skeleton-line" />
                  <div className="skeleton-block skeleton-line" />
                  <div className="skeleton-block skeleton-line" />
                </div>
              )}

              {!loading && topCells.length === 0 && (
                <div className="empty-state">
                  <h3>Nothing to list yet.</h3>
                  <p>
                    The top opportunities will appear here once at least three real records exist in
                    a market–product cell. Reference data {referenceReady ? "is loaded" : "is loading"}.
                  </p>
                </div>
              )}

              {!loading && topCells.length > 0 && (
                <ol className="opportunity-list">
                  {topCells.map((cell) => (
                    <li key={cell.key} className="record-row is-clickable">
                      <button
                        type="button"
                        className="opportunity-row-button"
                        onClick={() => selectLocation(cell.locationName)}
                      >
                        <span className="record-title">
                          {cell.productName} · {cell.locationName}
                        </span>
                        <span className={`score-chip is-${cell.entrySignal}`}>
                          <span>Op</span>
                          <strong>{cell.opportunity === null ? "—" : Math.round(cell.opportunity)}</strong>
                        </span>
                        <span className="score-chip">
                          <span>Conf</span>
                          <strong>{Math.round(cell.confidence)}</strong>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ) : (
            <div className="opportunity-detail-inner">
              <div className="section-heading">
                <div className="detail-heading-row">
                  <h3>{selectedLocation}</h3>
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => setSelectedLocation(null)}
                  >
                    Close
                  </button>
                </div>
                {selectedCells.length === 0 && (
                  <p className="section-subnote">
                    Reference market — needs three real records per cell to score.
                  </p>
                )}
              </div>

              {selectedCells.map((cell) => (
                <CellDetail key={cell.key} cell={cell} />
              ))}

              {selectedCells.length === 0 && !loading && (
                <div className="empty-state">
                  <h3>No scored cells at this location.</h3>
                  <p>Add real records for this market to start scoring.</p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}