import { db, type MatchEventRecord, type MatchStatus } from "../lib/db";
import type { OpportunityCell } from "./types";

const PERSISTED_SIGNALS: OpportunityCell["entrySignal"][] = ["strong-entry", "promising"];

export interface MatchUpsertStats {
  created: number;
  updated: number;
}

export async function persistTopMatches(cells: OpportunityCell[]): Promise<MatchUpsertStats> {
  const candidates = cells.filter(
    (cell) =>
      cell.opportunity !== null && PERSISTED_SIGNALS.includes(cell.entrySignal),
  );

  const stats: MatchUpsertStats = { created: 0, updated: 0 };

  if (candidates.length === 0) {
    return stats;
  }

  await db.transaction("rw", [db.matches, db.matchEvents], async () => {
    const now = new Date().toISOString();

    for (const cell of candidates) {
      const existing = await db.matches.where("cellKey").equals(cell.key).first();

      if (existing) {
        await db.matches.update(existing.id as number, {
          productName: cell.productName,
          productUnit: cell.productUnit,
          locationName: cell.locationName,
          county: cell.county,
          opportunityScore: cell.opportunity as number,
          confidenceScore: cell.confidence,
          entrySignal: cell.entrySignal,
          updatedAt: now,
        });
        stats.updated += 1;
      } else {
        const matchId = await db.matches.add({
          cellKey: cell.key,
          productId: cell.productId,
          productName: cell.productName,
          productUnit: cell.productUnit,
          locationName: cell.locationName,
          county: cell.county,
          opportunityScore: cell.opportunity as number,
          confidenceScore: cell.confidence,
          entrySignal: cell.entrySignal,
          status: "open",
          createdAt: now,
          updatedAt: now,
          outcomeNotes: null,
          dismissed: false,
        });

        await db.matchEvents.add({
          matchId: matchId as number,
          status: "open",
          at: now,
        });
        stats.created += 1;
      }
    }
  });

  return stats;
}

export async function setMatchStatus(matchId: number, status: MatchStatus): Promise<void> {
  await db.transaction("rw", [db.matches, db.matchEvents], async () => {
    const now = new Date().toISOString();

    await db.matches.update(matchId, { status, updatedAt: now });
    await db.matchEvents.add({ matchId, status, at: now });
  });
}

export async function seedMatchEvent(
  matchId: number,
  status: MatchStatus,
  at: string,
): Promise<void> {
  await db.matchEvents.add({ matchId, status, at });
}

export async function eventsForMatch(matchId: number): Promise<MatchEventRecord[]> {
  return db.matchEvents.where("matchId").equals(matchId).toArray();
}