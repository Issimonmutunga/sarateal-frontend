import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { OpportunityCell } from "../../engine/types";
import type { EntrySignal } from "../../engine/types";
import type { County, Market } from "../../types/api";

interface OpportunityMapProps {
  cells: OpportunityCell[];
  counties: County[];
  markets: Market[];
  selectedLocation: string | null;
  onSelect: (location: string | null) => void;
}

interface LocationBucket {
  locationName: string;
  latitude: number;
  longitude: number;
  cells: OpportunityCell[];
  bestSignal: EntrySignal;
  bestOpportunity: number;
}

const SIGNAL_COLOR: Record<EntrySignal, { fill: string; stroke: string }> = {
  "strong-entry": { fill: "#2f4a32", stroke: "#1f3324" },
  promising: { fill: "#b98a3e", stroke: "#a4772a" },
  avoid: { fill: "#b4452c", stroke: "#8f3521" },
  "insufficient-data": { fill: "#b9bba9", stroke: "#979c8c" },
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

export function OpportunityMap({
  cells,
  counties,
  markets,
  selectedLocation,
  onSelect,
}: OpportunityMapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const locations = useMemo<LocationBucket[]>(() => {
    const countyCoords = countyLookup(counties);
    const buckets = new Map<string, LocationBucket>();

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
  }, [cells, counties]);

  const referenceMarkets = useMemo(
    () =>
      markets.filter((market) => market.latitude != null && market.longitude != null),
    [markets],
  );

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }

    const map = L.map(rootRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([-0.4, 37.4], 6);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 15,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
    }).addTo(map);

    map.on("click", () => onSelect(null));

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layer = layerRef.current;

    if (layer === null) {
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
        fillOpacity: 0.6,
      })
        .bindTooltip(market.name, { direction: "top", offset: [0, -6] })
        .addTo(layer);
    }

    for (const bucket of locations) {
      const color = SIGNAL_COLOR[bucket.bestSignal];
      const radius = 5 + (Math.max(0, Math.min(100, bucket.bestOpportunity)) / 100) * 7;
      const isSelected = bucket.locationName === selectedLocation;

      const marker = L.circleMarker([bucket.latitude, bucket.longitude], {
        radius: isSelected ? radius + 3 : radius,
        weight: isSelected ? 3 : 2,
        color: isSelected ? "#ffffff" : color.stroke,
        fill: true,
        fillColor: color.fill,
        fillOpacity: isSelected ? 0.95 : 0.8,
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

      marker.on("click", () => {
        onSelect(bucket.locationName);
      });

      if (isSelected) {
        const ringIcon = L.divIcon({
          className: "om-ring-wrap",
          html: '<span class="om-ring"></span>',
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });

        L.marker([bucket.latitude, bucket.longitude], {
          icon: ringIcon,
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(layer);
      }
    }
  }, [locations, referenceMarkets, selectedLocation, onSelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (map === null) {
      return;
    }

    if (selectedLocation !== null) {
      const bucket = locations.find((item) => item.locationName === selectedLocation);

      if (bucket) {
        map.setView([bucket.latitude, bucket.longitude], Math.max(6, map.getZoom()), { animate: true });
      }

      return;
    }

    let coords: Array<[number, number]> = locations.map(
      (bucket): [number, number] => [bucket.latitude, bucket.longitude],
    );

    if (coords.length === 0) {
      coords = referenceMarkets.map(
        (market): [number, number] => [market.latitude as number, market.longitude as number],
      );
    }

    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords), { padding: [24, 24], maxZoom: 6.5 });
    }
  }, [locations, referenceMarkets, selectedLocation]);

  return <div className="opportunity-map-canvas" ref={rootRef} />;
}