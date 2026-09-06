import { useMemo, useState } from "react";

import type { OpportunityCell } from "../../engine/types";
import { getWeatherSignals, resolveLocation, WEATHER_TTL_MS } from "../../lib/live";
import type { LiveGeocodeResult, LiveWeatherResult } from "../../lib/live";
import { openAppTab } from "../../lib/hash";
import type { County } from "../../types/api";

function timeAgo(iso?: string): string {
  if (!iso) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`;
  }

  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)} h ago`;
  }

  return `${Math.floor(seconds / 86_400)} d ago`;
}

function ttlLabel(ms: number): string {
  const hours = Math.round(ms / 3_600_000);

  return `${hours} h`;
}

interface SignalProps {
  counties: County[];
  referenceReady: boolean;
  cells: OpportunityCell[];
}

interface MarketSignal {
  id: string;
  type: "Demand" | "Supply" | "Price";
  trend: string;
  title: string;
  why: string;
  value: string;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-KE").format(n);
}

export function LiveSignals({ counties, referenceReady, cells }: SignalProps) {
  const coordinateCounties = useMemo(
    () => counties.filter((county) => county.latitude != null && county.longitude != null),
    [counties],
  );
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [weather, setWeather] = useState<LiveWeatherResult | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [geocodeQuery, setGeocodeQuery] = useState("");
  const [geocoded, setGeocoded] = useState<LiveGeocodeResult | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  const marketSignals = useMemo<MarketSignal[]>(() => {
    const scored = cells.filter((cell) => cell.opportunity !== null);

    return scored
      .map((cell) => {
        const gap = cell.demandUnits - cell.supplyUnits;

        if (gap > 0) {
          return {
            id: `demand-${cell.key}`,
            type: "Demand" as const,
            trend: "Strong",
            title: `${cell.locationName} · ${cell.productName}`,
            why: `Demand outpaces supply by ${fmt(gap)} ${cell.productUnit} — buyers are looking.`,
            value: `+${fmt(gap)} ${cell.productUnit}`,
          };
        }

        return {
          id: `supply-${cell.key}`,
          type: "Supply" as const,
          trend: "Plentiful",
          title: `${cell.locationName} · ${cell.productName}`,
          why: `Logged supply covers demand in this cell — prices may soften.`,
          value: `${fmt(cell.supplyUnits)} ${cell.productUnit}`,
        };
      })
      .sort((a, b) => (b.type === "Demand" ? 1 : 0) - (a.type === "Demand" ? 1 : 0))
      .slice(0, 4);
  }, [cells]);

  const loadWeather = async (countyName: string) => {
    const county = coordinateCounties.find((item) => item.name === countyName);

    if (!county) {
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);

    try {
      const result = await getWeatherSignals(county.latitude as number, county.longitude as number, 7);
      setWeather(result);
    } catch (error: unknown) {
      setWeatherError(error instanceof Error ? error.message : "Failed to load weather.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const runGeocode = async () => {
    const query = geocodeQuery.trim();

    if (!query) {
      return;
    }

    setGeocodeLoading(true);
    setGeocodeError(null);

    try {
      const result = await resolveLocation(query, "Kenya");
      setGeocoded(result);
    } catch (error: unknown) {
      setGeocodeError(error instanceof Error ? error.message : "Failed to geocode.");
    } finally {
      setGeocodeLoading(false);
    }
  };

  return (
    <div className="live-signals">
      {marketSignals.length > 0 && (
        <section className="signals-block">
          <h3>Market signals</h3>
          <ol className="signal-feed">
            {marketSignals.map((signal) => (
              <li key={signal.id} className="signal-card">
                <div className="signal-card-head">
                  <span className={`signal-kind${signal.trend === "Strong" ? " is-hot" : ""}`}>
                    {signal.type} <strong>{signal.trend}</strong>
                  </span>
                  <span className="signal-value">{signal.value}</span>
                </div>
                <h4>{signal.title}</h4>
                <p className="signal-why">{signal.why}</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => openAppTab("opportunity")}
                >
                  Explore impact →
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="live-card signals-block">
        <h3>Weather — county risk</h3>
        <p className="muted">
          Forecast for a county, cached {ttlLabel(WEATHER_TTL_MS)}. Feeds the seasonal score.
        </p>

        <div className="form-row">
          <label className="form-field">
            <span>County</span>
            <select
              value={selectedCounty}
              onChange={(event) => {
                setSelectedCounty(event.target.value);
                if (event.target.value) {
                  void loadWeather(event.target.value);
                }
              }}
              disabled={!referenceReady || coordinateCounties.length === 0}
            >
              <option value="">Select a county…</option>
              {coordinateCounties.map((county) => (
                <option key={county.id} value={county.name}>
                  {county.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {weatherLoading && <p className="workspace-note">Fetching forecast…</p>}
        {weatherError && <p className="workspace-note is-warning">{weatherError}</p>}

        {weather && (
          <>
            <p className="cache-note">
              {weather.fromCache ? "Cached" : "Live"} · pulled {timeAgo(weather.fetchedAt)} ·{" "}
              {weather.sourceName}
            </p>
            <ol className="signal-feed">
              {weather.signals.map((signal) => (
                <li key={signal.signal_date} className="signal-card is-weather">
                  <div className="signal-card-head">
                    <span className="signal-kind">
                      Rain <strong>{signal.rainfall_signal.replace("_", " ")}</strong>
                    </span>
                    <span className="signal-value">{signal.signal_date}</span>
                  </div>
                  <p className="signal-why">{signal.summary}</p>
                  <p className="muted signal-impact">
                    Weather can shift supply and prices for crops in {selectedCounty}.
                  </p>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => openAppTab("opportunity")}
                  >
                    Explore impact →
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}

        <details className="signal-tools">
          <summary>Tools — resolve a place name</summary>
          <div className="signal-tools-body">
            <form
              className="entry-form"
              onSubmit={(event) => {
                event.preventDefault();
                void runGeocode();
              }}
            >
              <label className="form-field">
                <span>Place name</span>
                <input
                  type="text"
                  value={geocodeQuery}
                  onChange={(event) => setGeocodeQuery(event.target.value)}
                  placeholder="e.g. Gikomba Market, Nairobi"
                />
              </label>
              <button type="submit" className="primary-action" disabled={!geocodeQuery.trim()}>
                Resolve
              </button>
            </form>

            {geocodeLoading && <p className="workspace-note">Resolving location…</p>}
            {geocodeError && <p className="workspace-note is-warning">{geocodeError}</p>}

            {geocoded && (
              <div className="geocode-result">
                <p className="cache-note">
                  {geocoded.fromCache ? "Cached" : "Live"} · {timeAgo(geocoded.fetchedAt)} ·{" "}
                  {geocoded.sourceName}
                </p>
                <p>
                  <strong>{geocoded.displayName}</strong>
                </p>
                <p className="muted">
                  {geocoded.latitude.toFixed(5)}, {geocoded.longitude.toFixed(5)}
                </p>
              </div>
            )}

            {!geocoded && !geocodeError && <p className="muted">Nothing resolved yet.</p>}
          </div>
        </details>
      </section>
    </div>
  );
}