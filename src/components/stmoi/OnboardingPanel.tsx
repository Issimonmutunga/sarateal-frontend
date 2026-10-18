import { useMemo, useState } from "react";

import { db, setOnboardingDone, type UserRole } from "../../lib/db";
import { openHelp, ROLE_COPY, ROLE_ORDER, type Tab } from "../../lib/journey";
import type { County, Market, Product } from "../../types/api";
import { AppIcon } from "../AppIcon";

interface OnboardingPanelProps {
  role: UserRole | null;
  onRoleChange: (role: UserRole) => void;
  counties: County[];
  products: Product[];
  markets: Market[];
  referenceReady: boolean;
  onComplete: (tab: Tab, addKind?: "price") => void;
}

type Step = "role" | "place" | "amount" | "done";

export function OnboardingPanel({
  role,
  onRoleChange,
  counties,
  products,
  markets,
  referenceReady,
  onComplete,
}: OnboardingPanelProps) {
  const [step, setStep] = useState<Step>(role === null ? "role" : "place");
  const [countyName, setCountyName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === productId),
    [products, productId],
  );

  const countyMarkets = useMemo(
    () => (countyName ? markets.filter((market) => market.county === countyName).slice(0, 5) : []),
    [countyName, markets],
  );

  const isObserver = role === "observer";
  const isSeller = role === "farmer";
  const steps: Array<{ id: Step; label: string }> = isObserver
    ? [
        { id: "role", label: "About you" },
        { id: "place", label: "Where" },
        { id: "done", label: "Ready" },
      ]
    : [
        { id: "role", label: "About you" },
        { id: "place", label: "What & where" },
        { id: "amount", label: "How much" },
        { id: "done", label: "Ready" },
      ];
  const stepIndex = Math.max(0, steps.findIndex((entry) => entry.id === step));

  const canContinuePlace = referenceReady && countyName !== "" && (isObserver || productId !== "");
  const quantityValid = Number(quantity) > 0;

  const finish = async (tab: Tab) => {
    await setOnboardingDone(true);
    onComplete(tab);
  };

  const saveFirstRecord = async () => {
    if (isObserver || selectedProduct === undefined || saving) {
      return;
    }

    setSaving(true);

    const shared = {
      contributor: "You",
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unit: unit.trim() || selectedProduct.unit,
      county: countyName,
      marketName: null,
      notes: null,
      quantity: Number(quantity),
      createdAt: new Date().toISOString(),
    };
    const todayIso = new Date().toISOString().slice(0, 10);

    try {
      if (isSeller) {
        await db.supplies.add({ ...shared, availableFrom: todayIso, availableUntil: null });
      } else {
        await db.demands.add({ ...shared, neededFrom: todayIso, neededUntil: null });
      }

      setStep("done");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-panel journey-onboarding">
      <div className="onboarding-top">
        <ol className="journey-steps" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
          {steps.map((entry, index) => (
            <li
              key={entry.id}
              className={index < stepIndex ? "is-done" : index === stepIndex ? "is-active" : undefined}
            >
              <span className="journey-step-dot">{index < stepIndex ? <AppIcon name="check" size={12} /> : index + 1}</span>
              <span className="journey-step-label">{entry.label}</span>
            </li>
          ))}
        </ol>
        {step !== "done" && (
          <button type="button" className="text-button" onClick={() => void finish("overview")}>
            Skip for now
          </button>
        )}
      </div>

      {step === "role" && (
        <div className="onboarding-step">
          <p className="eyebrow">Welcome to Sarateal</p>
          <h2>What brings you here?</h2>
          <p className="section-subnote">
            We'll set things up for you. No sign-up — you can change this any time.
          </p>

          <div className="role-cards">
            {ROLE_ORDER.map((candidate) => (
              <button
                key={candidate}
                type="button"
                className={`role-card${role === candidate ? " is-active" : ""}`}
                onClick={() => {
                  onRoleChange(candidate);
                  setStep("place");
                }}
              >
                <span className="role-card-icon">
                  <AppIcon name={ROLE_COPY[candidate].icon} size={24} />
                </span>
                <strong>{ROLE_COPY[candidate].label}</strong>
                <span>{ROLE_COPY[candidate].body}</span>
              </button>
            ))}
          </div>

          <button type="button" className="text-button help-link" onClick={openHelp}>
            <AppIcon name="help" size={16} /> How does Sarateal work?
          </button>
        </div>
      )}

      {step === "place" && (
        <div className="onboarding-step">
          <h2>
            {isObserver
              ? "Which area are you interested in?"
              : isSeller
                ? "What are you selling, and where?"
                : "What do you need, and where?"}
          </h2>
          <p className="section-subnote">
            {isObserver
              ? "Pick a county to start with. You can look at every county later."
              : "Pick your county and one product. You can add more later."}
          </p>

          {!referenceReady && <p className="workspace-note is-loading">Loading counties and products…</p>}

          <div className="form-row">
            <label className="form-field">
              <span>County</span>
              <select value={countyName} onChange={(event) => setCountyName(event.target.value)} disabled={!referenceReady}>
                <option value="">Choose a county…</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.name}>
                    {county.name}
                  </option>
                ))}
              </select>
            </label>

            {!isObserver && (
              <label className="form-field">
                <span>Product</span>
                <select value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!referenceReady}>
                  <option value="">Choose a product…</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {countyMarkets.length > 0 && (
            <p className="muted onboarding-hint">
              Markets in {countyName}: {countyMarkets.map((market) => market.name).join(", ")}.
            </p>
          )}

          <div className="onboarding-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep("role")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canContinuePlace}
              onClick={() => setStep(isObserver ? "done" : "amount")}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "amount" && (
        <div className="onboarding-step">
          <h2>
            How much {selectedProduct?.name.toLowerCase() ?? "produce"} {isSeller ? "do you have?" : "do you need?"}
          </h2>
          <p className="section-subnote">A rough amount is fine. This becomes your first record.</p>

          <div className="form-row">
            <label className="form-field">
              <span>Amount</span>
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={quantity}
                placeholder="e.g. 250"
                autoFocus
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Unit</span>
              <input
                type="text"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                placeholder={selectedProduct?.unit ?? "kg"}
              />
            </label>
          </div>

          <div className="onboarding-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setStep("place")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!quantityValid || saving}
              onClick={() => void saveFirstRecord()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="onboarding-step">
          <div className="aha-heading">
            <span className="start-here-icon" aria-hidden="true">
              <AppIcon name="check" size={26} />
            </span>
            <div>
              <h2>{isObserver ? "You're all set." : "Your first record is saved."}</h2>
              <p className="section-subnote">
                {isObserver
                  ? `Open the map to see markets and opportunities${countyName ? ` around ${countyName}` : ""}.`
                  : `Scores appear as records for ${selectedProduct?.name ?? "a product"} in ${countyName} add up — 3 or more make them reliable. Adding a price you've seen at a local market is the quickest next step.`}
              </p>
            </div>
          </div>

          {!isObserver && (
            <div className="score-progress" aria-label="Records toward a first score">
              <div className="score-progress-bar">
                <span style={{ width: "33%" }} />
              </div>
              <span>1 of 3 records for a reliable score</span>
            </div>
          )}

          <div className="onboarding-actions">
            {isObserver ? (
              <button type="button" className="btn btn-primary" onClick={() => void finish("opportunity")}>
                Explore opportunities
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => void finish("overview")}>
                  Go to Home
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void setOnboardingDone(true).then(() => onComplete("enter", "price"))}
                >
                  Add a market price
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
