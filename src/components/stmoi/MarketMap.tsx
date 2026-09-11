import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { DemandRecord, PriceRecord, SupplyRecord } from "../../lib/db";
import type { County, Market } from "../../types/api";

interface MarketMapProps {
  supplies: SupplyRecord[];
  demands: DemandRecord[];
  prices: PriceRecord[];
  counties: County[];
  markets: Market[];
}

interface MapPoint {
  kind: "supply" | "demand" | "price";
  latitude: number;
  longitude: number;
  label: string;
}

const COLOR: Record<MapPoint["kind"], { fill: string; stroke: string }> = {
  supply: { fill: "rgba(75, 93, 52, 0.85)", stroke: "#4b5d34" },
  demand: { fill: "rgba(193, 142, 53, 0.85)", stroke: "#c18e35" },
  price: { fill: "rgba(93, 114, 130, 0.85)", stroke: "#5d7282" },
};

function countyLookup(counties: County[]): Map<string, [number, number]> {
  const lookup = new Map<string, [number, number]>();

  for (const county of counties) {
    if (county.latitude != null && county.longitude != null) {
      lookup.set(county.name, [county.latitude, county.longitude]);
    }
  }

  return lookup;
}

export function MarketMap({
  supplies,
  demands,
  prices,
  counties,
  markets,
}: MarketMapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const points = useMemo<MapPoint[]>(() => {
    const countyCoords = countyLookup(counties);
    const marketCoords = new Map<string, [number, number]>();

    for (const market of markets) {
      if (market.latitude != null && market.longitude != null) {
        marketCoords.set(market.name, [market.latitude, market.longitude]);
      }
    }

    const coordFor = (
      county: string,
      marketName: string | null | undefined,
    ): [number, number] | null => {
      if (marketName) {
        const market = marketCoords.get(marketName);

        if (market) {
          return market;
        }
      }

      return countyCoords.get(county) ?? null;
    };

    const supplyPoints: MapPoint[] = supplies.flatMap((record) => {
      const coord = coordFor(record.county, record.marketName);

      return coord
        ? [
            {
              kind: "supply" as const,
              latitude: coord[0],
              longitude: coord[1],
              label: `${record.productName} · ${record.marketName ?? record.county}`,
            },
          ]
        : [];
    });

    const demandPoints: MapPoint[] = demands.flatMap((record) => {
      const coord = coordFor(record.county, record.marketName);

      return coord
        ? [
            {
              kind: "demand" as const,
              latitude: coord[0],
              longitude: coord[1],
              label: `${record.productName} · ${record.marketName ?? record.county}`,
            },
          ]
        : [];
    });

    const pricePoints: MapPoint[] = prices.flatMap((record) => {
      const coord = coordFor(record.county, record.marketName);

      return coord
        ? [
            {
              kind: "price" as const,
              latitude: coord[0],
              longitude: coord[1],
              label: `${record.productName} · ${record.marketName ?? record.county}`,
            },
          ]
        : [];
    });

    return [...supplyPoints, ...demandPoints, ...pricePoints];
  }, [supplies, demands, prices, counties, markets]);

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }

    const map = L.map(rootRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([-0.02, 37.9], 6);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 15,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;

    if (layer === null) {
      return;
    }

    layer.clearLayers();

    const visible = points;

    for (const point of visible) {
      const color = COLOR[point.kind];

      L.circleMarker([point.latitude, point.longitude], {
        radius: 7,
        weight: 2,
        color: color.stroke,
        fill: true,
        fillColor: color.fill,
        fillOpacity: 0.75,
      })
        .bindTooltip(point.label, { direction: "top", offset: [0, -8] })
        .addTo(layer);
    }

    const map = mapRef.current;

    if (visible.length > 0 && map !== null) {
      layer.addTo(map);

      const bounds = L.latLngBounds(visible.map((point): [number, number] => [point.latitude, point.longitude]));

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 });
    }
  }, [points]);

  const counts = {
    supply: supplies.length,
    demand: demands.length,
    price: prices.length,
  };

  return (
    <aside className="market-map-panel" aria-label="Market map">
      <div className="map-legend" role="group" aria-label="Point legend">
        <span className="signal-chip is-strong-entry">Supply · {counts.supply}</span>
        <span className="signal-chip is-promising">Demand · {counts.demand}</span>
        <span className="signal-chip is-insufficient-data">Price · {counts.price}</span>
      </div>
      <div className="map-canvas" ref={rootRef} />
    </aside>
  );
}