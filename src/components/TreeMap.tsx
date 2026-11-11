import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { type TreeToken } from '../core/types';

/**
 * Map view of planted trees. Uses OpenStreetMap tiles with a graceful
 * degradation: if tiles are unavailable (offline demo) the markers still plot
 * on the coordinate plane, so the geo-proof story never breaks.
 */

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f5b544',
  VERIFIED: '#2fd07a',
  FUNDED: '#4aa8ff',
  REJECTED: '#ff6b6b',
};

function Recenter({ tokens }: { tokens: TreeToken[] }) {
  const map = useMap();
  React.useEffect(() => {
    const pts = tokens.filter((t) => t.status !== 'REJECTED');
    if (!pts.length) return;
    const bounds = L.latLngBounds(pts.map((t) => [t.geo.lat, t.geo.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [tokens, map]);
  return null;
}

export default function TreeMap({
  tokens,
  height = 420,
  onSelect,
  highlightIds,
}: {
  tokens: TreeToken[];
  height?: number;
  onSelect?: (tokenId: string) => void;
  highlightIds?: string[];
}) {
  const center: [number, number] = [20.5, 78.5];
  const visible = tokens.filter((t) => t.status !== 'REJECTED');

  return (
    <div className="mapwrap" style={{ height }}>
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom
        className="map"
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />
        <Recenter tokens={visible} />
        {visible.map((t) => {
          const active = highlightIds?.includes(t.tokenId);
          return (
            <CircleMarker
              key={t.tokenId}
              center={[t.geo.lat, t.geo.lng]}
              radius={active ? 13 : 8}
              pathOptions={{
                color: active ? '#ffffff' : STATUS_COLOR[t.status],
                weight: active ? 3 : 2,
                fillColor: STATUS_COLOR[t.status],
                fillOpacity: 0.85,
              }}
              eventHandlers={{ click: () => onSelect?.(t.tokenId) }}
            >
              <Popup>
                <div className="pop">
                  <strong>{t.species} · {t.count} tree(s)</strong>
                  <div>{t.district}, {t.state}</div>
                  <div className="pop__muted">{t.planterName} · {t.tokenId}</div>
                  <div className="pop__muted">±{t.geo.accuracyMeters} m accuracy</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="map__legend">
        {Object.entries(STATUS_COLOR)
          .filter(([k]) => k !== 'REJECTED')
          .map(([k, v]) => (
            <span key={k} className="map__legend-item">
              <i style={{ background: v }} /> {k}
            </span>
          ))}
      </div>
    </div>
  );
}
