import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { ensureReferenceData, getCachedMarkets } from "../lib/cache";
import { HERO } from "../lib/seo";
import type { Market } from "../types/api";

export function HeroMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    let mounted = true;

    void ensureReferenceData()
      .then(() => getCachedMarkets())
      .then((list) => {
        if (mounted) {
          setMarkets(list);
        }
      })
      .catch(() => {
        if (mounted) {
          setMarkets([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }

    const map = L.map(rootRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
    }).setView([-0.4, 37.4], 6);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 15,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (map === null || markets.length === 0) {
      return;
    }

    const coords = markets
      .filter((market) => market.latitude != null && market.longitude != null)
      .map((market) => ({ market, latitude: market.latitude as number, longitude: market.longitude as number }));

    if (coords.length === 0) {
      return;
    }

    const layer = L.layerGroup().addTo(map);

    for (const point of coords) {
      L.circleMarker([point.latitude, point.longitude], {
        radius: 4.5,
        weight: 1.5,
        color: "rgba(47, 74, 50, 0.35)",
        fill: true,
        fillColor: "rgba(47, 74, 50, 0.4)",
        fillOpacity: 0.5,
      })
        .bindTooltip(point.market.name, { direction: "top", offset: [0, -6] })
        .addTo(layer);
    }

    const pulseIcon = L.divIcon({
      className: "hero-pulse-wrap",
      html: '<span class="hero-pulse"></span>',
      iconSize: [54, 54],
      iconAnchor: [27, 27],
    });

    L.marker([-1.2921, 36.8219], { icon: pulseIcon, zIndexOffset: 1000 })
      .bindTooltip("Nairobi — Maize · high opportunity", { direction: "top" })
      .addTo(layer);

    map.fitBounds(L.latLngBounds(coords.map((point) => [point.latitude, point.longitude] as [number, number])), {
      padding: [18, 18],
      maxZoom: 6.5,
    });

    return () => {
      layer.clearLayers();
    };
  }, [markets]);

  return (
    <div className="hero-map" aria-label={HERO.map.label}>
      <div className="hero-map-head">
        <p className="eyebrow">Live market surface</p>
        <span className="hero-map-route">Maize · Nakuru → Nairobi</span>
      </div>
      <div className="hero-map-canvas" ref={rootRef} />
      <div className="map-legend" aria-label="Opportunity legend">
        {HERO.map.legend.map((item) => (
          <span key={item} className="signal-chip is-strong-entry">
            {item}
          </span>
        ))}
      </div>
      <p className="hero-map-note">Every mark is a market. Scores come from records you log.</p>
    </div>
  );
}