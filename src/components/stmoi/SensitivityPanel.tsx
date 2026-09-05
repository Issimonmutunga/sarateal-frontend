import { DEFAULT_SCORING_CONFIG, isDefaultConfig, normalizeWeights } from "../../engine/config";
import type { ScoringConfig } from "../../engine/config";
import type { ComponentKey } from "../../engine/types";

interface SensitivityPanelProps {
  config: ScoringConfig;
  onConfigChange: (config: ScoringConfig) => void;
  onReset: () => void;
}

const WEIGHT_LABELS: Record<ComponentKey, string> = {
  ssd: "Supply–demand balance",
  price: "Price trend & level",
  access: "Spatial access",
  seasonal: "Seasonal & weather",
  competition: "Competition",
};

const WEIGHT_ORDER: ComponentKey[] = ["ssd", "price", "access", "seasonal", "competition"];

export function SensitivityPanel({ config, onConfigChange, onReset }: SensitivityPanelProps) {
  const weights = normalizeWeights(config.weights);
  const weightTotal = WEIGHT_ORDER.reduce((sum, key) => sum + weights[key], 0);
  const active = !isDefaultConfig(config);

  const setWeight = (key: ComponentKey, raw: number) => {
    onConfigChange({
      ...config,
      weights: { ...config.weights, [key]: Math.max(0, Math.min(1, raw)) },
    });
  };

  const setThreshold = (key: "opportunityHigh" | "confidenceHigh", value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="sensitivity-panel">
      <div className="section-heading">
        <h3>Scoring sensitivity</h3>
        <p className="section-subnote">
          The default sliders reproduce the published STMOI methodology exactly. Any deviation is a{" "}
          <em>what-if</em> view — it changes how <strong>this browser</strong> weights evidence and
          where the entry-signal lines sit, and recomputes the surface immediately. Records are
          never modified; only their interpretation is.
        </p>
        {active && (
          <p className="workspace-note is-warning">
            Custom configuration active — scores no longer match the methodology defaults.
          </p>
        )}
      </div>

      <div className="sensitivity-group">
        <h4>Component weights (renormalized to 100%)</h4>
        {WEIGHT_ORDER.map((key) => (
          <label className="sensitivity-row" key={key}>
            <span className="sensitivity-label">
              {WEIGHT_LABELS[key]}
              <strong>{Math.round(weights[key] * 100)}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(weights[key] * 100)}
              onChange={(event) => setWeight(key, Number(event.target.value) / 100)}
            />
          </label>
        ))}
        <p className="muted sensitivity-total">
          Raw weights total {Math.round((weightTotal > 0 ? weightTotal * 100 : 0))}% before
          normalization.
        </p>
      </div>

      <div className="sensitivity-group">
        <h4>Entry-signal thresholds</h4>
        <label className="sensitivity-row">
          <span className="sensitivity-label">
            Opportunity score line (O)
            <strong>{config.opportunityHigh}</strong>
          </span>
          <input
            type="range"
            min="40"
            max="90"
            value={config.opportunityHigh}
            onChange={(event) => setThreshold("opportunityHigh", Number(event.target.value))}
          />
        </label>
        <label className="sensitivity-row">
          <span className="sensitivity-label">
            Confidence score line (C)
            <strong>{config.confidenceHigh}</strong>
          </span>
          <input
            type="range"
            min="30"
            max="80"
            value={config.confidenceHigh}
            onChange={(event) => setThreshold("confidenceHigh", Number(event.target.value))}
          />
        </label>
      </div>

      <div className="dataset-actions">
        <button
          type="button"
          className="status-button"
          onClick={() => onConfigChange({ ...DEFAULT_SCORING_CONFIG })}
        >
          Restore methodology defaults
        </button>
        <button type="button" className="status-button is-danger" onClick={onReset}>
          Reset everything in this tab
        </button>
      </div>
    </div>
  );
}