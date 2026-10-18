import { useEffect, useState } from "react";

import { SIGNAL_DESCRIPTIONS, SIGNAL_LABELS, type EntrySignal } from "../engine/types";
import { HELP_EVENT } from "../lib/journey";
import { AppIcon } from "./AppIcon";

const STEPS = [
  {
    title: "Add what you know",
    body: "Log produce you have for sale, produce you need, or a price you saw at a market. It takes under a minute.",
  },
  {
    title: "We compare it with nearby markets",
    body: "Sarateal checks supply, demand, prices, distance and weather for each product in each place.",
  },
  {
    title: "See where to sell or buy",
    body: "Every place gets two scores. Good opportunities are saved to My deals so you can follow up.",
  },
];

const SIGNALS: EntrySignal[] = ["strong-entry", "promising", "avoid", "insufficient-data"];

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);

    window.addEventListener(HELP_EVENT, onOpen);

    return () => window.removeEventListener(HELP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="help-layer" role="presentation">
      <button type="button" className="help-backdrop" aria-label="Close help" onClick={() => setOpen(false)} />
      <div className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="help-head">
          <h2 id="help-title">How Sarateal works</h2>
          <button type="button" className="icon-button" aria-label="Close help" onClick={() => setOpen(false)}>
            <AppIcon name="x" />
          </button>
        </div>

        <ol className="help-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="help-step-num">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h3>The two scores</h3>
        <dl className="help-terms">
          <div>
            <dt>Opportunity (0–100)</dt>
            <dd>How attractive a place looks for a product. High means buyers need more than is on offer, or prices are good.</dd>
          </div>
          <div>
            <dt>Confidence (0–100)</dt>
            <dd>How sure we are. It goes up as more people log recent records for that product and place. Three or more records make a score reliable.</dd>
          </div>
        </dl>

        <h3>What the labels mean</h3>
        <ul className="help-signals">
          {SIGNALS.map((signal) => (
            <li key={signal}>
              <span className={`signal-chip is-${signal}`}>{SIGNAL_LABELS[signal]}</span>
              <span>{SIGNAL_DESCRIPTIONS[signal]}</span>
            </li>
          ))}
        </ul>

        <p className="help-privacy">
          <AppIcon name="info" size={16} />
          No account needed. Your records stay in this browser unless you export them.
        </p>

        <div className="help-actions">
          <a className="btn btn-secondary" href="/about" onClick={() => setOpen(false)}>
            Read the full method
          </a>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
