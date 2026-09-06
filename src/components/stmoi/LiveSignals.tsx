import { useMemo, useState } from "react";

import { getWeatherSignals, resolveLocation, WEATHER_TTL_MS, GEOCODE_TTL_MS } from "../../lib/live";
import type { LiveGeocodeResult, LiveWeatherResult } from "../../lib/live";
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

export function LiveSignals({ counties, referenceReady }: { counties: County[]; referenceReady: boolean }) {
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
      <div className="live-card">
        <h3>County weather risk (Open-Meteo)</h3>
        <p className="muted">
          County forecast from live signals, cached {ttlLabel(WEATHER_TTL_MS)}. Feeds the seasonal
          component.
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
            <div className="signal-list">
              {weather.signals.map((signal) => (
                <div key={signal.signal_date} className="signal-row">
                  <strong>{signal.signal_date}</strong>
                  <span className="signal-tag">{signal.heat_risk} heat</span>
                  <span className="signal-tag">{signal.rainfall_signal.replace("_", " ")}</span>
                  <p>{signal.summary}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="live-card">
        <h3>Location resolver (Nominatim/OSM)</h3>
        <p className="muted">
          Resolves a place name to coordinates. Cached {ttlLabel(GEOCODE_TTL_MS)}.
        </p>

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
    </div>
  );
}