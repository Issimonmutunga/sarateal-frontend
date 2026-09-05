import type { ComponentKey, OpportunityCell } from "./types";

export interface CellEvidenceGap {
  component: ComponentKey;
  current: number;
  needed: number;
  blocking: boolean;
  text: string;
}

export interface SurfaceCoverage {
  cells: number;
  scored: number;
  unblocked: number;
  totalGaps: number;
}

export const MIN_EVIDENCE_POINTS = 3;

function gap(
  component: ComponentKey,
  current: number,
  needed: number,
  text: string,
): CellEvidenceGap {
  return {
    component,
    current,
    needed,
    blocking: current < needed,
    text,
  };
}

export function evidenceGapsForCell(cell: OpportunityCell): CellEvidenceGap[] {
  const gaps: CellEvidenceGap[] = [];

  const entries = cell.supplyEntries + cell.demandEntries;

  if (entries < MIN_EVIDENCE_POINTS) {
    gaps.push(
      gap(
        "ssd",
        entries,
        MIN_EVIDENCE_POINTS,
        entries === 0
          ? "No supply or demand logged for this cell yet."
          : `Log ${MIN_EVIDENCE_POINTS - entries} more supply or demand record${
              MIN_EVIDENCE_POINTS - entries === 1 ? "" : "s"
            }.`,
      ),
    );
  } else if (cell.supplyEntries === 0 || cell.demandEntries === 0) {
    gaps.push({
      component: "ssd",
      current: Math.min(cell.supplyEntries, cell.demandEntries),
      needed: 1,
      blocking: false,
      text: `${cell.supplyEntries === 0 ? "Supply" : "Demand"} side has no records at all.`,
    });
  }

  if (cell.priceEntries < MIN_EVIDENCE_POINTS) {
    gaps.push(
      gap(
        "price",
        cell.priceEntries,
        MIN_EVIDENCE_POINTS,
        cell.priceEntries === 0
          ? "No price records."
          : `Log ${MIN_EVIDENCE_POINTS - cell.priceEntries} more price point${
              MIN_EVIDENCE_POINTS - cell.priceEntries === 1 ? "" : "s"
            }.`,
      ),
    );
  }

  const accessScored = cell.components.access.value !== null;

  if (cell.latitude === null || cell.longitude === null) {
    gaps.push(
      gap("access", 0, 1, "Location coordinates unresolved — log the market name or fix the geocode."),
    );
  } else if (!accessScored) {
    gaps.push(
      gap(
        "access",
        0,
        1,
        "No neighbouring coordinate-bearing locations to measure market reach against.",
      ),
    );
  }

  if (cell.components.seasonal.observations < MIN_EVIDENCE_POINTS) {
    gaps.push(
      gap(
        "seasonal",
        cell.components.seasonal.observations,
        MIN_EVIDENCE_POINTS,
        cell.components.seasonal.observations === 0
          ? "No seasonal history or weather signal — weather needs resolved coordinates."
          : "Add more dated records, or refresh the weather signal, to build seasonal history.",
      ),
    );
  }

  if (cell.components.competition.observations < 1) {
    gaps.push(
      gap(
        "competition",
        cell.components.competition.observations,
        1,
        "No supplier competitors within reach are on record.",
      ),
    );
  }

  return gaps;
}

export function surfaceCoverage(cells: OpportunityCell[]): SurfaceCoverage {
  let scored = 0;
  let unblocked = 0;
  let totalGaps = 0;

  for (const cell of cells) {
    const cellGaps = evidenceGapsForCell(cell);

    if (cell.opportunity !== null) {
      scored += 1;
    }

    if (cellGaps.every((item) => !item.blocking)) {
      unblocked += 1;
    }

    totalGaps += cellGaps.length;
  }

  return { cells: cells.length, scored, unblocked, totalGaps };
}