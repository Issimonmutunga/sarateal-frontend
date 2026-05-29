import { useEffect, useState } from "react";

import { fetchFromApi } from "../lib/api";
import type { Market } from "../types/api";

type LoadState = "loading" | "ready" | "error";

export function ApiPreview() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadMarkets() {
      try {
        const data = await fetchFromApi<Market[]>("/markets");

        if (!isMounted) {
          return;
        }

        setMarkets(data.slice(0, 3));
        setLoadState("ready");
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadState("error");
      }
    }

    loadMarkets();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Live API preview</p>
        <h2>Market data from the backend</h2>
      </div>

      <div className="preview-card">
        {loadState === "loading" && <p>Loading market records...</p>}

        {loadState === "error" && (
          <p>
            The frontend is running, but market data could not be loaded from the
            backend.
          </p>
        )}

        {loadState === "ready" && markets.length === 0 && (
          <p>The backend responded successfully, but no markets are available yet.</p>
        )}

        {loadState === "ready" && markets.length > 0 && (
          <div className="market-list">
            {markets.map((market) => (
              <article className="market-row" key={market.id}>
                <div>
                  <h3>{market.name}</h3>
                  <p>{market.county}</p>
                </div>
                <span>{market.market_type ?? "Market"}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}