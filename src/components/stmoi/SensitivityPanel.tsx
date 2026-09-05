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

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <label className="sensitivity-row">
      <span className="sensitivity-label">
        {label}
        <strong>{value}</strong>
      </span>
      <span className="slider-wrap">
        <span className="slider-bubble" style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}>
          {value}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{
            background: `linear-gradient(to right, var(--accent) ${pct}%, var(--paper-2) ${pct}%)`,
          }}
        />
      </span>
    </label>
  );
}

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
      <div className="sensitivity-summary">
        <div>
          <span className="eyebrow">What-if view</span>
          <h3>Scoring sensitivity</h3>
          <p className="section-subnote">
            Headline rule today: strong entry needs O ≥ {config.opportunityHigh} and C ≥{" "}
            {config.confidenceHigh}. Any deviation from the published methodology is a{" "}
            <em>what-if</em> view — it changes how <strong>this browser</strong> weights evidence
            and recomputes the surface immediately. Records are never modified.
          </p>
        </div>
        <span className={`signal-chip${active ? " is-promising" : " is-strong-entry"}`}>
          {active ? "Custom config" : "Methodology defaults"}
        </span>
      </div>

      {active && (
        <p className="workspace-note is-warning">
          Custom configuration active — scores no longer match the methodology defaults.
        </p>
      )}

      <details className="sensitivity-group" open={active}>
        <summary>Component weights (renormalized to 100%)</summary>
        {WEIGHT_ORDER.map((key) => (
          <Slider
            key={key}
            label={WEIGHT_LABELS[key]}
            value={Math.round(weights[key] * 100)}
            min={0}
            max={100}
            onChange={(value) => setWeight(key, value / 100)}
          />
        ))}
        <p className="muted sensitivity-total">
          Raw weights total {Math.round(weightTotal > 0 ? weightTotal * 100 : 0)}% before
          normalization.
        </p>
      </details>

      <details className="sensitivity-group" open={active}>
        <summary>Entry-signal thresholds</summary>
        <Slider
          label="Opportunity score line (O)"
          value={config.opportunityHigh}
          min={40}
          max={90}
          onChange={(value) => setThreshold("opportunityHigh", value)}
        />
        <Slider
          label="Confidence score line (C)"
          value={config.confidenceHigh}
          min={30}
          max={80}
          onChange={(value) => setThreshold("confidenceHigh", value)}
        />
      </details>

      <div className="dataset-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onConfigChange({ ...DEFAULT_SCORING_CONFIG })}
        >
          Restore methodology defaults
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={onReset}>
          Reset everything in this tab
        </button>
      </div>
    </div>
  );
}