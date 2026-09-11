import { useEffect, useMemo, useState } from "react";

import { useLiveDexie } from "../../hooks/useDexie";
import { db, type MatchRecord, type MatchStatus } from "../../lib/db";
import {
  buildTimeline,
  medianDealDays,
  type MatchLifecycleEvent,
} from "../../engine/matchAnalytics";
import { setMatchStatus } from "../../engine/matches";
import { SIGNAL_LABELS, OPPORTUNITY_HIGH } from "../../engine/types";
import { adviceForMatch } from "../../engine/advice";
import type { EntrySignalRef } from "../../lib/db";

const STATUS_ORDER: MatchStatus[] = ["open", "contacted", "deal", "closed"];
const SIGNAL_RANK: Record<EntrySignalRef, number> = {
  "strong-entry": 0,
  promising: 1,
  avoid: 2,
  "insufficient-data": 3,
};
const SIGNAL_CLASS: Record<EntrySignalRef, string> = {
  "strong-entry": "is-strong-entry",
  promising: "is-promising",
  avoid: "is-avoid",
  "insufficient-data": "is-insufficient-data",
};
const STATUS_LABELS: Record<MatchStatus, string> = {
  open: "New",
  contacted: "Contacted",
  deal: "Deal agreed",
  closed: "Completed",
};

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)} h ago`;
  }

  return `${Math.floor(seconds / 86_400)} d ago`;
}

function MatchCard({ match, events, lastSeenAt }: { match: MatchRecord; events: MatchLifecycleEvent[]; lastSeenAt: string | null }) {
  const timeline = useMemo(() => buildTimeline(events), [events]);
  const isNew = lastSeenAt !== null && Date.parse(match.createdAt) > Date.parse(lastSeenAt);
  const advice = useMemo(() => adviceForMatch(match, events), [match, events]);

  const setStatus = async (status: MatchStatus) => {
    await setMatchStatus(match.id as number, status);
  };

  const setNotes = async (notes: string) => {
    await db.matches.update(match.id as number, {
      outcomeNotes: notes,
      updatedAt: new Date().toISOString(),
    });
  };

  const dismiss = async () => {
    await db.matches.update(match.id as number, {
      dismissed: true,
      updatedAt: new Date().toISOString(),
    });
  };

  const restore = async () => {
    await db.matches.update(match.id as number, {
      dismissed: false,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <li className={`match-card${match.dismissed ? " is-dismissed" : ""}`}>
      <div className="cell-main">
        <div className="cell-heading">
          <h4>
            {match.productName} <span className="cell-unit">({match.productUnit})</span>
          </h4>
          <p>
            {match.locationName} · {match.county}
          </p>
          <p className="muted">
            Match created {timeAgo(match.createdAt)} · updated {timeAgo(match.updatedAt)}
          </p>
        </div>

        <div className="match-scores">
          <div className="match-score">
            <span className="match-score-label">Op</span>
            <strong>{match.opportunityScore.toFixed(0)}</strong>
          </div>
          <div className="match-score">
            <span className="match-score-label">Conf</span>
            <strong>{match.confidenceScore.toFixed(0)}</strong>
          </div>
          <span className={`signal-chip ${SIGNAL_CLASS[match.entrySignal]}`}>
            {SIGNAL_LABELS[match.entrySignal]}
          </span>
          {isNew && <span className="new-chip">New since last visit</span>}
          {match.dismissed && <span className="dismissed-chip">Dismissed</span>}
        </div>
      </div>

      <div className="match-actions">
        <div className="match-progress" aria-label={`Match progress — ${STATUS_LABELS[match.status]}`}>
          {STATUS_ORDER.map((status, index) => (
            <span
              key={status}
              className={`match-progress-step${index <= STATUS_ORDER.indexOf(match.status) ? " is-filled" : ""}${index === STATUS_ORDER.indexOf(match.status) ? " is-current" : ""}`}
            >
              <span className="match-progress-label-mini">{STATUS_LABELS[status]}</span>
            </span>
          ))}
        </div>

        <div className="status-row inline" aria-label="Update match status">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              className={`status-button${match.status === status ? " is-active" : ""}`}
              onClick={() => void setStatus(status)}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <label className="form-field match-notes">
          <span>Outcome notes (real outcomes only)</span>
          <textarea
            rows={2}
            defaultValue={match.outcomeNotes ?? ""}
            placeholder="e.g. Agreed 500 kg Maize at 60 KES/kg, delivery next week…"
            onBlur={(event) => void setNotes(event.target.value)}
          />
        </label>

        <div className="match-dismiss-row">
          {timeline.length > 0 && (
            <details className="match-timeline">
              <summary>
                Timeline ({timeline.length} event{timeline.length === 1 ? "" : "s"})
              </summary>
              <ol className="timeline-list">
                {timeline.map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    <span className="timeline-status">{STATUS_LABELS[event.status]}</span>
                    <span className="timeline-date">
                      {new Date(event.at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          )}

          {advice.length > 0 && (
            <ul className="advice-list" aria-label="Suggested next steps">
              {advice.map((item, index) => (
                <li key={`${item.priority}-${index}`} className={`advice-chip advice-${item.priority}`}>
                  {item.text}
                </li>
              ))}
            </ul>
          )}

          {!match.dismissed ? (
            <button type="button" className="dismiss-button" onClick={() => void dismiss()}>
              Dismiss match
            </button>
          ) : (
            <button type="button" className="restore-button" onClick={() => void restore()}>
              Restore to active
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

type SortKey = "signal" | "opportunity" | "confidence";

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "signal", label: "By signal" },
  { id: "opportunity", label: "By opportunity" },
  { id: "confidence", label: "By confidence" },
];

type FilterKey = "all" | "new" | "contacted" | "progress" | "completed";

const FILTER_OPTIONS: Array<{ id: FilterKey; label: string }> = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "progress", label: "In progress" },
  { id: "completed", label: "Completed" },
];

function matchesFilter(match: MatchRecord, filter: FilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "new":
      return match.status === "open";
    case "contacted":
      return match.status === "contacted";
    case "progress":
      return match.status === "open" || match.status === "contacted";
    case "completed":
      return match.status === "deal" || match.status === "closed";
  }
}

export function MatchesPanel() {
  const [sortKey, setSortKey] = useState<SortKey>("signal");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [pruneThreshold, setPruneThreshold] = useState(String(OPPORTUNITY_HIGH));
  const [showDismissed, setShowDismissed] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void db.settings
      .get("lastSeenMatchesAt")
      .then((record) => {
        const now = new Date().toISOString();
        const previous = typeof record?.value === "string" ? record.value : null;

        if (mounted) {
          setLastSeenAt(previous);
        }

        if (previous === null || now > previous) {
          return db.settings.put({ key: "lastSeenMatchesAt", value: now });
        }

        return undefined;
      })
      .catch(() => {
        // Badge is best-effort.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const { value: matches = [] } = useLiveDexie(
    () => db.matches.orderBy("updatedAt").reverse().toArray(),
    [],
  );

  const { value: lifecycleEvents = [] } = useLiveDexie(
    () => db.matchEvents.toArray(),
    [],
  );

  const eventsByMatch = useMemo(() => {
    const grouped = new Map<number, MatchLifecycleEvent[]>();

    for (const event of lifecycleEvents) {
      const bucket = grouped.get(event.matchId) ?? [];

      bucket.push({ status: event.status, at: event.at });
      grouped.set(event.matchId, bucket);
    }

    return grouped;
  }, [lifecycleEvents]);

  const activeMatches = useMemo(
    () =>
      matches
        .filter((match) => !match.dismissed)
        .sort((a, b) => {
          if (sortKey === "opportunity") {
            return b.opportunityScore - a.opportunityScore;
          }

          if (sortKey === "confidence") {
            return b.confidenceScore - a.confidenceScore;
          }

          return (
            SIGNAL_RANK[a.entrySignal] - SIGNAL_RANK[b.entrySignal] ||
            b.opportunityScore - a.opportunityScore
          );
        }),
    [matches, sortKey],
  );

  const visibleMatches = useMemo(
    () => activeMatches.filter((match) => matchesFilter(match, filterKey)),
    [activeMatches, filterKey],
  );

  const dismissedMatches = useMemo(
    () =>
      matches
        .filter((match) => match.dismissed)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [matches],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<MatchStatus, number> = {
      open: 0,
      contacted: 0,
      deal: 0,
      closed: 0,
    };

    for (const match of activeMatches) {
      counts[match.status] += 1;
    }

    return counts;
  }, [activeMatches]);

  const averageOpportunity = useMemo(
    () =>
      activeMatches.length > 0
        ? activeMatches.reduce((sum, match) => sum + match.opportunityScore, 0) /
          activeMatches.length
        : 0,
    [activeMatches],
  );

  const outcomeMatches = useMemo(
    () => activeMatches.filter((match) => match.status === "deal" || match.status === "closed"),
    [activeMatches],
  );

  const dealRate = useMemo(() => {
    const trackable = activeMatches.filter(
      (match) => match.status !== "open" && match.status !== "contacted",
    ).length;

    return trackable > 0 ? (outcomeMatches.length / trackable) * 100 : 0;
  }, [activeMatches, outcomeMatches]);

  const averageDealOpportunity = useMemo(
    () =>
      outcomeMatches.length > 0
        ? outcomeMatches.reduce((sum, match) => sum + match.opportunityScore, 0) /
          outcomeMatches.length
        : 0,
    [outcomeMatches],
  );

  const medianDeal = useMemo(() => {
    const eventSets = activeMatches
      .map((match) => eventsByMatch.get(match.id as number) ?? [])
      .filter((events) => events.length > 0);

    return medianDealDays(eventSets);
  }, [activeMatches, eventsByMatch]);

  const dismissedCount = dismissedMatches.length;

  const followUpCount = useMemo(
    () =>
      activeMatches.filter((match) =>
        adviceForMatch(
          match,
          eventsByMatch.get(match.id as number) ?? [],
        ).some((item) => item.priority === "now"),
      ).length,
    [activeMatches, eventsByMatch],
  );

  const pruneBelowOpportunity = async () => {
    const threshold = Number(pruneThreshold);

    if (!Number.isFinite(threshold) || threshold <= 0) {
      return;
    }

    const candidates = activeMatches.filter(
      (match) => match.opportunityScore < threshold,
    );

    if (candidates.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Dismiss ${candidates.length} active match${candidates.length === 1 ? "" : "es"} with opportunity below ${threshold}?`,
    );

    if (!confirmed) {
      return;
    }

    const now = new Date().toISOString();

    await Promise.all(
      candidates.map((match) =>
        db.matches.update(match.id as number, { dismissed: true, updatedAt: now }),
      ),
    );
  };

  return (
    <div className="matches-panel">
      <div className="surface-header">
        <p className="section-subnote">
          Strong signals land here automatically. Track each: open → contacted → deal → closed.
        </p>
        <span className="surface-count">
          {visibleMatches.length} shown
          {activeMatches.length !== visibleMatches.length
            ? ` of ${activeMatches.length} active`
            : ` active mat${activeMatches.length === 1 ? "ch" : "ches"}`}
          {dismissedCount > 0 ? ` · ${dismissedCount} dismissed` : ""}
        </span>
      </div>

      <div className="filter-chips" role="group" aria-label="Filter matches by status">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`filter-chip${filterKey === option.id ? " is-active" : ""}`}
            onClick={() => setFilterKey(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="matches-stats">
        {STATUS_ORDER.map((status) => (
          <span key={status}>
            <strong>{statusCounts[status]}</strong> {STATUS_LABELS[status].toLowerCase()}
          </span>
        ))}
        <span>
          avg opportunity <strong>{averageOpportunity.toFixed(0)}</strong>
        </span>
        {followUpCount > 0 && (
          <span className="follow-up-count">
            <strong>{followUpCount}</strong> need follow-up
          </span>
        )}
      </p>

      {activeMatches.length > 0 && (
        <details className="advisor-block" open>
          <summary>Advisor — what to do next</summary>
          <ol className="advisor-list">
            {activeMatches
              .flatMap((match) =>
                adviceForMatch(match, eventsByMatch.get(match.id as number) ?? []).map((item) => ({
                  ...item,
                  product: match.productName,
                  location: match.locationName,
                })),
              )
              .sort((a, b) => {
                const rank = (priority: string) =>
                  priority === "now" ? 0 : priority === "soon" ? 1 : 2;

                return rank(a.priority) - rank(b.priority);
              })
              .map((item, index) => (
                <li
                  key={index}
                  className={`advisor-item${item.priority === "now" ? " advisor-now" : item.priority === "soon" ? " advisor-soon" : ""}`}
                >
                  <strong>{item.product}</strong> · {item.location} — {item.text}
                </li>
              ))}
          </ol>
        </details>
      )}

      {outcomeMatches.length > 0 && (
        <p className="matches-outcome-analytics">
          <span>
            deal rate <strong>{dealRate.toFixed(0)}%</strong>
          </span>
          <span>
            avg O (deals) <strong>{averageDealOpportunity.toFixed(0)}</strong>
          </span>
          {medianDeal !== null && (
            <span>
              median time to deal <strong>{medianDeal.toFixed(1)} d</strong>
            </span>
          )}
          <span className="muted">
            among {activeMatches.filter((match) => match.status !== "open" && match.status !== "contacted").length}{" "}
            tracked out of {activeMatches.length} active
          </span>
        </p>
      )}

      {visibleMatches.length === 0 && (
        <div className="empty-state">
          <h3>
            {activeMatches.length > 0
              ? `No matches in this filter.`
              : "No active matches yet."}
          </h3>
          <p>
            {activeMatches.length > 0
              ? "Try a different filter."
              : "Score a cell with 3+ real records until its signal is strong or promising."}
          </p>
        </div>
      )}

      {activeMatches.length > 0 && (
        <>
          <div className="match-controls">
            <div className="sort-row" role="group" aria-label="Sort matches">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`sort-button${sortKey === option.id ? " is-active" : ""}`}
                  onClick={() => setSortKey(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="prune-row">
              <label className="prune-label" htmlFor="prune-threshold">
                Dismiss matches below O:
              </label>
              <input
                id="prune-threshold"
                type="number"
                min="1"
                max="99"
                value={pruneThreshold}
                onChange={(event) => setPruneThreshold(event.target.value)}
              />
              <button
                type="button"
                className="status-button is-danger"
                onClick={() => void pruneBelowOpportunity()}
              >
                Dismiss below
              </button>
            </div>
          </div>

          <ol className="cell-list">
            {visibleMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                events={eventsByMatch.get(match.id as number) ?? []}
                lastSeenAt={lastSeenAt}
              />
            ))}
          </ol>

          {dismissedMatches.length > 0 && (
            <details className="dismissed-section" open={showDismissed}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setShowDismissed((value) => !value);
                }}
              >
                {dismissedMatches.length} dismissed match
                {dismissedMatches.length === 1 ? "" : "es"}
              </summary>
              {showDismissed && (
                <ol className="cell-list dismissed-list">
                  {dismissedMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      events={eventsByMatch.get(match.id as number) ?? []}
                      lastSeenAt={lastSeenAt}
                    />
                  ))}
                </ol>
              )}
            </details>
          )}
        </>
      )}
    </div>
  );
}