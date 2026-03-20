import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X, Wifi, Radio, Tag, Eye, EyeOff } from 'lucide-react';

// ─── Floor / Building config ────────────────────────────────────
interface FloorConfig {
  id: string;
  label: string;
  floor: number;
  widthMeters: number;
  heightMeters: number;
}

const BUILDING = {
  campus: 'Carleton University',
  building: 'Azrieli Pavilion (AP)',
};

const FLOORS: FloorConfig[] = [
  { id: 'ap-1', label: 'Floor 1', floor: 1, widthMeters: 60, heightMeters: 30 },
  { id: 'ap-2', label: 'Floor 2', floor: 2, widthMeters: 60, heightMeters: 30 },
  { id: 'ap-3', label: 'Floor 3', floor: 3, widthMeters: 60, heightMeters: 30 },
  { id: 'ap-4', label: 'Floor 4', floor: 4, widthMeters: 60, heightMeters: 30 },
];

// ─── Static device types ────────────────────────────────────────
interface MapDevice {
  id: string;
  label: string;
  type: 'anchor' | 'rogue' | 'tag';
  floorId: string;
  room: string;
  position: { x: number; y: number };
  status: 'online' | 'offline' | 'degraded';
  tech: string;
  lastSeen: string;
}

// Devices will be populated from backend API
const STATIC_DEVICES: MapDevice[] = [];

// ─── Icons ──────────────────────────────────────────────────────
const makeIcon = (type: MapDevice['type'], status: string, isPinged: boolean) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    anchor: { bg: 'bg-primary/20', border: 'border-primary', text: 'text-primary' },
    rogue: { bg: 'bg-destructive/20', border: 'border-destructive', text: 'text-destructive' },
    tag: { bg: 'bg-chart-2/20', border: 'border-chart-2', text: 'text-chart-2' },
  };
  const c = colors[type];
  const letter = type === 'anchor' ? 'A' : type === 'rogue' ? 'R' : 'T';
  const size = type === 'tag' ? 16 : 24;
  const pingClass = isPinged ? 'ring-2 ring-destructive animate-ping-slow' : '';
  const offlineOpacity = status === 'offline' ? 'opacity-40' : '';

  return L.divIcon({
    className: 'custom-map-icon',
    html: `<div class="w-${size === 16 ? 4 : 6} h-${size === 16 ? 4 : 6} rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${c.bg} ${c.border} ${c.text} ${pingClass} ${offlineOpacity}" style="width:${size}px;height:${size}px;">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Floor SVG generators (placeholder until AWS API connected) ──
const makeFloorSvg = (floor: FloorConfig) => {
  const w = floor.widthMeters * 20;
  const h = floor.heightMeters * 20;
  return `data:image/svg+xml,${encodeURIComponent(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="#f8fafc"/><rect width="${w}" height="${h}" stroke="#334155" stroke-width="3" fill="none" stroke-dasharray="8 4"/><text x="${w/2}" y="${h/2 - 10}" fill="#94a3b8" font-size="16" font-family="sans-serif" text-anchor="middle">Awaiting AWS API</text><text x="${w/2}" y="${h/2 + 14}" fill="#cbd5e1" font-size="12" font-family="sans-serif" text-anchor="middle">${floor.label}</text></svg>`)}`;
};

// ─── Map controller ─────────────────────────────────────────────
function MapController({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20], animate: true });
  }, [map, bounds]);
  return null;
}

// ─── Main component ─────────────────────────────────────────────
export default function LiveMap() {
  const [enabledFloors, setEnabledFloors] = useState<Set<string>>(new Set(['ap-1']));
  const [showAnchors, setShowAnchors] = useState(true);
  const [showRogues, setShowRogues] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MapDevice | null>(null);

  const toggleFloor = useCallback((floorId: string) => {
    setEnabledFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floorId)) next.delete(floorId);
      else next.add(floorId);
      return next;
    });
  }, []);

  // Visible devices based on enabled floors + layer toggles
  const visibleDevices = useMemo(() => {
    return STATIC_DEVICES.filter((d) => {
      if (!enabledFloors.has(d.floorId)) return false;
      if (d.type === 'anchor' && !showAnchors) return false;
      if (d.type === 'rogue' && !showRogues) return false;
      if (d.type === 'tag' && !showTags) return false;
      return true;
    });
  }, [enabledFloors, showAnchors, showRogues, showTags]);

  // Search handler
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) { setSearchResult(null); return; }
    const q = searchQuery.toLowerCase();
    const match = STATIC_DEVICES.find(
      (d) => d.id.toLowerCase().includes(q) || d.label.toLowerCase().includes(q)
    );
    setSearchResult(match || null);
    // Auto-enable the floor if found
    if (match && !enabledFloors.has(match.floorId)) {
      setEnabledFloors((prev) => new Set(prev).add(match.floorId));
    }
  }, [searchQuery, enabledFloors]);

  // Combined bounds across all enabled floors
  const activeBounds = useMemo(() => {
    const activeFloors = FLOORS.filter((f) => enabledFloors.has(f.id));
    if (activeFloors.length === 0) return L.latLngBounds([0, 0], [30, 60]);
    const maxW = Math.max(...activeFloors.map((f) => f.widthMeters));
    const totalH = activeFloors.reduce((sum, f) => sum + f.heightMeters + 5, 0);
    return L.latLngBounds([0, 0], [totalH, maxW]);
  }, [enabledFloors]);

  // Compute vertical offset per floor for stacking
  const floorOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let y = 0;
    FLOORS.forEach((f) => {
      if (enabledFloors.has(f.id)) {
        offsets[f.id] = y;
        y += f.heightMeters + 5;
      }
    });
    return offsets;
  }, [enabledFloors]);

  const mapCenter: [number, number] = useMemo(() => {
    const totalH = Object.values(floorOffsets).length > 0
      ? Math.max(...Object.values(floorOffsets)) + 30
      : 15;
    return [totalH / 2, 30];
  }, [floorOffsets]);

  return (
    <div className="h-full flex">
      {/* LEFT PANEL – Floor Selector */}
      <div className="w-48 border-r border-border bg-card p-3 flex flex-col gap-3 overflow-y-auto shrink-0">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{BUILDING.campus}</div>
        <div className="text-sm font-semibold text-foreground">{BUILDING.building}</div>
        <div className="h-px bg-border" />
        <div className="text-xs text-muted-foreground font-medium mb-1">Floors</div>
        {FLOORS.map((f) => {
          const isEnabled = enabledFloors.has(f.id);
          const deviceCount = STATIC_DEVICES.filter((d) => d.floorId === f.id).length;
          return (
            <button
              key={f.id}
              onClick={() => toggleFloor(f.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                isEnabled
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary'
              }`}
            >
              <span className="font-medium">{f.label}</span>
              <Badge variant="outline" className="text-[10px] h-5">{deviceCount}</Badge>
            </button>
          );
        })}
      </div>

      {/* MAP */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={1}
          className="h-full w-full bg-background"
          crs={L.CRS.Simple}
          minZoom={-1}
          maxZoom={5}
          zoomControl={true}
        >
          <MapController bounds={activeBounds} />

          {/* Render each enabled floor stacked vertically */}
          {FLOORS.filter((f) => enabledFloors.has(f.id)).map((floor) => {
            const yOff = floorOffsets[floor.id] ?? 0;
            const bounds = L.latLngBounds(
              [yOff, 0],
              [yOff + floor.heightMeters, floor.widthMeters]
            );
            return (
              <ImageOverlay key={floor.id} url={makeFloorSvg(floor)} bounds={bounds} />
            );
          })}

          {/* Devices */}
          {visibleDevices.map((device) => {
            const yOff = floorOffsets[device.floorId] ?? 0;
            const isPinged = searchResult?.id === device.id;
            return (
              <Marker
                key={device.id}
                position={[yOff + device.position.y, device.position.x]}
                icon={makeIcon(device.type, device.status, isPinged)}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{device.label}</div>
                    <div className="text-muted-foreground">{device.id}</div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        device.status === 'online' ? 'bg-[hsl(var(--status-online))]'
                        : device.status === 'offline' ? 'bg-[hsl(var(--status-offline))]'
                        : 'bg-[hsl(var(--status-degraded))]'
                      }`} />
                      <span className="capitalize">{device.status}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{device.tech}</Badge>
                    <div className="text-muted-foreground">Room: {device.room}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Name labels (tooltip-style) */}
          {showNames && visibleDevices.map((device) => {
            const yOff = floorOffsets[device.floorId] ?? 0;
            return (
              <Marker
                key={`lbl-${device.id}`}
                position={[yOff + device.position.y + 1.2, device.position.x]}
                icon={L.divIcon({
                  className: 'device-label',
                  html: `<div class="text-[9px] font-mono text-foreground bg-card/80 px-1 rounded whitespace-nowrap">${device.label}</div>`,
                  iconSize: [80, 14],
                  iconAnchor: [40, 7],
                })}
                interactive={false}
              />
            );
          })}
        </MapContainer>

        {/* Search result overlay */}
        {searchResult && (
          <Card className="absolute bottom-4 left-4 p-3 max-w-xs z-[1000]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Search Result</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setSearchResult(null); setSearchQuery(''); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-mono font-semibold text-primary">{searchResult.label}</div>
              <div className="text-muted-foreground">
                Floor: {FLOORS.find((f) => f.id === searchResult.floorId)?.floor}, Room {searchResult.room}
              </div>
              <div className="text-muted-foreground font-mono">
                since {new Date().toLocaleDateString('en-CA')} – {new Date().toLocaleTimeString('en-US', { hour12: false })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* RIGHT PANEL – Layer Controls */}
      <div className="w-64 border-l border-border bg-card p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
        {/* Search */}
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-2">Search Devices</div>
          <div className="flex gap-1">
            <Input
              placeholder="ID or name…"
              className="h-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Layer toggles */}
        <div className="text-xs text-muted-foreground font-medium">Layers</div>

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <Wifi className="h-4 w-4 text-primary" />
            <span>Anchors</span>
          </div>
          <Switch checked={showAnchors} onCheckedChange={setShowAnchors} />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <Radio className="h-4 w-4 text-destructive" />
            <span>Rogues</span>
          </div>
          <Switch checked={showRogues} onCheckedChange={setShowRogues} />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-chart-2" />
            <span>Tags</span>
          </div>
          <Switch checked={showTags} onCheckedChange={setShowTags} />
        </label>

        <div className="h-px bg-border" />

        {/* Show names toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">
            {showNames ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span>Names</span>
          </div>
          <Switch checked={showNames} onCheckedChange={setShowNames} />
        </label>

        <div className="h-px bg-border" />

        {/* Stats */}
        <div className="text-xs text-muted-foreground font-medium">Stats</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-mono text-lg text-foreground">
              {visibleDevices.filter((d) => d.type === 'anchor').length}
            </div>
            <div className="text-muted-foreground">Anchors</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-lg text-destructive">
              {visibleDevices.filter((d) => d.type === 'rogue').length}
            </div>
            <div className="text-muted-foreground">Rogues</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-lg text-chart-2">
              {visibleDevices.filter((d) => d.type === 'tag').length}
            </div>
            <div className="text-muted-foreground">Tags</div>
          </div>
        </div>
      </div>
    </div>
  );
}
