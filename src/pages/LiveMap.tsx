import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRTLSStore } from '@/store/useRTLSStore';
import { mockFloorplan, mockAnchors, mockTags, mockGeofences, generateMockTracks } from '@/data/mockData';
import StatusBadge from '@/components/StatusBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Navigation } from 'lucide-react';
import type { Anchor, Tag } from '@/types/rtls';

// Custom icons
const anchorIcon = (tech: string, status: string) => L.divIcon({
  className: 'custom-anchor-icon',
  html: `<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
    status === 'online' ? 'bg-status-online/20 border-status-online text-status-online' :
    status === 'offline' ? 'bg-status-offline/20 border-status-offline text-status-offline' :
    'bg-status-degraded/20 border-status-degraded text-status-degraded'
  }">${tech[0]}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const tagIcon = (status: string) => L.divIcon({
  className: 'custom-tag-icon',
  html: `<div class="w-4 h-4 rounded-full ${
    status === 'online' ? 'bg-primary' :
    status === 'offline' ? 'bg-status-offline' :
    'bg-status-degraded'
  } border-2 border-background shadow-lg"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapController() {
  const map = useMap();
  
  useEffect(() => {
    map.setView([10, 20], 1);
  }, [map]);

  return null;
}

export default function LiveMap() {
  const { anchors, tags, tracks, selectedEntity, setAnchors, setTags, setSelectedEntity } = useRTLSStore();
  const [showAnchors, setShowAnchors] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);

  useEffect(() => {
  // Load anchors only — tags come from API now
  setAnchors(mockAnchors);
}, [setAnchors]);

// Fetch live tag positions from backend API
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("http://174.91.138.238:3077/positions");
      const data = await res.json();

      const apiTags = data.tags.map((t: any) => ({
        id: t.id,
        label: `Tag ${t.id}`,
        tech: "UWB",
        status: "online",
        batteryPct: 100,
        sensors: {},
        position: { x: t.x, y: t.y },
      }));

      setTags(apiTags);
    } catch (err) {
      console.error("API error:", err);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [setTags]);


  const bounds = L.latLngBounds(
    [0, 0],
    [mockFloorplan.heightMeters, mockFloorplan.widthMeters]
  );

  // Calculate tag positions (simplified - in real app would come from tracks)
  const tagPositions = tags;


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
          maxZoom={3}
          zoomControl={false}
        >
          <MapController />
          
          {/* Floorplan Background - using a grid pattern as placeholder */}
          <ImageOverlay
            url="data:image/svg+xml,%3Csvg width='800' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='400' fill='%231e293b'/%3E%3Cpath d='M 0 0 L 800 0 L 800 400 L 0 400 Z' stroke='%23334155' stroke-width='2' fill='none'/%3E%3Cg stroke='%23334155' stroke-width='1' opacity='0.3'%3E%3Cline x1='200' y1='0' x2='200' y2='400'/%3E%3Cline x1='400' y1='0' x2='400' y2='400'/%3E%3Cline x1='600' y1='0' x2='600' y2='400'/%3E%3Cline x1='0' y1='100' x2='800' y2='100'/%3E%3Cline x1='0' y1='200' x2='800' y2='200'/%3E%3Cline x1='0' y1='300' x2='800' y2='300'/%3E%3C/g%3E%3Ctext x='20' y='30' fill='%2364748b' font-size='14' font-family='monospace'%3EICU Floor 1 - 40m x 20m%3C/text%3E%3C/svg%3E"
            bounds={bounds}
          />

          {/* Geofences */}
          {showGeofences && mockGeofences.map((gf) => (
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
          {showAnchors && anchors.map((anchor) => (
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
                    <Badge variant="outline" className="text-xs">{anchor.tech}</Badge>
                  </div>
                  {anchor.rssi && <div className="text-muted-foreground">RSSI: {anchor.rssi} dBm</div>}
                  {anchor.snr && <div className="text-muted-foreground">SNR: {anchor.snr} dB</div>}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Tags */}
          {showTags && tagPositions.map((tag) => (
            <Marker
              key={tag.id}
              position={[tag.position.y, tag.position.x]}
              icon={tagIcon('online')}
              eventHandlers={{
                click: () => setSelectedEntity({ type: 'tag', id: tag.id }),
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-semibold">{tag.label}</div>
                  <Badge variant="outline" className="text-xs">{tag.tech}</Badge>
                  <div className="text-muted-foreground">Battery: {tag.batteryPct}%</div>
                  {tag.sensors.hr && <div className="text-muted-foreground">HR: {tag.sensors.hr} bpm</div>}
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
              Tags ({tags.length})
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
              <div className="font-mono text-lg">{anchors.filter((a) => a.status === 'online').length}/{anchors.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tags</div>
              <div className="font-mono text-lg">{tags.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Zones</div>
              <div className="font-mono text-lg">{mockGeofences.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Entity Details Drawer (placeholder) */}
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
              {selectedEntity.type === 'anchor' ? 'Anchor' : 'Tag'} Details
            </div>
            <div className="text-muted-foreground">
              ID: {selectedEntity.id}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
