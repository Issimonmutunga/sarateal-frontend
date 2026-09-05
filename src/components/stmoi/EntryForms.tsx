import { useMemo, useState } from "react";

import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import type { DemandRecord, PriceRecord, SupplyRecord } from "../../lib/db";
import type { County, Market, Product } from "../../types/api";

interface EntryFormsProps {
  products: Product[];
  counties: County[];
  markets: Market[];
  disabled: boolean;
}

type FormState = Record<string, string>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function CommonFields({
  state,
  setState,
  products,
  counties,
  markets,
  unitFieldName,
}: {
  state: FormState;
  setState: (updater: (previous: FormState) => FormState) => void;
  products: Product[];
  counties: County[];
  markets: Market[];
  unitFieldName: string;
}) {
  const selectedProduct = products.find((product) => product.name === state.product);
  const countyMarkets = useMemo(
    () => markets.filter((market) => market.county === state.county),
    [markets, state.county],
  );

  const set = (key: string) => (event: { target: { value: string } }) =>
    setState((previous) => ({ ...previous, [key]: event.target.value }));

  return (
    <>
      <label className="form-field">
        <span>Contributor</span>
        <input
          type="text"
          value={state.contributor}
          onChange={set("contributor")}
          placeholder="Your name or organisation"
        />
      </label>

      <label className="form-field">
        <span>Product</span>
        <select value={state.product} onChange={set("product")} required>
          <option value="">Select product…</option>
          {products.map((product) => (
            <option key={product.id} value={product.name}>
              {product.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>County</span>
        <select value={state.county} onChange={set("county")} required>
          <option value="">Select county…</option>
          {counties.map((county) => (
            <option key={county.id} value={county.name}>
              {county.name}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Market (optional — county-level if left blank)</span>
        <select value={state.market} onChange={set("market")}>
          <option value="">— {state.county || "county"} level —</option>
          {countyMarkets.map((market) => (
            <option key={market.id} value={market.name}>
              {market.name}
            </option>
          ))}
        </select>
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Quantity ({selectedProduct?.unit ?? "units"})</span>
          <input
            type="number"
            min="0"
            step="any"
            value={state.quantity}
            onChange={set("quantity")}
            placeholder="e.g. 500"
          />
        </label>

        <label className="form-field">
          <span>Unit</span>
          <input
            type="text"
            value={state[unitFieldName]}
            onChange={set(unitFieldName)}
            placeholder={selectedProduct?.unit ?? "kg"}
          />
        </label>
      </div>
    </>
  );
}

function RecentEntries({
  type,
}: {
  type: "supply" | "demand" | "price";
}) {
  const table =
    type === "supply" ? db.supplies : type === "demand" ? db.demands : db.prices;

  const { value: entries = [] } = useLiveDexie(
    () => table.orderBy("createdAt").reverse().limit(4).toArray() as unknown as Promise<SupplyRecord[]>,
    [type],
  );

  return (
    <div className="recent-entries">
      <h4>Recent {type} entries</h4>
      {entries.length === 0 && <p className="muted">None logged yet.</p>}
      {entries.map((entry) => {
        const record = entry as SupplyRecord | DemandRecord | PriceRecord;
        const amount =
          record && "price" in record && typeof record.price === "number"
            ? `${record.price.toFixed(0)} ${record.currency}`
            : record && "quantity" in record
              ? `${record.quantity} ${record.unit}`
              : "";

        return (
          <p key={record.id} className="recent-entry">
            <strong>{record.productName}</strong> — {amount} at {record.marketName || record.county}{" "}
            <span>by {record.contributor}</span>
          </p>
        );
      })}
    </div>
  );
}

const REQUEST_TYPE_LABELS = {
  supply: "Supply (seller posting)",
  demand: "Demand (buyer posting)",
  price: "Price observation",
};

type BulkType = "supply" | "demand" | "price";

interface ParsedBulkEntry {
  lineNumber: number;
  type: BulkType;
  productId: number;
  productName: string;
  county: string;
  marketName: string | null;
  amount: number;
  unit: string;
}

type BulkParseResult =
  | { parsed: ParsedBulkEntry }
  | { error: string };

function parseBulkEntry(
  lineNumber: number,
  text: string,
  products: Product[],
  counties: County[],
): BulkParseResult {
  const fields = text.split("|").map((field) => field.trim());

  if (fields.length < 5) {
    return { error: `Line ${lineNumber}: need 5 fields (type|county|product|amount|unit).` };
  }

  const [rawType, rawCounty, rawProduct, rawAmount, rawUnit] = fields;

  if (rawType !== "supply" && rawType !== "demand" && rawType !== "price") {
    return { error: `Line ${lineNumber}: unknown type "${rawType}".` };
  }

  const county = counties.find((item) => item.name.toLowerCase() === rawCounty.toLowerCase());

  if (!county) {
    return { error: `Line ${lineNumber}: unknown county "${rawCounty}".` };
  }

  const product = products.find((item) => item.name.toLowerCase() === rawProduct.toLowerCase());

  if (!product) {
    return { error: `Line ${lineNumber}: unknown product "${rawProduct}".` };
  }

  const amount = Number(rawAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: `Line ${lineNumber}: amount must be a positive number.` };
  }

  const unit = rawUnit || product.unit;

  if (!unit) {
    return { error: `Line ${lineNumber}: no unit given and the product has none on file.` };
  }

  return {
    parsed: {
      lineNumber,
      type: rawType,
      productId: product.id,
      productName: product.name,
      county: county.name,
      marketName: null,
      amount,
      unit,
    },
  };
}

function saveBulkEntry(entry: ParsedBulkEntry, contributor: string, line: string): Promise<void> {
  const createdAt = new Date().toISOString();

  if (entry.type === "supply") {
    return db.supplies.add({
      contributor,
      productId: entry.productId,
      productName: entry.productName,
      quantity: entry.amount,
      unit: entry.unit,
      county: entry.county,
      marketName: entry.marketName,
      availableFrom: line,
      availableUntil: null,
      notes: null,
      createdAt,
    }).then(() => undefined);
  }

  if (entry.type === "demand") {
    return db.demands.add({
      contributor,
      productId: entry.productId,
      productName: entry.productName,
      quantity: entry.amount,
      unit: entry.unit,
      county: entry.county,
      marketName: entry.marketName,
      neededFrom: line,
      neededUntil: null,
      notes: null,
      createdAt,
    }).then(() => undefined);
  }

  return db.prices
    .add({
      contributor,
      productId: entry.productId,
      productName: entry.productName,
      unit: entry.unit,
      price: entry.amount,
      currency: "KES",
      county: entry.county,
      marketName: entry.marketName,
      observedOn: line,
      notes: null,
      createdAt,
    })
    .then(() => undefined);
}

function BulkEntries({
  products,
  counties,
  disabled,
}: {
  products: Product[];
  counties: County[];
  disabled: boolean;
}) {
  const [contributor, setContributor] = useState("You");
  const [date, setDate] = useState(today());
  const [bulkText, setBulkText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitBatch = async () => {
    const lines = bulkText
      .split(/\r?\n/)
      .map((text, index) => ({ lineNumber: index + 1, text: text.trim() }))
      .filter((line) => line.text.length > 0 && !line.text.startsWith("#"));

    if (lines.length === 0) {
      setStatus("Nothing to import: add at least one line.");

      return;
    }

    const parsed: ParsedBulkEntry[] = [];
    const errors: string[] = [];

    for (const line of lines) {
      const result = parseBulkEntry(line.lineNumber, line.text, products, counties);

      if ("error" in result) {
        errors.push(result.error);
      } else {
        parsed.push(result.parsed);
      }
    }

    setBusy(true);
    setStatus(null);

    try {
      await db.transaction(
        "rw",
        [db.supplies, db.demands, db.prices],
        async () => {
          for (const entry of parsed) {
            await saveBulkEntry(entry, contributor.trim() || "You", date);
          }
        },
      );

      const imported = parsed.length;
      const summary = `Imported ${imported} of ${lines.length} lines`;
      const detail =
        errors.length > 0 ? ` — ${errors.slice(0, 3).join(" · ")}` : "";

      setStatus(summary + detail + (errors.length > 3 ? " …" : ""));

      if (imported > 0) {
        setBulkText("");
      }
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Failed to import batch.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="bulk-entry">
      <summary>Batch import (one line per record)</summary>
      <p className="muted">
        Format: <code>type|county|product|amount|unit</code> — e.g.
        <code> supply|Bungoma|Maize|2000|kg</code>, <code>price|Nairobi|Maize|65|kg</code>.
        Lines starting with <code>#</code> are ignored.
      </p>
      <div className="form-row">
        <label className="form-field">
          <span>Contributor (whole batch)</span>
          <input
            type="text"
            value={contributor}
            onChange={(event) => setContributor(event.target.value)}
            placeholder="Your name or organisation"
          />
        </label>
        <label className="form-field">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      <textarea
        className="bulk-textarea"
        rows={8}
        value={bulkText}
        onChange={(event) => setBulkText(event.target.value)}
        placeholder={"supply|Bungoma|Maize|2000|kg\ndemand|Nairobi|Cabbage|800|kg\nprice|Kisumu|Maize|58|kg"}
        disabled={disabled}
      />
      <div className="bulk-actions">
        <button
          type="button"
          className="primary-action"
          disabled={disabled || busy}
          onClick={() => void submitBatch()}
        >
          {busy ? "Importing…" : "Import batch"}
        </button>
        <button
          type="button"
          className="status-button"
          disabled={busy}
          onClick={() => {
            setBulkText("");
            setStatus(null);
          }}
        >
          Clear
        </button>
      </div>
      {status !== null && <p className="form-status">{status}</p>}
    </details>
  );
}

export function EntryForms({ products, counties, markets, disabled }: EntryFormsProps) {
  const [requestType, setRequestType] = useState<"supply" | "demand" | "price">("supply");
  const [state, setState] = useState<FormState>({
    contributor: "You",
    product: "",
    county: "",
    market: "",
    quantity: "",
    unit: "",
    price: "",
    availableFrom: today(),
    neededFrom: today(),
    observedOn: today(),
  });
  const [status, setStatus] = useState<string | null>(null);

  const setStateField = (updater: (previous: FormState) => FormState) => setState(updater);

  const currentlyValid = () => {
    if (!state.product || !state.county || !state.contributor.trim()) {
      return "Product, county, and contributor are required.";
    }

    const quantity = Number(state.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "A positive quantity is required.";
    }

    if (requestType === "price") {
      const price = Number(state.price);

      if (!Number.isFinite(price) || price <= 0) {
        return "A positive price is required.";
      }
    }

    return null;
  };

  const submit = async () => {
    const validationError = currentlyValid();

    if (validationError) {
      setStatus(validationError);

      return;
    }

    const product = products.find((item) => item.name === state.product);
    const quantity = Number(state.quantity);
    const unit = state.unit.trim() || product?.unit || "units";
    const contributor = state.contributor.trim();
    const county = state.county;
    const marketName = state.market || null;
    const createdAt = new Date().toISOString();

    try {
      if (requestType === "supply") {
        await db.supplies.add({
          contributor,
          productId: product?.id ?? 0,
          productName: state.product,
          quantity,
          unit,
          county,
          marketName,
          availableFrom: state.availableFrom,
          availableUntil: null,
          notes: null,
          createdAt,
        });
      } else if (requestType === "demand") {
        await db.demands.add({
          contributor,
          productId: product?.id ?? 0,
          productName: state.product,
          quantity,
          unit,
          county,
          marketName,
          neededFrom: state.neededFrom,
          neededUntil: null,
          notes: null,
          createdAt,
        });
      } else {
        await db.prices.add({
          contributor,
          productId: product?.id ?? 0,
          productName: state.product,
          unit,
          price: Number(state.price),
          currency: "KES",
          county,
          marketName,
          observedOn: state.observedOn,
          notes: null,
          createdAt,
        });
      }

      setStatus(`Saved ${requestType} entry for ${state.product} in ${county}.`);
      setState((previous) => ({
        ...previous,
        quantity: "",
        unit: "",
        price: "",
        market: "",
      }));
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Failed to save entry.");
    }
  };

  const typeSpecificDate =
    requestType === "supply"
      ? { label: "Available from", field: "availableFrom" }
      : requestType === "demand"
        ? { label: "Needed from", field: "neededFrom" }
        : { label: "Observed on", field: "observedOn" };

  return (
    <div className="entry-forms">
      <div className="entry-type-picker" role="group" aria-label="Entry type">
        {(Object.keys(REQUEST_TYPE_LABELS) as Array<"supply" | "demand" | "price">).map((type) => (
          <button
            key={type}
            type="button"
            className={`type-button${requestType === type ? " is-active" : ""}`}
            onClick={() => setRequestType(type)}
          >
            {REQUEST_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <form
        className="entry-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <CommonFields
          state={state}
          setState={setStateField}
          products={products}
          counties={counties}
          markets={markets}
          unitFieldName="unit"
        />

        <label className="form-field">
          <span>{typeSpecificDate.label}</span>
          <input
            type="date"
            value={state[typeSpecificDate.field]}
            onChange={(event) =>
              setState((previous) => ({
                ...previous,
                [typeSpecificDate.field]: event.target.value,
              }))
            }
          />
        </label>

        {requestType === "price" && (
          <label className="form-field">
            <span>Price (KES per unit)</span>
            <input
              type="number"
              min="0"
              step="any"
              value={state.price}
              onChange={(event) =>
                setState((previous) => ({ ...previous, price: event.target.value }))
              }
              placeholder="e.g. 85"
            />
          </label>
        )}

        {status !== null && <p className="form-status">{status}</p>}

        <button type="submit" className="primary-action" disabled={disabled}>
          Log {requestType} record
        </button>
      </form>

      {disabled && <p className="workspace-note">Waiting for reference data before forms unlock…</p>}

      <BulkEntries products={products} counties={counties} disabled={disabled} />

      <div className="recent-lists">
        <RecentEntries type="supply" />
        <RecentEntries type="demand" />
        <RecentEntries type="price" />
      </div>
    </div>
  );
}