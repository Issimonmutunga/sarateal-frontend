import { useRef, useState } from "react";

import { useLiveDexie } from "../../hooks/useDexie";
import { db } from "../../lib/db";
import {
  DatasetImportError,
  exportCsv,
  exportJson,
  importDatasetSnapshot,
  parseDatasetCsv,
  parseDatasetSnapshot,
  refreshReferenceCache,
  summarizeImport,
  type DatasetSnapshot,
  type ImportSummary,
} from "../../lib/export";
import { RecordsManager } from "./RecordsManager";

interface ImportPreviewState {
  source: "csv" | "json";
  snapshot: DatasetSnapshot;
  skippedRows: Array<{ line: number; reason: string }>;
  summary: ImportSummary;
}

export function DatasetPanel() {
  const { value: supplies = 0 } = useLiveDexie(() => db.supplies.count(), []);
  const { value: demands = 0 } = useLiveDexie(() => db.demands.count(), []);
  const { value: prices = 0 } = useLiveDexie(() => db.prices.count(), []);
  const { value: matches = 0 } = useLiveDexie(() => db.matches.count(), []);
  const { value: counties = 0 } = useLiveDexie(() => db.counties.count(), []);
  const { value: products = 0 } = useLiveDexie(() => db.products.count(), []);
  const { value: markets = 0 } = useLiveDexie(() => db.markets.count(), []);

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  async function run(action: string, task: () => Promise<unknown>): Promise<void> {
    setBusy(action);
    setMessage(null);

    try {
      const result = await task();
      setMessage(typeof result === "string" ? result : "Done.");
    } catch (error) {
      setMessage(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(null);
    }
  }

  async function eraseAllRecords(): Promise<void> {
    const confirmed = window.confirm(
      "Erase all supply, demand, price and match records from this browser? Reference data is kept.",
    );

    if (!confirmed) {
      return;
    }

    await db.transaction(
      "rw",
      [db.supplies, db.demands, db.prices, db.matches, db.locations, db.weatherCache],
      async () => {
        await Promise.all([
          db.supplies.clear(),
          db.demands.clear(),
          db.prices.clear(),
          db.matches.clear(),
          db.locations.clear(),
          db.weatherCache.clear(),
        ]);
      },
    );
  }

  async function handleImportFile(file: File): Promise<string | undefined> {
    const text = await file.text();
    let snapshot: DatasetSnapshot;
    let skippedRows: Array<{ line: number; reason: string }> = [];

    try {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const result = await parseDatasetCsv(text);

        snapshot = result.snapshot;
        skippedRows = result.skippedRows;
      } else {
        snapshot = parseDatasetSnapshot(text);
      }
    } catch (error) {
      throw new DatasetImportError(
        error instanceof DatasetImportError
          ? error.message
          : "Could not read the dataset file.",
      );
    }

    setImportPreview({
      source: file.name.toLowerCase().endsWith(".csv") ? "csv" : "json",
      snapshot,
      skippedRows,
      summary: summarizeImport(snapshot, {
        supplies,
        demands,
        prices,
        matches,
      }),
    });

    return undefined;
  }

  async function applyImport(): Promise<string> {
    if (importPreview === null) {
      return "";
    }

    const { snapshot, skippedRows } = importPreview;
    const message = await importDatasetSnapshot(snapshot);
    setImportPreview(null);

    if (skippedRows.length === 0) {
      return message;
    }

    const preview = skippedRows
      .slice(0, 3)
      .map(({ line, reason }) => `line ${line}: ${reason}`)
      .join("; ");

    return `${message} ${skippedRows.length} row${skippedRows.length === 1 ? "" : "s"} skipped (${preview}${skippedRows.length > 3 ? `, +${skippedRows.length - 3} more` : ""}).`;
  }

  return (
    <div className="dataset-panel">
      <div className="section-heading">
        <h3>Local dataset management</h3>
        <p className="section-subnote">
          Everything stays in this browser unless you export it. Exports are plain JSON / CSV you
          can keep, share, or later feed into the optional remote-sync step; they contain only real
          records — never simulated data. That same snapshot is the migration path if accounts are
          added later.
        </p>
      </div>

      <ul className="dataset-counts">
        <li>{supplies} supply</li>
        <li>{demands} demand</li>
        <li>{prices} price</li>
        <li>{matches} matches</li>
        <li>{counties} counties</li>
        <li>{products} products</li>
        <li>{markets} markets</li>
      </ul>

      <div className="dataset-actions">
        <button
          type="button"
          className="status-button"
          disabled={busy !== null}
          onClick={() => void run("json-export", () => exportJson())}
        >
          {busy === "json-export" ? "Exporting…" : "Export JSON"}
        </button>
        <button
          type="button"
          className="status-button"
          disabled={busy !== null}
          onClick={() => void run("csv-export", () => exportCsv())}
        >
          {busy === "csv-export" ? "Exporting…" : "Export CSV"}
        </button>
        <button
          type="button"
          className="status-button is-danger"
          disabled={busy !== null}
          onClick={() => importInputRef.current?.click()}
        >
          Import JSON/CSV…
        </button>
        <button
          type="button"
          className="status-button"
          disabled={busy !== null}
          onClick={() => void run("refresh-reference", () => refreshReferenceCache())}
        >
          {busy === "refresh-reference" ? "Refreshing…" : "Refresh reference data"}
        </button>
        <button
          type="button"
          className="status-button is-danger"
          disabled={busy !== null}
          onClick={() => void run("erase", () => eraseAllRecords())}
        >
          {busy === "erase" ? "Erasing…" : "Erase all records"}
        </button>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json,text/csv,.csv"
          className="hidden-file-input"
          onChange={(event) => {
            const file = event.target.files?.[0];

            event.target.value = "";

            if (file) {
              void run("json-import", () => handleImportFile(file));
            }
          }}
        />
      </div>

      {importPreview !== null && (
        <div className="import-preview">
          <h4>Import preview — not applied yet</h4>
          <p className="section-subnote">
            This {importPreview.source.toUpperCase()} would{" "}
            <strong>replace</strong> all current records. Nothing is changed until you confirm.
          </p>
          <ul className="dataset-counts">
            <li>
              {importPreview.summary.supplies} supply
              {importPreview.summary.current.supplies > 0 && (
                <span className="muted"> (currently {importPreview.summary.current.supplies})</span>
              )}
            </li>
            <li>
              {importPreview.summary.demands} demand
              {importPreview.summary.current.demands > 0 && (
                <span className="muted"> (currently {importPreview.summary.current.demands})</span>
              )}
            </li>
            <li>
              {importPreview.summary.prices} price
              {importPreview.summary.current.prices > 0 && (
                <span className="muted"> (currently {importPreview.summary.current.prices})</span>
              )}
            </li>
            <li>
              {importPreview.summary.matchesAfterDedupe} matches
              {importPreview.summary.droppedMatches > 0 && (
                <span className="muted">
                  {" "}
                  ({importPreview.summary.droppedMatches} duplicates dropped)
                </span>
              )}
            </li>
          </ul>
          <div className="import-sample">
            {importPreview.summary.sample.map((entry) => (
              <span className="import-sample-item" key={`${entry.kind}-${entry.text}`}>
                <strong>{entry.kind}</strong> {entry.text}
              </span>
            ))}
          </div>
          <div className="dataset-actions">
            <button
              type="button"
              className="status-button"
              disabled={busy !== null}
              onClick={() => void run("apply-import", applyImport)}
            >
              {busy === "apply-import" ? "Applying…" : "Apply import"}
            </button>
            <button
              type="button"
              className="status-button is-danger"
              disabled={busy !== null}
              onClick={() => setImportPreview(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message !== null && <p className="workspace-note">{message}</p>}

      <RecordsManager />
    </div>
  );
}
