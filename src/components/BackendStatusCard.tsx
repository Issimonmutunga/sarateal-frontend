import { useEffect, useState } from "react";

import { fetchFromApi } from "../lib/api";
import { API_BASE_URL } from "../lib/config";
import type { HealthResponse } from "../types/api";

type BackendStatus = "checking" | "online" | "offline";

export function BackendStatusCard() {
  const [status, setStatus] = useState<BackendStatus>("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkBackendStatus() {
      try {
        const health = await fetchFromApi<HealthResponse>("/health");

        if (!isMounted) {
          return;
        }

        setStatus(health.status === "ok" ? "online" : "offline");
      } catch {
        if (!isMounted) {
          return;
        }

        setStatus("offline");
      }
    }

    checkBackendStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusLabel = {
    checking: "Checking",
    online: "Online",
    offline: "Offline",
  }[status];

  return (
    <aside className="status-card" aria-label="Backend status">
      <span className={`status-pill status-pill-${status}`}>
        Backend {statusLabel}
      </span>
      <h2>Sarateal API</h2>
      <p>{API_BASE_URL}</p>
      <div className="status-row">
        <span>Mode</span>
        <strong>Demo</strong>
      </div>
      <div className="status-row">
        <span>Core</span>
        <strong>FastAPI</strong>
      </div>
      <div className="status-row">
        <span>Tests</span>
        <strong>168 passing</strong>
      </div>
    </aside>
  );
}