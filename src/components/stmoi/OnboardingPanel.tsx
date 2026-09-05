import { useEffect, useMemo, useState } from "react";

import { db, setOnboardingDone, type UserRole } from "../../lib/db";
import type { County, Market, Product } from "../../types/api";
import type { Tab } from "./STMOIWorkspace";

interface OnboardingPanelProps {
  role: UserRole;
  counties: County[];
  products: Product[];
  markets: Market[];
  referenceReady: boolean;
  onComplete: (tab: Tab) => void;
}

type Step = "setup" | "record" | "aha";

export function OnboardingPanel({
  role,
  counties,
  products,
  markets,
  referenceReady,
  onComplete,
}: OnboardingPanelProps) {
  const [step, setStep] = useState<Step>("setup");
  const [countyName, setCountyName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const selectedProduct = useMemo(
    () => products.find((product) => String(product.id) === productId),
    [products, productId],
  );

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (mounted) {
        setUnit(selectedProduct?.unit ?? "");
      }
    });

    return () => {
      mounted = false;
    };
  }, [selectedProduct]);

  const countyMarkets = useMemo(
    () => (countyName ? markets.filter((market) => market.county === countyName).slice(0, 6) : []),
    [countyName, markets],
  );

  const isObserver = role === "observer";
  const roleLabel = role === "farmer" ? "supply" : role === "buyer" ? "demand" : null;
  const canContinue = referenceReady && countyName !== "" && productId !== "";

  const saveFirstRecord = async () => {
    if (isObserver || selectedProduct === undefined || roleLabel === null) {
      return;
    }

    const shared = {
      contributor: "self",
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unit: unit || selectedProduct.unit,
      county: countyName,
      createdAt: new Date().toISOString(),
    };

    if (roleLabel === "supply") {
      await db.supplies.add({
        ...shared,
        quantity: Number(quantity) || 0,
        availableFrom: new Date().toISOString().slice(0, 10),
      });
      return;
    }

    await db.demands.add({
      ...shared,
      quantity: Number(quantity) || 0,
      neededFrom: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="onboarding-panel">
      <div
        className="onboarding-progress"
        role="progressbar"
        aria-valuenow={step === "setup" ? 1 : step === "record" ? 2 : 3}
        aria-valuemin={1}
        aria-valuemax={3}
      >
        <span className={step === "setup" ? "is-active" : ""}>1 · Pick a market</span>
        <span className={step === "record" ? "is-active" : ""}>
          {isObserver ? "2 · Set your view" : "2 · Log your first record"}
        </span>
        <span className={step === "aha" ? "is-active" : ""}>3 · See your first score</span>
      </div>

      {step === "setup" && (
        <div className="onboarding-step">
          <h3>{isObserver ? "Which market data do you want to watch?" : "Where are you producing or sourcing?"}</h3>
          <p className="section-subnote">
            {roleLabel
              ? `Pick your county and the product you ${roleLabel === "supply" ? "have to sell" : "need to source"}. You'll log one real record to start.`
              : "Pick a county and a product. You'll be able to watch real scores with no records required."}
          </p>

          <div className="form-row">
            <label className="form-field">
              <span>County</span>
              <select value={countyName} onChange={(event) => setCountyName(event.target.value)}>
                <option value="">Choose a county…</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.name}>
                    {county.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Product</span>
              <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                <option value="">Choose a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.unit})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {countyName !== "" && (
            <p className="muted onboarding-hint">
              {countyMarkets.length > 0
                ? `Markets we know in ${countyName}: ${countyMarkets.map((market) => market.name).join(", ")}.`
                : `Found ${countyName} in the reference registry.`}
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={!canContinue}
            onClick={() => setStep(isObserver ? "aha" : "record")}
          >
            {isObserver ? "Continue" : "Next - log my record"}
          </button>
        </div>
      )}

      {step === "record" && (
        <div className="onboarding-step">
          <h3>Log your first real {roleLabel} record</h3>
          <p className="section-subnote">
            Real records only. The first record places your county/product on the map and starts the
            engine toward a score.
          </p>

          <div className="form-row">
            <label className="form-field">
              <span>{roleLabel === "supply" ? "Quantity available" : "Quantity needed"}</span>
              <input
                type="number"
                min="0"
                value={quantity}
                placeholder="e.g. 250"
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
            <button type="button" className="btn btn-secondary" onClick={() => setStep("setup")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                await saveFirstRecord();
                setStep("aha");
              }}
            >
              Save and see my score
            </button>
          </div>
        </div>
      )}

      {step === "aha" && (
        <div className="onboarding-step">
          <div className="aha-heading">
            <span className="start-here-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <div>
              <h3>{isObserver ? "You're set - watch the surface." : "Your first record is in."}</h3>
              <p className="section-subnote">
                {isObserver
                  ? "No records needed. Scores appear here as real records land in the counties you're watching."
                  : "It's on the map now. Add two more real records in the same market-product cell and the opportunity score will wake up with confidence."}
              </p>
            </div>
          </div>

          <div className="aha-signal">
            <span className="signal-chip is-insufficient-data">O · awaiting evidence</span>
            <span className="signal-chip is-insufficient-data">C · 0 (needs 3+ records)</span>
          </div>

          <p className="muted">
            {roleLabel
              ? `1 ${roleLabel} record in ${countyName} · ${selectedProduct?.name ?? "product"}. The surface starts scoring once the cell has three real records.`
              : "Follow what happens as records arrive."}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              await setOnboardingDone(true);
              onComplete(isObserver ? "insights" : "surface");
            }}
          >
            {isObserver ? "Explore the surface" : "Show me the opportunity engine"}
          </button>
        </div>
      )}
    </div>
  );
}
