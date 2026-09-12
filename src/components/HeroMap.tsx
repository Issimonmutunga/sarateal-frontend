import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { computeOpportunitySurface } from "../engine";
import { DEFAULT_SCORING_CONFIG } from "../engine/config";
import type { EntrySignal, OpportunityCell } from "../engine/types";
import { useLiveDexie } from "../hooks/useDexie";
import {
  ensureReferenceData,
  getCachedCounties,
  getCachedMarkets,
  getCachedProducts,
} from "../lib/cache";
import { db } from "../lib/db";
import type { County, Market, Product } from "../types/api";

interface HomeLocationBucket {
  locationName: string;
  latitude: number;
  longitude: number;
  cells: OpportunityCell[];
  bestSignal: EntrySignal;
  bestOpportunity: number;
}

const SIGNAL_COLOR: Record<EntrySignal, { fill: string; stroke: string }> = {
  "strong-entry": { fill: "#1e7a4c", stroke: "#165a38" },
  promising: { fill: "#c98a2c", stroke: "#9c6c1f" },
  avoid: { fill: "#8a938d", stroke: "#6d756f" },
  "insufficient-data": { fill: "#b2453b", stroke: "#8c342d" },
};

const SIGNAL_RANK: Record<EntrySignal, number> = {
  "strong-entry": 0,
  promising: 1,
  avoid: 2,
  "insufficient-data": 3,
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

interface ReferenceData {
  counties: County[];
  products: Product[];
  markets: Market[];
}

export function HeroMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [reference, setReference] = useState<ReferenceData | null>(null);
  const [cells, setCells] = useState<OpportunityCell[]>([]);

  const { value: supplies = [] } = useLiveDexie(() => db.supplies.toArray(), []);
  const { value: demands = [] } = useLiveDexie(() => db.demands.toArray(), []);
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);

  useEffect(() => {
    let cancelled = false;

    ensureReferenceData()
      .then(async () => {
        if (cancelled) {
          return;
        }

        const [countyList, productList, marketList] = await Promise.all([
          getCachedCounties(),
          getCachedProducts(),
          getCachedMarkets(),
        ]);

        setReference({ counties: countyList, products: productList, markets: marketList });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        void Promise.all([getCachedCounties(), getCachedProducts(), getCachedMarkets()]).then(
          ([countyList, productList, marketList]) => {
            if (!cancelled) {
              setReference({ counties: countyList, products: productList, markets: marketList });
            }
          },
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasRecords = supplies.length + demands.length + prices.length > 0;

  useEffect(() => {
    if (!reference || !hasRecords) {
      return;
    }

    let cancelled = false;

    computeOpportunitySurface(
      {
        supplies,
        demands,
        prices,
        products: reference.products,
        markets: reference.markets,
        counties: reference.counties,
      },
      DEFAULT_SCORING_CONFIG,
    ).then((result) => {
      if (!cancelled) {
        setCells(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference, hasRecords, supplies, demands, prices]);

  const locations = useMemo<HomeLocationBucket[]>(() => {
    const countyCoords = countyLookup(reference?.counties ?? []);
    const buckets = new Map<string, HomeLocationBucket>();

    for (const cell of cells) {
      let latitude = cell.latitude;
      let longitude = cell.longitude;

      if (latitude === null || longitude === null) {
        const coord = countyCoords.get(cell.county);

        if (coord) {
          latitude = coord[0];
          longitude = coord[1];
        }
      }

      if (latitude === null || longitude === null) {
        continue;
      }

      const existing = buckets.get(cell.locationName);

      if (existing) {
        existing.cells.push(cell);

        if (SIGNAL_RANK[cell.entrySignal] < SIGNAL_RANK[existing.bestSignal]) {
          existing.bestSignal = cell.entrySignal;
        }

        existing.bestOpportunity = Math.max(existing.bestOpportunity, cell.opportunity ?? 0);
      } else {
        buckets.set(cell.locationName, {
          locationName: cell.locationName,
          latitude,
          longitude,
          cells: [cell],
          bestSignal: cell.entrySignal,
          bestOpportunity: cell.opportunity ?? 0,
        });
      }
    }

    return [...buckets.values()];
  }, [cells, reference]);

  const referenceMarkets = useMemo(
    () =>
      (reference?.markets ?? []).filter(
        (market) => market.latitude != null && market.longitude != null,
      ),
    [reference],
  );

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }

    const map = L.map(rootRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([-0.4, 37.4], 6);

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
    const map = mapRef.current;

    if (layer === null || map === null) {
      return;
    }

    layer.clearLayers();

    for (const market of referenceMarkets) {
      L.circleMarker([market.latitude as number, market.longitude as number], {
        radius: 3,
        weight: 1,
        color: "rgba(47, 74, 50, 0.4)",
        fill: true,
        fillColor: "rgba(124, 143, 110, 0.35)",
        fillOpacity: 0.55,
      })
        .bindTooltip(market.name, { direction: "top", offset: [0, -6] })
        .addTo(layer);
    }

    for (const bucket of locations) {
      const color = SIGNAL_COLOR[bucket.bestSignal];
      const radius = 5 + (Math.max(0, Math.min(100, bucket.bestOpportunity)) / 100) * 7;

      const marker = L.circleMarker([bucket.latitude, bucket.longitude], {
        radius,
        weight: 2,
        color: color.stroke,
        fill: true,
        fillColor: color.fill,
        fillOpacity: 0.85,
      }).addTo(layer);

      const lines = bucket.cells
        .slice(0, 5)
        .map(
          (cell) =>
            `${cell.productName} · O ${cell.opportunity === null ? "—" : Math.round(cell.opportunity)} · C ${Math.round(cell.confidence)}`,
        )
        .join("<br/>");

      marker.bindTooltip(`<strong>${bucket.locationName}</strong><br/>${lines}`, {
        direction: "top",
        offset: [0, -8],
      });
    }

    const coords: Array<[number, number]> = locations.map(
      (bucket): [number, number] => [bucket.latitude, bucket.longitude],
    );

    if (coords.length === 0) {
      coords.push(...referenceMarkets.map(
        (market): [number, number] => [market.latitude as number, market.longitude as number],
      ));
    }

    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [32, 32], maxZoom: 6.5 });
    }
  }, [locations, referenceMarkets]);

  return <div className="home-hero-map-canvas" ref={rootRef} />;
}