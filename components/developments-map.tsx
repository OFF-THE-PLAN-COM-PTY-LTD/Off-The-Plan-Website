"use client";

import { useState, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import Link from "next/link";
import type { Development } from "@/types/development";
import "mapbox-gl/dist/mapbox-gl.css";

interface Props {
  developments: Development[];
}

export function DevelopmentsMap({ developments }: Props) {
  const [selected, setSelected] = useState<Development | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 133.8,
    latitude: -27.5,
    zoom: 4.2,
  });

  const handleMarkerClick = useCallback((dev: Development, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(dev);
    setViewState((prev) => ({
      ...prev,
      longitude: dev.lng!,
      latitude: dev.lat!,
      zoom: Math.max(prev.zoom, 11),
    }));
  }, []);

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: "100%", height: "100%" }}
      onClick={() => setSelected(null)}
    >
      <NavigationControl position="bottom-right" />

      {developments.map((dev) => (
        <Marker
          key={dev.id}
          longitude={dev.lng!}
          latitude={dev.lat!}
          anchor="bottom"
          onClick={(e) => handleMarkerClick(dev, e.originalEvent as unknown as React.MouseEvent)}
        >
          <div className="cursor-pointer group">
            {/* Price pill */}
            <div className="bg-orange text-white font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-lg group-hover:bg-white group-hover:text-navy transition-colors whitespace-nowrap">
              {dev.price_display ?? dev.suburb}
            </div>
            {/* Pin stem */}
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-orange group-hover:border-t-white mx-auto transition-colors" />
          </div>
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.lng!}
          latitude={selected.lat!}
          anchor="top"
          offset={16}
          closeButton={false}
          onClose={() => setSelected(null)}
          className="map-popup"
        >
          <div className="bg-white p-3 min-w-[200px]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40 mb-0.5">
              {selected.suburb}, {selected.state}
            </p>
            <p className="font-display text-navy font-light text-[18px] leading-tight mb-1">
              {selected.name}
            </p>
            {selected.price_display && (
              <p className="font-mono text-label-sm text-orange mb-2">From {selected.price_display}</p>
            )}
            <Link
              href={`/developments/${selected.slug}`}
              className="font-mono text-[10px] uppercase tracking-widest text-navy hover:text-orange transition-colors"
            >
              View development →
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  );
}
