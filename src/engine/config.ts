import { COMPONENT_WEIGHTS, OPPORTUNITY_HIGH, CONFIDENCE_HIGH } from "./types";
import type { ComponentKey } from "./types";

export interface ScoringConfig {
  weights: Record<ComponentKey, number>;
  opportunityHigh: number;
  confidenceHigh: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: { ...COMPONENT_WEIGHTS },
  opportunityHigh: OPPORTUNITY_HIGH,
  confidenceHigh: CONFIDENCE_HIGH,
};

const VALID_KEYS: ComponentKey[] = ["ssd", "price", "access", "seasonal", "competition"];

export function normalizeWeights(
  weights: Record<ComponentKey, number>,
): Record<ComponentKey, number> {
  let sum = 0;

  for (const key of VALID_KEYS) {
    sum += Math.max(0, weights[key] ?? 0);
  }

  if (!Number.isFinite(sum) || sum <= 0) {
    return { ...COMPONENT_WEIGHTS };
  }

  const normalized: Record<ComponentKey, number> = { ...weights };

  for (const key of VALID_KEYS) {
    normalized[key] = sum > 0 ? Math.max(0, weights[key] ?? 0) / sum : 0;
  }

  return normalized;
}

export function isDefaultConfig(config: ScoringConfig): boolean {
  const weights = normalizeWeights(config.weights);

  return (
    Math.abs(weights.ssd - COMPONENT_WEIGHTS.ssd) < 1e-9 &&
    Math.abs(weights.price - COMPONENT_WEIGHTS.price) < 1e-9 &&
    Math.abs(weights.access - COMPONENT_WEIGHTS.access) < 1e-9 &&
    Math.abs(weights.seasonal - COMPONENT_WEIGHTS.seasonal) < 1e-9 &&
    Math.abs(weights.competition - COMPONENT_WEIGHTS.competition) < 1e-9 &&
    config.opportunityHigh === OPPORTUNITY_HIGH &&
    config.confidenceHigh === CONFIDENCE_HIGH
  );
}

export function sanitizeConfig(value: unknown): ScoringConfig {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_SCORING_CONFIG };
  }

  const candidate = value as Partial<ScoringConfig>;
  const weights = candidate.weights;

  const rawWeights: Record<ComponentKey, number> = { ...COMPONENT_WEIGHTS };

  if (typeof weights === "object" && weights !== null) {
    for (const key of VALID_KEYS) {
      const raw = (weights as Partial<Record<ComponentKey, unknown>>)[key];

      if (raw === null) {
        rawWeights[key] = 0;
      } else if (typeof raw === "number" && Number.isFinite(raw)) {
        rawWeights[key] = Math.max(0, raw);
      }
    }
  }

  const opportunityHigh =
    typeof candidate.opportunityHigh === "number" &&
    Number.isFinite(candidate.opportunityHigh) &&
    candidate.opportunityHigh > 0
      ? candidate.opportunityHigh
      : OPPORTUNITY_HIGH;

  const confidenceHigh =
    typeof candidate.confidenceHigh === "number" &&
    Number.isFinite(candidate.confidenceHigh) &&
    candidate.confidenceHigh > 0
      ? candidate.confidenceHigh
      : CONFIDENCE_HIGH;

  return {
    weights: normalizeWeights(rawWeights),
    opportunityHigh,
    confidenceHigh,
  };
}