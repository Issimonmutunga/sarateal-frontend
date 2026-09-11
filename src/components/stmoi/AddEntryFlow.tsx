import { useMemo, useState } from "react";

import { computeOpportunitySurface, suitabilityFromWeatherSignals } from "../../engine";
import type { OpportunityCell } from "../../engine/types";
import { db } from "../../lib/db";
import { setFocusLocation } from "../../lib/focus";
import { openAppTab } from "../../lib/hash";
import { getWeatherSignals, resolveLocation } from "../../lib/live";
import type { County, Market, Product } from "../../types/api";

type Kind = "supply" | "demand" | "price";

type Step = "kind" | "product" | "where" | "amount" | "when" | "review" | "saved";

const KIND_OPTIONS: Array<{ id: Kind; title: string; body: string }> = [
  { id: "supply", title: "I have supply", body: "Produce you can sell." },
  { id: "demand", title: "I need produce", body: "Produce you're looking for." },
  { id: "price", title: "Market price", body: "A price you observed." },
];

const STEP_ORDER: Array<{ id: Step; label: string }> = [
  { id: "product", label: "What" },
  { id: "where", label: "Where" },
  { id: "amount", label: "How much" },
  { id: "when", label: "When" },
  { id: "review", label: "Review" },
];

const KIND_VERB: Record<Kind, string> = {
  supply: "Add supply",
  demand: "Add demand",
  price: "Add price",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function iconPaths(id: string): string {
  switch (id) {
    case "supply":
      return '<path d="M2 12h20M12 2v20"/><circle cx="12" cy="12" r="9"/>';
    case "demand":
      return '<path d="M6 7h12l-1 10H7L6 7Z"/><path d="M9 10V8a3 3 0 0 1 6 0v2"/>';
    default:
      return '<path d="M3 3h7l11 11-7 7L3 10V3Z"/><circle cx="7.5" cy="7.5" r="1.5"/>';
  }
}

function Icon({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: iconPaths(id) }}
    />
  );
}

interface AddEntryFlowProps {
  products: Product[];
  counties: County[];
  markets: Market[];
  disabled: boolean;
}

interface SaveResult {
  opportunities: OpportunityCell[];
  best: OpportunityCell | null;
}

export function AddEntryFlow({ products, counties, markets, disabled }: AddEntryFlowProps) {
  const [kind, setKind] = useState<Kind>("supply");
  const [step, setStep] = useState<Step>("kind");
  const [product, setProduct] = useState("");
  const [county, setCounty] = useState("");
  const [market, setMarket] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(today());
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);

  const selectedProduct = products.find((item) => item.name === product);
  const countyMarkets = useMemo(
    () => markets.filter((marketItem) => marketItem.county === county),
    [markets, county],
  );

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const list = needle.length === 0
      ? products
      : products.filter((item) => item.name.toLowerCase().includes(needle));

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  const stepIndex = STEP_ORDER.findIndex((entry) => entry.id === step);
  const currentStepLabel = STEP_ORDER[stepIndex]?.label;

  const productQuestion =
    kind === "price" ? "Which product?" : kind === "supply" ? "What are you selling?" : "What do you need?";

  const amountLabel = kind === "price" ? "What's the price?" : "How much?";
  const dateLabel =
    kind === "supply" ? "Available from" : kind === "demand" ? "Needed from" : "Observed on";

  const amountValid = () => {
    if (kind === "price") {
      const value = Number(price);

      return Number.isFinite(value) && value > 0;
    }

    const value = Number(quantity);

    return Number.isFinite(value) && value > 0;
  };

  const reviewValid =
    product !== "" && county !== "" && amountValid() && date !== "";

  const choose = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const reset = () => {
    setKind("supply");
    setProduct("");
    setCounty("");
    setMarket("");
    setQuantity("");
    setUnit("");
    setPrice("");
    setDate(today());
    setQuery("");
    setError(null);
    setResult(null);
    setStep("kind");
  };

  const discoverOpportunities = async (addedProduct: string): Promise<SaveResult> => {
    const [supplies, demands, prices] = await Promise.all([
      db.supplies.toArray(),
      db.demands.toArray(),
      db.prices.toArray(),
    ]);

    const cells = await computeOpportunitySurface(
      {
        supplies,
        demands,
        prices,
        products,
        markets,
        counties,
        resolveUnknownLocation: async (locationName) => {
          const resolved = await resolveLocation(locationName);

          return resolved ? { latitude: resolved.latitude, longitude: resolved.longitude } : null;
        },
        fetchWeather: async (latitude, longitude) => {
          const signals = await getWeatherSignals(latitude, longitude);

          return suitabilityFromWeatherSignals(signals.signals);
        },
      },
    );

    const scored = cells.filter((cell) => cell.opportunity !== null);
    const forProduct = scored.filter((cell) => cell.productName === addedProduct);
    const preferred = forProduct.filter(
      (cell) => cell.entrySignal === "strong-entry" || cell.entrySignal === "promising",
    );
    const ordered = [...(preferred.length > 0 ? preferred : forProduct)].sort(
      (a, b) => (b.opportunity ?? 0) - (a.opportunity ?? 0),
    );

    return { opportunities: forProduct, best: ordered[0] ?? null };
  };

  const submit = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const unitValue = unit.trim() || selectedProduct?.unit || "units";
      const createdAt = new Date().toISOString();

      if (kind === "supply") {
        await db.supplies.add({
          contributor: "You",
          productId: selectedProduct?.id ?? 0,
          productName: product,
          quantity: Number(quantity),
          unit: unitValue,
          county,
          marketName: market || null,
          availableFrom: date,
          availableUntil: null,
          notes: null,
          createdAt,
        });
      } else if (kind === "demand") {
        await db.demands.add({
          contributor: "You",
          productId: selectedProduct?.id ?? 0,
          productName: product,
          quantity: Number(quantity),
          unit: unitValue,
          county,
          marketName: market || null,
          neededFrom: date,
          neededUntil: null,
          notes: null,
          createdAt,
        });
      } else {
        await db.prices.add({
          contributor: "You",
          productId: selectedProduct?.id ?? 0,
          productName: product,
          unit: unitValue,
          price: Number(price),
          currency: "KES",
          county,
          marketName: market || null,
          observedOn: date,
          notes: null,
          createdAt,
        });
      }

      const found = await discoverOpportunities(product);

      setResult(found);
      setStep("saved");
    } catch (exception: unknown) {
      setError(exception instanceof Error ? exception.message : "Failed to save the record.");
    } finally {
      setBusy(false);
    }
  };

  const viewOpportunity = () => {
    if (result?.best) {
      setFocusLocation(result.best.locationName);
    }

    openAppTab("opportunity");
  };

  const fmt = (value: number): string => new Intl.NumberFormat("en-KE").format(value);

  if (step === "saved" && result !== null) {
    const count = result.opportunities.length;
    const best = result.best;

    return (
      <div className="add-flow saved-flow">
        {count > 0 ? (
          <>
            <p className="eyebrow">Record saved</p>
            <h2>
              We found {count} opportunity{count === 1 ? "" : "s"}.
            </h2>
            <p className="section-subnote">
              Real records only — {count} scored market–product cell{count === 1 ? "" : "s"} are now
              live for {product}.
            </p>

            {best !== null && (
              <article className="saved-opp">
                <div className="saved-opp-head">
                  <div>
                    <h3>{best.locationName}</h3>
                    <p>
                      {best.productName}
                      {best.county !== best.locationName ? ` · ${best.county}` : ""}
                    </p>
                  </div>
                  <span
                    className={`signal-chip is-${best.entrySignal.replace("-", "-")}`}
                  >
                    {best.entrySignal === "strong-entry"
                      ? "Strong entry"
                      : best.entrySignal === "promising"
                        ? "Promising"
                        : best.entrySignal === "avoid"
                          ? "Low signal"
                          : "Insufficient data"}
                  </span>
                </div>

                <div className="saved-opp-scores">
                  <div className="saved-big">
                    <strong>{fmt(Math.round(best.opportunity ?? 0))}</strong>
                    <span>Opportunity</span>
                  </div>
                  <div className="saved-big">
                    <strong>{fmt(Math.round(best.confidence))}</strong>
                    <span>Confidence</span>
                  </div>
                </div>

                <div className="saved-opp-rows">
                  <div>
                    <span>Demand</span>
                    <strong>
                      {fmt(best.demandUnits)} {best.productUnit}
                    </strong>
                  </div>
                  <div>
                    <span>Supply</span>
                    <strong>
                      {fmt(best.supplyUnits)} {best.productUnit}
                    </strong>
                  </div>
                  <div>
                    <span>Price points</span>
                    <strong>{best.pricePoints}</strong>
                  </div>
                </div>

                <button type="button" className="btn btn-primary flow-primary" onClick={viewOpportunity}>
                  View opportunity →
                </button>
              </article>
            )}
          </>
        ) : (
          <>
            <p className="eyebrow">Record saved</p>
            <h2>Not enough market data yet.</h2>
            <p className="section-subnote">
              This market needs a few more real records before it produces a reliable signal. Keep
              logging — the score updates instantly.
            </p>
          </>
        )}

        <div className="add-flow-actions saved-actions">
          <button type="button" className="btn btn-secondary" onClick={reset}>
            Add another record
          </button>
          <button type="button" className="btn btn-secondary flow-secondary" onClick={() => openAppTab("overview")}>
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="add-flow">
        <div className="empty-state">
          <h3>Loading market references…</h3>
          <p>Counties, products and markets are loading before forms unlock.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-flow">
      {step !== "kind" && (
        <div className="add-flow-progress" aria-label={`Step ${stepIndex + 1} of 5 — ${currentStepLabel}`}>
          <div className="add-flow-track">
            <div
              className="add-flow-fill"
              style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
            />
          </div>
          <p className="add-flow-step-label">
            Step {stepIndex + 1} of {STEP_ORDER.length} · {currentStepLabel}
          </p>
        </div>
      )}

      {step === "kind" && (
        <section className="add-step">
          <h2>What do you want to add?</h2>
          <div className="add-flow-kinds" role="group" aria-label="What to add">
            {KIND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`add-flow-kind${kind === option.id ? " is-active" : ""}`}
                onClick={() => {
                  setKind(option.id);
                  choose("product");
                }}
              >
                <span className="kind-icon">
                  <Icon id={option.id} />
                </span>
                <span className="kind-text">
                  <strong>{option.title}</strong>
                  <span>{option.body}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "product" && (
        <section className="add-step">
          <h2>{productQuestion}</h2>
          <p className="add-step-hint">Choose the product. {kind === "price" ? "A price observation." : "One product per record."}</p>
          <input
            type="search"
            className="surface-search"
            placeholder="Search products…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filteredProducts.length === 0 && <p className="muted">No products found.</p>}
          <div className="add-flow-products">
            {filteredProducts.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`product-choice${product === item.name ? " is-selected" : ""}`}
                onClick={() => {
                  setProduct(item.name);
                  setUnit("");
                }}
              >
                <span>{item.name}</span>
                {product === item.name && <span className="choice-check" aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
          <div className="add-flow-actions">
            <button type="button" className="btn btn-secondary" onClick={() => choose("kind")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary flow-next"
              disabled={product === ""}
              onClick={() => choose("where")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "where" && (
        <section className="add-step">
          <h2>Where is it?</h2>
          <p className="add-step-hint">County first; market is optional.</p>
          <div className="add-flow-fields">
            <label className="form-field">
              <span>County</span>
              <select value={county} onChange={(event) => { setCounty(event.target.value); setMarket(""); }}>
                <option value="">Select county…</option>
                {counties.map((countyItem) => (
                  <option key={countyItem.id} value={countyItem.name}>
                    {countyItem.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Market (optional)</span>
              <select value={market} onChange={(event) => setMarket(event.target.value)}>
                <option value="">— {county || "county"} level —</option>
                {countyMarkets.map((marketItem) => (
                  <option key={marketItem.id} value={marketItem.name}>
                    {marketItem.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="add-flow-actions">
            <button type="button" className="btn btn-secondary" onClick={() => choose("product")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary flow-next"
              disabled={county === ""}
              onClick={() => choose("amount")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "amount" && (
        <section className="add-step">
          <h2>{amountLabel}</h2>
          <p className="add-step-hint">
            {kind === "price"
              ? "Price per unit in KES."
              : `Quantity in ${selectedProduct?.unit ?? "units"}.`}
          </p>
          <div className="add-flow-fields">
            {kind === "price" ? (
              <label className="form-field">
                <span>Price (KES per unit)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="e.g. 85"
                  autoFocus
                />
              </label>
            ) : (
              <label className="form-field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="e.g. 500"
                  autoFocus
                />
              </label>
            )}
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
          <div className="add-flow-actions">
            <button type="button" className="btn btn-secondary" onClick={() => choose("where")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary flow-next"
              disabled={!amountValid()}
              onClick={() => choose("when")}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === "when" && (
        <section className="add-step">
          <h2>{kind === "supply" ? "When is it available?" : kind === "demand" ? "When is it needed?" : "When was it observed?"}</h2>
          <p className="add-step-hint">{dateLabel}.</p>
          <div className="add-flow-fields">
            <label className="form-field">
              <span>{dateLabel}</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          <div className="add-flow-actions">
            <button type="button" className="btn btn-secondary" onClick={() => choose("amount")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary flow-next"
              disabled={date === ""}
              onClick={() => choose("review")}
            >
              Review
            </button>
          </div>
        </section>
      )}

      {step === "review" && (
        <section className="add-step">
          <h2>Review before you add</h2>
          <p className="add-step-hint">Real records only. Nothing is saved until you confirm.</p>
          <div className="add-flow-review">
            <div className="review-row">
              <span>Type</span>
              <strong>
                {kind === "supply" ? "Supply — I have produce" : kind === "demand" ? "Demand — I need produce" : "Price observation"}
              </strong>
            </div>
            <div className="review-row">
              <span>Product</span>
              <strong>
                {product}
                {selectedProduct ? ` (${selectedProduct.unit})` : ""}
              </strong>
            </div>
            <div className="review-row">
              <span>Location</span>
              <strong>
                {market ? `${market}, ${county}` : county}
              </strong>
            </div>
            <div className="review-row">
              <span>Amount</span>
              <strong>
                {kind === "price" ? `KSh ${price} / ${unit || selectedProduct?.unit || "unit"}` : `${quantity} ${unit || selectedProduct?.unit || "units"}`}
              </strong>
            </div>
            <div className="review-row">
              <span>{dateLabel}</span>
              <strong>{date}</strong>
            </div>
          </div>

          {error !== null && <p className="form-status">{error}</p>}

          <div className="add-flow-actions">
            <button type="button" className="btn btn-secondary" onClick={() => choose("when")}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary flow-next"
              disabled={!reviewValid || busy}
              onClick={() => void submit()}
            >
              {busy ? "Saving…" : KIND_VERB[kind]}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}