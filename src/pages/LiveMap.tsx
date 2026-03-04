import { useEffect, useState, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRTLSStore } from '@/store/useRTLSStore';
import { mockFloorplan, mockAnchors, mockGeofences } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import type { Tag } from '@/types/rtls';

// ─── API DATA SOURCE ────────────────────────────────────────────
// Set VITE_API_BASE_URL in your environment (e.g. GitHub Actions secrets)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const POSITIONS_ENDPOINT = `${API_BASE_URL}/ingest`;

const POLL_INTERVAL_MS = 2500; // fetch every 2.5 seconds

// ─── Coordinate → map conversion ────────────────────────────────
// The floorplan is rendered in a Leaflet Simple CRS where
// 1 unit = 1 metre.  S3 JSON already gives metres, so we
// just pass them through.  Adjust SCALE if your coordinate
// system differs from the floorplan dimensions.
const SCALE = 1;

// ─── Custom icons ───────────────────────────────────────────────
const anchorIcon = (tech: string, status: string) =>
  L.divIcon({
    className: 'custom-anchor-icon',
    html: `<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
      status === 'online'
        ? 'bg-status-online/20 border-status-online text-status-online'
        : status === 'offline'
        ? 'bg-status-offline/20 border-status-offline text-status-offline'
        : 'bg-status-degraded/20 border-status-degraded text-status-degraded'
    }">${tech[0]}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const tagIcon = (status: string) =>
  L.divIcon({
    className: 'custom-tag-icon',
    html: `<div class="w-4 h-4 rounded-full ${
      status === 'online'
        ? 'bg-primary'
        : status === 'offline'
        ? 'bg-status-offline'
        : 'bg-status-degraded'
    } border-2 border-background shadow-lg"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

// ─── Map controller ─────────────────────────────────────────────
function MapController() {
  const map = useMap();
  useEffect(() => {
    map.setView([10, 20], 1);
  }, [map]);
  return null;
}

// ─── S3 JSON shape ──────────────────────────────────────────────
interface S3Device {
  id: string;
  x: number;
  y: number;
  room?: string;
}

interface S3Payload {
  timestamp: string;
  devices: S3Device[];
}

// ─── Main component ─────────────────────────────────────────────
export default function LiveMap() {
  const { anchors, tags, selectedEntity, setAnchors, setTags, setSelectedEntity } =
    useRTLSStore();
  const [showAnchors, setShowAnchors] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // Load mock anchors once
  useEffect(() => {
    setAnchors(mockAnchors);
  }, [setAnchors]);

  // Poll S3 for live device positions
  useEffect(() => {
    let active = true;

    const fetchPositions = async () => {
      try {
        const res = await fetch(POSITIONS_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: S3Payload = await res.json();

        if (!active) return;

        const apiTags: Tag[] = data.devices.map((d) => ({
          id: d.id,
          label: d.id,
          tech: 'UWB' as const,
          batteryPct: 100,
          sensors: {},
          firmware: '',
          lastSeen: data.timestamp,
          status: 'online',
          position: { x: d.x * SCALE, y: d.y * SCALE },
          // stash room for tooltip
          ...(d.room ? { _room: d.room } : {}),
        }));

        setTags(apiTags);
        setLastUpdate(data.timestamp);
        setFetchError(false);
      } catch (err) {
        console.error('S3 fetch error:', err);
        if (active) setFetchError(true);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [setTags]);

  const bounds = L.latLngBounds(
    [0, 0],
    [mockFloorplan.heightMeters, mockFloorplan.widthMeters]
  );

  return (
    <div className="h-full flex">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[10, 20]}
          zoom={1}
          className="h-full w-full bg-background"
          crs={L.CRS.Simple}
          minZoom={0}
          maxZoom={5}
          zoomControl={true}
        >
          <MapController />

          {/* Floorplan Background */}
          <ImageOverlay
            url="data:image/svg+xml,%3Csvg width='800' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='400' fill='%231e293b'/%3E%3Cpath d='M 0 0 L 800 0 L 800 400 L 0 400 Z' stroke='%23334155' stroke-width='2' fill='none'/%3E%3Cg stroke='%23334155' stroke-width='1' opacity='0.3'%3E%3Cline x1='200' y1='0' x2='200' y2='400'/%3E%3Cline x1='400' y1='0' x2='400' y2='400'/%3E%3Cline x1='600' y1='0' x2='600' y2='400'/%3E%3Cline x1='0' y1='100' x2='800' y2='100'/%3E%3Cline x1='0' y1='200' x2='800' y2='200'/%3E%3Cline x1='0' y1='300' x2='800' y2='300'/%3E%3C/g%3E%3Ctext x='20' y='30' fill='%2364748b' font-size='14' font-family='monospace'%3EICU Floor 1 - 40m x 20m%3C/text%3E%3C/svg%3E"
            bounds={bounds}
          />

          {/* Geofences */}
          {showGeofences &&
            mockGeofences.map((gf) => (
              <Polygon
                key={gf.id}
                positions={gf.polygon.map((p) => [p.y, p.x] as [number, number])}
                pathOptions={{
                  color: gf.rule === 'exit' ? '#10b981' : '#f59e0b',
                  weight: 2,
                  opacity: 0.6,
                  fillOpacity: 0.1,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <div className="font-semibold">{gf.name}</div>
                    <div className="text-muted-foreground">Rule: {gf.rule}</div>
                  </div>
                </Popup>
              </Polygon>
            ))}

          {/* Anchors */}
          {showAnchors &&
            anchors.map((anchor) => (
              <Marker
                key={anchor.id}
                position={[anchor.position.y, anchor.position.x]}
                icon={anchorIcon(anchor.tech, anchor.status)}
                eventHandlers={{
                  click: () => setSelectedEntity({ type: 'anchor', id: anchor.id }),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{anchor.label}</div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={anchor.status} />
                      <Badge variant="outline" className="text-xs">
                        {anchor.tech}
                      </Badge>
                    </div>
                    {anchor.rssi && (
                      <div className="text-muted-foreground">RSSI: {anchor.rssi} dBm</div>
                    )}
                    {anchor.snr && (
                      <div className="text-muted-foreground">SNR: {anchor.snr} dB</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Device tags from S3 */}
          {showTags &&
            tags.map((tag) => (
              <Marker
                key={tag.id}
                position={[tag.position?.y ?? 0, tag.position?.x ?? 0]}
                icon={tagIcon('online')}
                eventHandlers={{
                  click: () => setSelectedEntity({ type: 'tag', id: tag.id }),
                }}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{tag.id}</div>
                    {(tag as any)._room && (
                      <div className="text-muted-foreground">
                        Room: {(tag as any)._room}
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {tag.tech}
                    </Badge>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Layer Controls */}
        <Card className="absolute top-4 right-4 p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" />
            <span className="font-medium">Layers</span>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showAnchors}
                onChange={(e) => setShowAnchors(e.target.checked)}
                className="rounded"
              />
              Anchors ({anchors.length})
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showTags}
                onChange={(e) => setShowTags(e.target.checked)}
                className="rounded"
              />
              Devices ({tags.length})
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={showGeofences}
                onChange={(e) => setShowGeofences(e.target.checked)}
                className="rounded"
              />
              Geofences ({mockGeofences.length})
            </label>
          </div>
        </Card>

        {/* Stats Overlay */}
        <Card className="absolute bottom-4 left-4 p-3">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-muted-foreground">Anchors</div>
              <div className="font-mono text-lg">
                {anchors.filter((a) => a.status === 'online').length}/{anchors.length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Devices</div>
              <div className="font-mono text-lg">{tags.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Zones</div>
              <div className="font-mono text-lg">{mockGeofences.length}</div>
            </div>
          </div>
          {lastUpdate && (
            <div className="text-[10px] text-muted-foreground mt-2 font-mono">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
          {fetchError && (
            <div className="text-[10px] text-destructive mt-1">
              ⚠ S3 fetch failed — retrying…
            </div>
          )}
        </Card>
      </div>

      {/* Entity Details Drawer */}
      {selectedEntity && (
        <Card className="w-80 p-4 m-4 overflow-y-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => setSelectedEntity(null)}
          >
            Close
          </Button>
          <div className="text-sm">
            <div className="font-semibold mb-2">
              {selectedEntity.type === 'anchor' ? 'Anchor' : 'Device'} Details
            </div>
            <div className="text-muted-foreground">ID: {selectedEntity.id}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
