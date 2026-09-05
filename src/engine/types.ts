import type { DemandRecord, PriceRecord, SupplyRecord } from "../lib/db";
import type { ScoringConfig } from "./config";

export type ComponentKey = "ssd" | "price" | "access" | "seasonal" | "competition";

export type EntrySignal = "strong-entry" | "promising" | "avoid" | "insufficient-data";

export interface ComponentScore {
  key: ComponentKey;
  value: number | null;
  confidence: number;
  weight: number;
  observations: number;
  note: string;
}

export interface OpportunityCell {
  key: string;
  productId: number;
  productName: string;
  productUnit: string;
  category: string;
  locationName: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  supplyUnits: number;
  demandUnits: number;
  pricePoints: number;
  supplyEntries: number;
  demandEntries: number;
  priceEntries: number;
  components: Record<ComponentKey, ComponentScore>;
  opportunity: number | null;
  confidence: number;
  entrySignal: EntrySignal;
  records: {
    supply: SupplyRecord[];
    demand: DemandRecord[];
    prices: PriceRecord[];
  };
}

export interface CellInput {
  supply: SupplyRecord[];
  demand: DemandRecord[];
  prices: PriceRecord[];
}

export const COMPONENT_WEIGHTS: Record<ComponentKey, number> = {
  ssd: 0.3,
  price: 0.3,
  access: 0.15,
  seasonal: 0.15,
  competition: 0.1,
};

export const OPPORTUNITY_HIGH = 60;
export const CONFIDENCE_HIGH = 50;

export const MIN_COMPONENT_PRESENCE_CONFIDENCE = 0.05;

export const SIGNAL_LABELS: Record<EntrySignal, string> = {
  "strong-entry": "Strong entry",
  promising: "Promising — investigate",
  avoid: "Avoid — confirmed weak",
  "insufficient-data": "Insufficient data",
};

export const SIGNAL_DESCRIPTIONS: Record<EntrySignal, string> = {
  "strong-entry": "High opportunity with solid evidence across components.",
  promising: "High opportunity but evidence is still thin. Verify before acting.",
  avoid: "Evidence is solid but the opportunity is confirmed weak.",
  "insufficient-data": "Not enough real records yet. Log more supply, demand, or price points.",
};

export function entrySignalFor(
  opportunity: number,
  confidence: number,
  config?: Pick<ScoringConfig, "opportunityHigh" | "confidenceHigh">,
): EntrySignal {
  const opportunityHigh = config?.opportunityHigh ?? OPPORTUNITY_HIGH;
  const confidenceHigh = config?.confidenceHigh ?? CONFIDENCE_HIGH;

  if (opportunity >= opportunityHigh && confidence >= confidenceHigh) {
    return "strong-entry";
  }

  if (opportunity >= opportunityHigh) {
    return "promising";
  }

  if (confidence >= confidenceHigh) {
    return "avoid";
  }

  return "insufficient-data";
}