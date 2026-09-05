import { useMemo, useState } from "react";

import { evidenceGapsForCell, surfaceCoverage } from "../../engine/gaps";
import type { ComponentKey, OpportunityCell } from "../../engine/types";
import { SIGNAL_DESCRIPTIONS, SIGNAL_LABELS } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import { downloadSurfaceCsv } from "../../lib/export";

interface OpportunitySurfaceProps {
  cells: OpportunityCell[];
  loading: boolean;
  recordCounts: { supply: number; demand: number; price: number };
}

const SIGNAL_COLORS: Record<OpportunityCell["entrySignal"], string> = {
  "strong-entry": "#5f6f43",
  promising: "#a67c2e",
  avoid: "#a5603f",
  "insufficient-data": "#8b8578",
};

const COMPONENT_LABELS: Record<ComponentKey, string> = {
  ssd: "Supply–demand",
  price: "Price",
  access: "Access",
  seasonal: "Seasonal",
  competition: "Competition",
};

function QuadrantPlot({ cells }: { cells: OpportunityCell[] }) {
  const scored = cells.filter((cell) => cell.opportunity !== null);

  const dot = (cell: OpportunityCell, index: number) => (
    <g key={cell.key}>
      <circle
        cx={Math.max(4, Math.min(96, cell.confidence))}
        cy={Math.max(4, Math.min(96, 100 - (cell.opportunity ?? 0)))}
        r="4"
        fill={SIGNAL_COLORS[cell.entrySignal]}
        opacity="0.9"
      />
      <text
        x={Math.max(4, Math.min(96, cell.confidence)) + 6}
        y={Math.max(4, Math.min(96, 100 - (cell.opportunity ?? 0))) + 3}
        fontSize="4"
        fill="#46403a"
      >
        {index + 1}
      </text>
    </g>
  );

  return (
    <div className="quadrant-block">
      <h4>The entry-signal rule (2×2)</h4>
      <p className="muted">
        Opportunity ≥ 60 and confidence ≥ 50 is a <strong>strong entry</strong>. High opportunity
        with thin evidence is <strong>promising</strong>. Confirmed low opportunity is{" "}
        <strong>avoid</strong>. Low on both is <strong>insufficient data</strong>.
      </p>
      <svg viewBox="0 0 100 100" className="quadrant-plot" role="img" aria-label="O by C scatter plot">
        <rect x="1" y="1" width="98" height="98" rx="4" fill="#f4f1e9" stroke="rgba(41,38,31,0.12)" />
        <line x1="50" y1="1" x2="50" y2="99" stroke="rgba(95,111,67,0.35)" strokeDasharray="2 2" />
        <line x1="1" y1="40" x2="99" y2="40" stroke="rgba(95,111,67,0.35)" strokeDasharray="2 2" />
        <text x="3" y="12" fontSize="4" fill="#82796b">C high · O low</text>
        <text x="52" y="12" fontSize="4" fill="#82796b">C high · O high</text>
        <text x="52" y="97" fontSize="4" fill="#82796b">C low · O low</text>
        <text x="3" y="97" fontSize="4" fill="#82796b">C low · O high</text>
        <text x="70" y="99" fontSize="3.5" fill="#82796b">confidence →</text>
        {scored.map(dot)}
      </svg>
      <div className="quadrant-legend">
        {(Object.keys(SIGNAL_LABELS) as Array<keyof typeof SIGNAL_LABELS>).map((signal) => (
          <span key={signal}>
            <i style={{ background: SIGNAL_COLORS[signal] }} />
            {SIGNAL_LABELS[signal]}
          </span>
        ))}
      </div>
    </div>
  );
}

function RankBar({ label, value, tone }: { label: string; value: number; tone: "o" | "c" }) {
  const toneClass = tone === "o" ? "bar-o" : "bar-c";

  return (
    <div className="rank-metric" title={`${label}: ${value.toFixed(1)} / 100`}>
      <span className="rank-metric-label">{label}</span>
      <div className="rank-bar">
        <div className={`rank-fill ${toneClass}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <strong>{value.toFixed(0)}</strong>
    </div>
  );
}

function ConfidenceBadge({ cell }: { cell: OpportunityCell }) {
  const parts = [
    cell.supplyEntries > 0 ? `${cell.supplyEntries} supply` : null,
    cell.demandEntries > 0 ? `${cell.demandEntries} demand` : null,
    cell.priceEntries > 0 ? `${cell.priceEntries} price point${cell.priceEntries === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  const text = parts.length > 0 ? `${parts.join(" · ")} logged` : "no records logged";

  return <span className="confidence-badge">{text}</span>;
}

function EvidenceGaps({ cell }: { cell: OpportunityCell }) {
  const gaps = useMemo(() => evidenceGapsForCell(cell), [cell]);

  if (gaps.length === 0) {
    return (
      <div className="gaps-details is-clear">
        <p className="gaps-clear">
          No blocking evidence gaps — every component has real evidence behind it.
        </p>
      </div>
    );
  }

  return (
    <details className="gaps-details">
      <summary>
        What&apos;s missing ({gaps.filter((item) => item.blocking).length} blocking)
      </summary>
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
  );
}

function CoverageSummary({ cells }: { cells: OpportunityCell[] }) {
  if (cells.length === 0) {
    return null;
  }

  const coverage = surfaceCoverage(cells);

  return (
    <div className="coverage-summary" aria-label="Data coverage">
      <span className="coverage-chip">
        {coverage.scored} scored
      </span>
      <span className="coverage-chip is-good">
        {coverage.unblocked} ready to act
      </span>
      <span className="coverage-chip is-gap">
        {coverage.totalGaps} evidence gap{coverage.totalGaps === 1 ? "" : "s"}
      </span>
      <p className="muted coverage-note">
        “Ready to act” means no component is blocked by missing evidence; add records wherever{" "}
        <em>What&apos;s missing</em> lists a gap.
      </p>
    </div>
  );
}

export function OpportunitySurface({ cells, loading, recordCounts }: OpportunitySurfaceProps) {
  const { value: matches = [] } = useLiveDexie(() => db.matches.toArray(), []);
  const scoredCount = cells.filter((cell) => cell.opportunity !== null).length;
  const [query, setQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState<"" | OpportunityCell["entrySignal"]>("");
  const [limit, setLimit] = useState(25);

  const filteredCells = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = (cell: OpportunityCell) =>
      needle.length === 0 ||
      cell.productName.toLowerCase().includes(needle) ||
      cell.locationName.toLowerCase().includes(needle) ||
      cell.county.toLowerCase().includes(needle);

    const matchesSignal = (cell: OpportunityCell) =>
      signalFilter === "" || cell.entrySignal === signalFilter;

    const visible = cells.filter(
      (cell) => matchesQuery(cell) && matchesSignal(cell),
    );

    return limit > 0 ? visible.slice(0, limit) : visible;
  }, [cells, query, signalFilter, limit]);

  return (
    <div className="opportunity-surface">
      <div className="surface-header">
        <p className="section-subnote">
          Grouped by market (or county) × product. <strong>O</strong> re-weights only the components
          with real evidence; <strong>C</strong> dilutes as evidence is missing — so single records
          never masquerade as scored opportunity.
        </p>
        <div className="surface-meta">
          <span className="surface-count">
            {scoredCount} scored cell{scoredCount === 1 ? "" : "s"} across {cells.length}{" "}
            market–product cell{cells.length === 1 ? "" : "s"}
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
          <select
            className="surface-select"
            value={signalFilter}
            onChange={(event) =>
              setSignalFilter(event.target.value as "" | OpportunityCell["entrySignal"])
            }
          >
            <option value="">All signals</option>
            {(Object.keys(SIGNAL_LABELS) as Array<OpportunityCell["entrySignal"]>).map((signal) => (
              <option key={signal} value={signal}>
                {SIGNAL_LABELS[signal]}
              </option>
            ))}
          </select>
          <select
            className="surface-select"
            value={String(limit)}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            <option value="10">Show 10</option>
            <option value="25">Show 25</option>
            <option value="50">Show 50</option>
            <option value="0">Show all</option>
          </select>
          <span className="surface-count">
            {filteredCells.length} shown{filteredCells.length !== cells.length ? ` of ${cells.length}` : ""}
          </span>
        </div>
      )}

      {loading && <p className="workspace-note">Recomputing the surface from current records…</p>}

      <CoverageSummary cells={cells} />

      {!loading && cells.length === 0 && (
        <div className="empty-state">
          <h3>No market–product cells to score yet.</h3>
          <p>
            Log at least three real supply, demand, or price records for a market–product cell for a
            component to begin contributing. Remember: no simulated or imputed records — empty data
            shows as low confidence, never as a guess.
          </p>
          <p className="muted">
            Currently in IndexedDB: {recordCounts.supply} supply, {recordCounts.demand} demand,{" "}
            {recordCounts.price} price records.
          </p>
        </div>
      )}

      {cells.length > 0 && <QuadrantPlot cells={cells} />}

      {filteredCells.length > 0 && (
        <ol className="cell-list">
          {filteredCells.map((cell, index) => (
            <li key={cell.key} className="cell-card">
              <div className="cell-main">
                <div className="cell-heading">
                  <h4>
                    {cell.productName} <span className="cell-unit">({cell.productUnit})</span>
                  </h4>
                  <p>
                    {cell.locationName} · {cell.county}
                  </p>
                </div>
                <div className="cell-ranks">
                  {cell.opportunity !== null ? (
                    <>
                      <RankBar label="O" value={cell.opportunity} tone="o" />
                      <RankBar label="C" value={cell.confidence} tone="c" />
                    </>
                  ) : (
                    <span className="muted">No component has 3+ real records yet.</span>
                  )}
                </div>
              </div>

              <div className="cell-meta">
                <span
                  className="signal-chip"
                  style={{ background: `${SIGNAL_COLORS[cell.entrySignal]}18`, color: SIGNAL_COLORS[cell.entrySignal] }}
                  title={SIGNAL_DESCRIPTIONS[cell.entrySignal]}
                >
                  {SIGNAL_LABELS[cell.entrySignal]}
                </span>
                <ConfidenceBadge cell={cell} />
              </div>

              <details className="component-details">
                <summary>Component breakdown ({index + 1})</summary>
                <ul>
                  {(Object.keys(cell.components) as Array<keyof typeof cell.components>).map((key) => {
                    const component = cell.components[key];

                    return (
                      <li key={key}>
                        <span className="component-name">{key}</span>
                        <span className="component-value">
                          {component.value !== null ? `${component.value.toFixed(1)} / 100` : "—"}
                        </span>
                        <span className="component-conf">conf {(component.confidence * 100).toFixed(0)}%</span>
                        <span className="component-obs">{component.observations} obs</span>
                        <span className="component-note">{component.note}</span>
                      </li>
                    );
                  })}
                </ul>
              </details>

              <EvidenceGaps cell={cell} />

              <details className="record-details">
                <summary>
                  Contributing records (
                  {cell.supplyEntries + cell.demandEntries + cell.priceEntries})
                </summary>
                {cell.supplyEntries + cell.demandEntries + cell.priceEntries === 0 && (
                  <p className="muted">No records contribute to this cell yet.</p>
                )}
                {cell.records.supply.map((record) => (
                  <p key={record.id} className="record-line">
                    <span className="record-type">supply</span>
                    {record.quantity} {record.unit} · from {record.availableFrom} · by{" "}
                    {record.contributor}
                  </p>
                ))}
                {cell.records.demand.map((record) => (
                  <p key={record.id} className="record-line">
                    <span className="record-type">demand</span>
                    {record.quantity} {record.unit} · needed from {record.neededFrom} · by{" "}
                    {record.contributor}
                  </p>
                ))}
                {cell.records.prices.map((record) => (
                  <p key={record.id} className="record-line">
                    <span className="record-type">price</span>
                    {record.price} {record.currency}/{record.unit} · on {record.observedOn} · by{" "}
                    {record.contributor}
                  </p>
                ))}
              </details>
            </li>
          ))}
        </ol>
      )}

      {filteredCells.length === 0 && (
        <p className="workspace-note">No cells match the current filters.</p>
      )}
    </div>
  );
}