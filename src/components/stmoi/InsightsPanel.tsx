import { useMemo } from "react";

import type { OpportunityCell } from "../../engine/types";
import { countyLeaderboard, pipelineFunnel, surfaceCoverage, topOpportunities } from "../../engine/insights";
import { medianDealDays, type MatchLifecycleEvent } from "../../engine/matchAnalytics";
import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import { SIGNAL_LABELS } from "../../engine/types";

interface InsightsPanelProps {
  cells: OpportunityCell[];
}

const STATUS_LABELS: Record<string, string> = {
  open: "New",
  contacted: "Contacted",
  deal: "Deal agreed",
  closed: "Completed",
};

function fmt(value: number): string {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function InsightsPanel({ cells }: InsightsPanelProps) {
  const { value: matches = [] } = useLiveDexie(() => db.matches.toArray(), []);
  const { value: events = [] } = useLiveDexie(() => db.matchEvents.toArray(), []);

  const coverage = useMemo(() => surfaceCoverage(cells), [cells]);
  const top = useMemo(() => topOpportunities(cells, 5), [cells]);
  const counties = useMemo(() => countyLeaderboard(cells), [cells]);
  const funnel = useMemo(() => pipelineFunnel(matches), [matches]);

  const medianDeal = useMemo(() => {
    const byMatch = new Map<number, MatchLifecycleEvent[]>();

    for (const event of events) {
      const bucket = byMatch.get(event.matchId) ?? [];

      bucket.push({ status: event.status, at: event.at });
      byMatch.set(event.matchId, bucket);
    }

    const relevance = matches
      .map((match) => byMatch.get(match.id as number) ?? [])
      .filter((bucket) => bucket.length > 0);

    return medianDealDays(relevance);
  }, [events, matches]);

  const dealRate = useMemo(() => {
    const trackable = matches.filter(
      (match) => match.status !== "open" && match.status !== "contacted",
    ).length;
    const deals = matches.filter(
      (match) => match.status === "deal" || match.status === "closed",
    ).length;

    return trackable > 0 ? (deals / trackable) * 100 : 0;
  }, [matches]);

  const funnelMax = Math.max(1, funnel.open, funnel.contacted, funnel.deal, funnel.closed);
  const entryUnits = counties.reduce((sum, county) => sum + county.entryUnits, 0);

  const strongest = top[0]?.cell ?? null;
  const gap = strongest ? strongest.demandUnits - strongest.supplyUnits : 0;

  return (
    <div className="insights-panel">
      <section className="today-picture" aria-label="Today's market picture">
        <div className="today-picture-head">
          <p className="eyebrow">At a glance</p>
          <h3>Today's market picture</h3>
        </div>
        <div className="today-picture-grid">
          <div className="today-card">
            <h4>{strongest && gap > 0 ? "Demand is outpacing supply." : "Still mapping the market."}</h4>
            <p className="today-sub">
              {strongest
                ? `${strongest.locationName} · ${strongest.productName}`
                : "No scored cells yet."}
            </p>
            <p className="today-value">
              {strongest && gap > 0 ? `+${fmt(gap)} ${strongest.productUnit}` : "—"}
            </p>
            <p className="today-why">
              {strongest && gap > 0
                ? "Buyers want more than current supply in this cell."
                : "Log real records and scores appear here instantly."}
            </p>
          </div>

          <div className="today-card">
            <h4>
              {coverage.scored > 0
                ? `${coverage.scored} of ${cells.length} cells scored.`
                : "Not enough evidence yet."}
            </h4>
            <p className="today-sub">Evidence coverage</p>
            <p className="today-value">{coverage.scored}</p>
            <p className="today-why">
              {coverage.scored > 0
                ? "Every score traces to real records you logged."
                : "A cell needs three real records before it scores."}
            </p>
          </div>

          <div className="today-card">
            <h4>
              {matches.length > 0
                ? medianDeal !== null
                  ? "Deals move in about a week."
                  : `${matches.length} match${matches.length === 1 ? "" : "es"} in your pipeline.`
                : "No matches yet."}
            </h4>
            <p className="today-sub">
              {matches.length > 0 ? `Median ${medianDeal?.toFixed(1) ?? "—"} days` : "Match pipeline"}
            </p>
            <p className="today-value">{medianDeal !== null ? `${medianDeal.toFixed(1)} d` : matches.length}</p>
            <p className="today-why">
              {matches.length > 0
                ? "Strong cells land here automatically."
                : "Score a strong cell and the first match appears here."}
            </p>
          </div>
        </div>
      </section>

      <div className="section-heading">
        <h3>Market intelligence</h3>
        <p className="section-subnote">Opportunities, coverage, pipeline.</p>
      </div>

      <div className="insights-grid">
        <section className="insights-card">
          <h4>Top opportunities</h4>
          {top.length === 0 && <p className="muted">No scored cells yet.</p>}
          <ol className="insight-list">
            {top.map(({ rank, cell }) => (
              <li key={cell.key}>
                <span className="insight-rank">{rank}</span>
                <span className="insight-body">
                  <strong>{cell.productName}</strong>
                  <span className="muted">
                    {cell.locationName} · {cell.county}
                  </span>
                </span>
                <span className="insight-value">
                  <strong>{cell.opportunity?.toFixed(0)}</strong> O ·{" "}
                  {cell.confidence.toFixed(0)} C
                  <span className="insight-signal">{SIGNAL_LABELS[cell.entrySignal]}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="insights-card">
          <h4>County leaderboard</h4>
          {counties.length === 0 && <p className="muted">No scored cells yet.</p>}
          <ol className="insight-list">
            {counties.slice(0, 8).map((county, index) => (
              <li key={county.county}>
                <span className="insight-rank">{index + 1}</span>
                <span className="insight-body">
                  <strong>{county.county}</strong>
                  <span className="muted">
                    {county.entryUnits.toFixed(0)} tracked units
                  </span>
                </span>
                <span className="insight-value">
                  <strong>{county.actionable}</strong> actionable
                  <span className="insight-signal">avg opportunity {county.avgOpportunity.toFixed(0)}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="section-subnote">
            {entryUnits.toFixed(0)} total tracked units across {coverage.scored} scored cells.
          </p>
        </section>
      </div>

      <div className="insights-grid">
        <section className="insights-card">
          <h4>Coverage</h4>
          <p className="coverage-line">
            <strong>{coverage.scored}</strong> cells scored ·{" "}
            <strong>{coverage.actionable}</strong> actionable ·{" "}
            <strong>{coverage.insufficient}</strong> avoid
          </p>
          <p className="muted">
            {cells.length - coverage.scored} cells still lack the three-point evidence floor.
          </p>
        </section>

        <section className="insights-card">
          <h4>Match pipeline</h4>
          {matches.length === 0 && <p className="muted">No matches yet.</p>}
          <div className="funnel">
            {(["open", "contacted", "deal", "closed"] as const).map((status) => {
              const count = funnel[status];

              return (
                <div className="funnel-row" key={status}>
                  <span className="funnel-label">{STATUS_LABELS[status]}</span>
                  <span className="funnel-track">
                    <span
                      className="funnel-fill"
                      style={{ width: `${(count / funnelMax) * 100}%` }}
                    />
                  </span>
                  <span className="funnel-count">{count}</span>
                </div>
              );
            })}
          </div>
          <p className="section-subnote">
            Deal rate <strong>{dealRate.toFixed(0)}%</strong>
            {medianDeal !== null && (
              <>
                {" "}
                · median time to deal <strong>{medianDeal.toFixed(1)} d</strong>
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}