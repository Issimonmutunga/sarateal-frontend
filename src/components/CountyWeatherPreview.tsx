import { useEffect, useState } from "react";

import { fetchFromApi } from "../lib/api";
import type { WeatherRiskSignal } from "../types/api";

type LoadState = "loading" | "ready" | "error";

export function CountyWeatherPreview() {
  const [signals, setSignals] = useState<WeatherRiskSignal[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let isMounted = true;

    async function loadCountyWeather() {
      try {
        const data = await fetchFromApi<WeatherRiskSignal[]>(
          "/county-weather/forecast?county=Nairobi&forecast_days=1",
        );

        if (!isMounted) {
          return;
        }

        setSignals(data);
        setLoadState("ready");
      } catch {
        if (!isMounted) {
          return;
        }

        setLoadState("error");
      }
    }

    loadCountyWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  const firstSignal = signals[0];

  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Weather-aware decisions</p>
        <h2>Nairobi county risk signal</h2>
      </div>

      <div className="preview-card">
        {loadState === "loading" && <p>Loading county weather signal...</p>}

        {loadState === "error" && (
          <p>
            The frontend is running, but county weather could not be loaded from
            the backend.
          </p>
        )}

        {loadState === "ready" && !firstSignal && (
          <p>The backend responded successfully, but no signal is available yet.</p>
        )}

        {loadState === "ready" && firstSignal && (
          <div className="weather-preview">
            <div>
              <span className="weather-label">Heat risk</span>
              <strong>{firstSignal.heat_risk}</strong>
            </div>
            <div>
              <span className="weather-label">Rainfall</span>
              <strong>{firstSignal.rainfall_signal}</strong>
            </div>
            <p>{firstSignal.summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}