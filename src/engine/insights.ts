import type { EntrySignalRef, MatchStatus } from "../lib/db";
import type { OpportunityCell } from "./types";

export interface TopOpportunity {
  rank: number;
  cell: OpportunityCell;
}

export interface CountyInsight {
  county: string;
  actionable: number;
  entryUnits: number;
  avgOpportunity: number;
}

export function topOpportunities(
  cells: OpportunityCell[],
  limit = 5,
): TopOpportunity[] {
  return cells
    .filter((cell) => cell.opportunity !== null)
    .sort((a, b) => {
      const rankA = signalRank(a.entrySignal);
      const rankB = signalRank(b.entrySignal);

      return rankA - rankB || (b.opportunity ?? 0) - (a.opportunity ?? 0);
    })
    .slice(0, limit)
    .map((cell, index) => ({ rank: index + 1, cell }));
}

function signalRank(signal: EntrySignalRef): number {
  if (signal === "strong-entry") {
    return 0;
  }

  if (signal === "promising") {
    return 1;
  }

  return 2;
}

export function countyLeaderboard(cells: OpportunityCell[]): CountyInsight[] {
  const byCounty = new Map<string, { actionable: number; entryUnits: number; opportunitySum: number }>();

  for (const cell of cells) {
    if (cell.opportunity === null) {
      continue;
    }

    const actionable = cell.entrySignal === "strong-entry" || cell.entrySignal === "promising";
    const entryUnits =
      (cell.demandUnits ?? 0) + (cell.supplyUnits ?? 0);

    const current = byCounty.get(cell.county) ?? {
      actionable: 0,
      entryUnits: 0,
      opportunitySum: 0,
    };

    if (actionable) {
      current.actionable += 1;
    }

    current.entryUnits += entryUnits;
    current.opportunitySum += cell.opportunity;
    byCounty.set(cell.county, current);
  }

  return [...byCounty.entries()]
    .map(([county, aggregate]) => ({
      county,
      actionable: aggregate.actionable,
      entryUnits: aggregate.entryUnits,
      avgOpportunity:
        aggregate.actionable > 0 ? aggregate.opportunitySum / aggregate.actionable : 0,
    }))
    .sort((a, b) => b.actionable - a.actionable || b.avgOpportunity - a.avgOpportunity);
}

export interface PipelineFunnel {
  open: number;
  contacted: number;
  deal: number;
  closed: number;
}

export function pipelineFunnel(matches: Array<{ status: MatchStatus }>): PipelineFunnel {
  const funnel: PipelineFunnel = { open: 0, contacted: 0, deal: 0, closed: 0 };

  for (const match of matches) {
    if (match.status in funnel) {
      funnel[match.status as keyof PipelineFunnel] += 1;
    }
  }

  return funnel;
}

export function surfaceCoverage(cells: OpportunityCell[]): {
  scored: number;
  actionable: number;
  insufficient: number;
} {
  let scored = 0;
  let actionable = 0;
  let insufficient = 0;

  for (const cell of cells) {
    if (cell.opportunity !== null) {
      scored += 1;

      if (cell.entrySignal === "strong-entry" || cell.entrySignal === "promising") {
        actionable += 1;
      } else if (cell.entrySignal === "avoid") {
        insufficient += 1;
      }
    }
  }

  return { scored, actionable, insufficient };
}