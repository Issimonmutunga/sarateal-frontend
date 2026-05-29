import { useEffect, useState } from "react";

import { fetchFromApi } from "../lib/api";
import type { Price } from "../types/api";

export function PricesPreview() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrices() {
      try {
        const data = await fetchFromApi<Price[]>("/prices");
        setPrices(data.slice(0, 4));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load prices",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPrices();
  }, []);

  return (
    <section className="api-preview">
      <div className="section-heading">
        <span className="section-kicker">Live prices</span>
        <h2>Recent market price signals</h2>
        <p>
          Sarateal can expose price observations by county, product, unit, date,
          and source.
        </p>
      </div>

      <div className="preview-card">
        {isLoading && <p className="preview-muted">Loading prices...</p>}

        {!isLoading && errorMessage && (
          <p className="preview-error">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && prices.length === 0 && (
          <p className="preview-muted">No prices are available yet.</p>
        )}

        {!isLoading && !errorMessage && prices.length > 0 && (
          <div className="market-list">
            {prices.map((price) => (
              <article className="market-row" key={price.id}>
                <div>
                  <h3>
                    Product #{price.product_id} · {price.county}
                  </h3>
                  <p>
                    {price.price} {price.currency} per {price.unit}
                  </p>
                </div>
                <span>{price.observed_on}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}