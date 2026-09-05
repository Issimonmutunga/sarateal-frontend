import type { MatchRecord, MatchStatus } from "../lib/db";

export interface MatchAdvice {
  priority: "now" | "soon" | "info";
  text: string;
}

const DAY_MS = 86_400_000;

function daysBetween(fromIso: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(fromIso)) / DAY_MS));
}

export function isMatchActionable(match: MatchRecord): boolean {
  if (match.dismissed) {
    return false;
  }

  return match.entrySignal === "strong-entry" || match.entrySignal === "promising";
}

export function adviceForMatch(
  match: MatchRecord,
  events: Array<{ status: MatchStatus; at: string }> = [],
  now: Date = new Date(),
): MatchAdvice[] {
  if (!isMatchActionable(match)) {
    return [];
  }

  const advice: MatchAdvice[] = [];
  const ageDays = daysBetween(match.createdAt, now);
  const hasContact = events.some((event) => event.status === "contacted");
  const lastActivityIso = events.reduce<string | null>(
    (latest, event) => (event.at > (latest ?? "") ? event.at : latest),
    null,
  );
  const lastActivityDays = lastActivityIso ? daysBetween(lastActivityIso, now) : ageDays;

  if (match.status === "open") {
    if (ageDays >= 7 && !hasContact) {
      advice.push({
        priority: "now",
        text: `Opened ${ageDays} days ago with no contact attempt — follow up now or dismiss it.`,
      });
    } else if (ageDays >= 3 && !hasContact) {
      advice.push({
        priority: "soon",
        text: `Opened ${ageDays} days ago — log a contact attempt or dismiss it.`,
      });
    }
  }

  if (match.status === "contacted") {
    if (lastActivityDays >= 14) {
      advice.push({
        priority: "now",
        text: `No resolution in ${lastActivityDays} days of contact — re-engage or close the match.`,
      });
    } else if (lastActivityDays >= 7) {
      advice.push({
        priority: "soon",
        text: `Contact pending ${lastActivityDays} days — re-engage or close it.`,
      });
    }
  }

  if (
    (match.status === "open" || match.status === "contacted") &&
    match.entrySignal === "promising" &&
    match.confidenceScore < 50
  ) {
    advice.push({
      priority: "info",
      text: "High opportunity with thin evidence — log extra supply, demand, or price points in this cell before committing.",
    });
  }

  if (match.status === "deal") {
    advice.push({
      priority: "info",
      text: "Deal agreed — record the outcome notes, then close once delivery completes.",
    });
  }

  return advice.sort(
    (a, b) => ({ now: 0, soon: 1, info: 2 }[a.priority] - { now: 0, soon: 1, info: 2 }[b.priority]),
  );
}