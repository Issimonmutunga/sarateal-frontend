import type { MatchStatus } from "../lib/db";

export interface MatchLifecycleEvent {
  status: MatchStatus;
  at: string;
}

const DAY_MS = 86_400_000;

export function buildTimeline(events: MatchLifecycleEvent[]): MatchLifecycleEvent[] {
  return [...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export function timeToDealDays(events: MatchLifecycleEvent[]): number | null {
  const timeline = buildTimeline(events);

  if (timeline.length === 0) {
    return null;
  }

  const deal = timeline.find((event) => event.status === "deal");

  if (!deal) {
    return null;
  }

  if (timeline[0].status === "deal") {
    return 0;
  }

  const start = timeline.find((event) => event.status === "open") ?? timeline[0];

  return (Date.parse(deal.at) - Date.parse(start.at)) / DAY_MS;
}

export function medianDealDays(eachMatchEvents: MatchLifecycleEvent[][]): number | null {
  const durations = eachMatchEvents
    .map(timeToDealDays)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return null;
  }

  const middle = Math.floor(durations.length / 2);

  if (durations.length % 2 === 1) {
    return durations[middle];
  }

  return (durations[middle - 1] + durations[middle]) / 2;
}