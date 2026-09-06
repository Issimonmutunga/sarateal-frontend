import { useEffect, useState } from "react";

import { computeOpportunitySurface } from "../engine";
import type { OpportunityCell } from "../engine/types";
import { db } from "../lib/db";
import { DASHBOARD_PREVIEW, STATS_LABELS } from "../lib/seo";

function fmtNumber(value: number): string {
  return new Intl.NumberFormat("en-KE").format(value);
}

function weatherRiskLabel(value: number | null): string {
  if (value === null) {
    return "Unknown";
  }

  if (value >= 0.35) {
    return "Low";
  }

  if (value >= 0.15) {
    return "Moderate";
  }

  return "High";
}

export function DashboardPreview() {
  const [live, setLive] = useState<OpportunityCell | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [supplies, demands, prices, counties, products, markets] = await Promise.all([
          db.supplies.toArray(),
          db.demands.toArray(),
          db.prices.toArray(),
          db.counties.toArray(),
          db.products.toArray(),
          db.markets.toArray(),
        ]);

        if (!mounted) {
          return;
        }

        if (supplies.length + demands.length + prices.length === 0) {
          setLive(null);
          setScanning(false);

          return;
        }

        const cells = await computeOpportunitySurface({
          supplies,
          demands,
          prices,
          products: products.map((product) => ({
            id: product.id,
            name: product.name,
            unit: product.unit,
            category: product.category,
          })),
          markets,
          counties,
        });

        if (!mounted) {
          return;
        }

        setLive(cells[0] ?? null);
      } catch {
        if (mounted) {
          setLive(null);
        }
      } finally {
        if (mounted) {
          setScanning(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const route = live
    ? `${live.productName} · ${live.locationName}`
    : scanning
      ? "Reading your records…"
      : DASHBOARD_PREVIEW.route;

  const note = live
    ? "Top opportunity, computed live from your records."
    : scanning
      ? "Computing scores…"
      : DASHBOARD_PREVIEW.note;

  return (
    <div className="preview-dash">
      {live && live.opportunity !== null ? (
        <>
          <p className="preview-dash-route">{route}</p>
          <div className="preview-chips">
            <span className="score-chip is-high">
              <span>Opportunity</span>
              <strong>{Math.round(live.opportunity)}</strong>
            </span>
            <span className="score-chip">
              <span>Confidence</span>
              <strong>{Math.round(live.confidence)}</strong>
            </span>
          </div>
          <div className="preview-rows">
            <div className="preview-row">
              <span>Supply</span>
              <strong>{fmtNumber(live.supplyUnits)} {live.productUnit}</strong>
            </div>
            <div className="preview-row">
              <span>Demand</span>
              <strong>{fmtNumber(live.demandUnits)} {live.productUnit}</strong>
            </div>
            <div className="preview-row">
              <span>Price points</span>
              <strong>{fmtNumber(live.pricePoints)} entries</strong>
            </div>
            <div className="preview-row">
              <span>Suitability</span>
              <strong>{weatherRiskLabel(live.components.seasonal.value)}</strong>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="preview-dash-route">{route}</p>
          <div className="preview-chips">
            {DASHBOARD_PREVIEW.chips.map((chip) => (
              <span className="score-chip" key={chip.label}>
                <span>{chip.label}</span>
                <strong>{chip.value}</strong>
              </span>
            ))}
          </div>
          <div className="preview-rows">
            {DASHBOARD_PREVIEW.rows.map((row) => (
              <div className="preview-row" key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
      {note ? <p className="preview-note">{note}</p> : null}
    </div>
  );
}

interface LiveStats {
  products: number;
  supply: number;
  demand: number;
  price: number;
  weather: number;
}

export function StatsBand() {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [supplies, demands, prices, weather] = await Promise.all([
          db.supplies.toArray(),
          db.demands.toArray(),
          db.prices.toArray(),
          db.weatherCache.toArray(),
        ]);

        if (!mounted) {
          return;
        }

        const productIds = new Set<number>([...supplies, ...demands, ...prices].map((record) => record.productId));

        setStats({
          products: productIds.size,
          supply: supplies.length,
          demand: demands.length,
          price: prices.length,
          weather: weather.length,
        });
      } catch {
        if (mounted) {
          setStats(null);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = (id: (typeof STATS_LABELS)[number]["id"]): string => {
    if (stats === null) {
      return "…";
    }

    switch (id) {
      case "markets":
        return "—";
      case "products":
        return fmtNumber(stats.products);
      case "supply":
        return fmtNumber(stats.supply);
      case "demand":
        return fmtNumber(stats.demand);
      case "price":
        return fmtNumber(stats.price);
      case "weather":
        return fmtNumber(stats.weather);
    }
  };

  return (
    <section className="stats-band" id="stats" data-reveal>
      <div className="stats-band-head">
        <p className="eyebrow">Your workspace today</p>
        <p className="stats-band-sub">Real counts from this browser.</p>
      </div>
      <div className="stats-grid">
        {STATS_LABELS.map((item) => (
          <div className="stat" key={item.id}>
            <span className="stat-value">{value(item.id)}</span>
            <span className="stat-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}