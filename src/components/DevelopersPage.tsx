import { useEffect, useState } from "react";

import { fetchFromApi } from "../lib/api";
import { API_BASE_URL } from "../lib/config";
import type { HealthResponse } from "../types/api";

const ENDPOINTS = [
  { path: "/markets", label: "Markets", description: "Reference markets with county coordinates." },
  { path: "/products", label: "Products", description: "Product list with default units." },
  { path: "/counties", label: "Counties", description: "County reference data with coordinates." },
  { path: "/weather/forecast", label: "Weather forecast", description: "Per-coordinate weather risk signals." },
  { path: "/county-weather/forecast", label: "County weather", description: "Weather risk for a county." },
  { path: "/market-weather/forecast", label: "Market weather", description: "Weather risk for a market." },
];

export function DevelopersPage() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

const runCheck = async (isMounted: () => boolean) => {
  setStatus("checking");

  try {
    const health = await fetchFromApi<HealthResponse>("/health");

    if (isMounted()) {
      setStatus(health.status === "ok" ? "online" : "offline");
    }
  } catch {
    if (isMounted()) {
      setStatus("offline");
    }
  } finally {
    if (isMounted()) {
      setCheckedAt(new Date());
    }
  }
};

useEffect(() => {
  let mounted = true;

  void Promise.resolve().then(() => runCheck(() => mounted));

  return () => {
    mounted = false;
  };
}, []);

  return (
    <div className="developers-page">
      <div className="section-heading">
        <p className="eyebrow">For developers</p>
        <h1>Sarateal API</h1>
        <p className="section-subnote">
          A read-only REST API for market reference data and real weather-signal forecasts. All
          responses are plain JSON. No API key is required today.
        </p>
      </div>

      <div className="api-status-row">
        <span className={`api-status-tag is-${status}`}>
          {status === "checking" ? "Checking…" : status === "online" ? "Operational" : "Unreachable"}
        </span>
        <code className="api-base-url">{API_BASE_URL}</code>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void runCheck(() => true)}>
          Check status
        </button>
        {checkedAt !== null && (
          <span className="api-checked-at">
            Last checked {checkedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      <a
        className="btn btn-primary"
        href={`${API_BASE_URL}/docs`}
        target="_blank"
        rel="noreferrer"
      >
        Interactive documentation ↗
      </a>

      <h2 className="api-heading">Endpoints</h2>
      <ul className="endpoint-list">
        {ENDPOINTS.map((endpoint) => (
          <li key={endpoint.path} className="endpoint-row">
            <code>{endpoint.path}</code>
            <span>{endpoint.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}