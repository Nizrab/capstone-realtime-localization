import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Search, X, Wifi, Radio, Tag, Eye, EyeOff, Layers, MapPin } from 'lucide-react';
import { fetchPositions, fetchAnchors, type APIPosition, type APIAnchor } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

// ─── Floor / Building config ────────────────────────────────────
interface FloorConfig {
  id: string;
  label: string;
  floor: number;
  widthMeters: number;
  heightMeters: number;
}

const BUILDING = { campus: 'Facility', building: 'Main Building' };

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

const makeFloorSvg = (floor: FloorConfig) => {
  const w = floor.widthMeters * 20;
  const h = floor.heightMeters * 20;
  return `data:image/svg+xml,${encodeURIComponent(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="#f8fafc"/><rect width="${w}" height="${h}" stroke="#334155" stroke-width="3" fill="none" stroke-dasharray="8 4"/><text x="${w / 2}" y="${h / 2 - 10}" fill="#94a3b8" font-size="16" font-family="sans-serif" text-anchor="middle">${floor.label}</text></svg>`)}`;
};

function MapController({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [20, 20], animate: true });
  }, [map, bounds]);
  return null;
}

export default function LiveMap() {
  const isMobile = useIsMobile();
  const [floors, setFloors] = useState<FloorConfig[]>([]);
  const [devices, setDevices] = useState<MapDevice[]>([]);
  const [enabledFloors, setEnabledFloors] = useState<Set<string>>(new Set());
  const [showAnchors, setShowAnchors] = useState(true);
  const [showRogues, setShowRogues] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showNames, setShowNames] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MapDevice | null>(null);
  const [apiStatus, setApiStatus] = useState<'connected' | 'error' | 'loading'>('loading');
  const [showFloorSheet, setShowFloorSheet] = useState(false);
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);
  const initialLoadDone = useRef(false);

  const pollData = useCallback(async () => {
    try {
      const [positions, apiAnchors] = await Promise.all([fetchPositions(), fetchAnchors()]);
      const floorIds = new Set<string>();
      positions.forEach((p) => floorIds.add(p.floor_id));

      const dynamicFloors: FloorConfig[] = Array.from(floorIds).sort().map((fid, i) => ({
        id: fid,
        label: fid.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        floor: i + 1,
        widthMeters: 20,
        heightMeters: 15,
      }));

      const tagDevices: MapDevice[] = positions.map((p) => ({
        id: p.device_id, label: p.device_id, type: 'tag' as const,
        floorId: p.floor_id, room: p.room_id || '—',
        position: { x: p.x, y: p.y }, status: 'online' as const,
        tech: 'Wi-Fi RSSI', lastSeen: p.timestamp,
      }));

      const defaultFloor = dynamicFloors[0]?.id || 'default';
      const anchorDevices: MapDevice[] = apiAnchors.map((a, i) => ({
        id: a.id, label: a.label, type: 'anchor' as const,
        floorId: defaultFloor, room: '—',
        position: { x: 2 + (i % 5) * 4, y: 2 + Math.floor(i / 5) * 4 },
        status: (a.status as MapDevice['status']) || 'online',
        tech: a.tech || 'Wi-Fi', lastSeen: a.lastSeen,
      }));

      setFloors(dynamicFloors);
      setDevices([...anchorDevices, ...tagDevices]);
      setApiStatus('connected');

      if (!initialLoadDone.current && dynamicFloors.length > 0) {
        setEnabledFloors(new Set(dynamicFloors.map((f) => f.id)));
        initialLoadDone.current = true;
      }
    } catch {
      setApiStatus('error');
    }
  }, []);

  useEffect(() => {
    pollData();
    const interval = setInterval(pollData, 3000);
    return () => clearInterval(interval);
  }, [pollData]);

  const toggleFloor = useCallback((floorId: string) => {
    setEnabledFloors((prev) => {
      const next = new Set(prev);
      if (next.has(floorId)) next.delete(floorId); else next.add(floorId);
      return next;
    });
  }, []);

  const visibleDevices = useMemo(() => {
    return devices.filter((d) => {
      if (!enabledFloors.has(d.floorId)) return false;
      if (d.type === 'anchor' && !showAnchors) return false;
      if (d.type === 'rogue' && !showRogues) return false;
      if (d.type === 'tag' && !showTags) return false;
      return true;
    });
  }, [devices, enabledFloors, showAnchors, showRogues, showTags]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) { setSearchResult(null); return; }
    const q = searchQuery.toLowerCase();
    const match = devices.find((d) => d.id.toLowerCase().includes(q) || d.label.toLowerCase().includes(q));
    setSearchResult(match || null);
    if (match && !enabledFloors.has(match.floorId)) {
      setEnabledFloors((prev) => new Set(prev).add(match.floorId));
    }
  }, [searchQuery, devices, enabledFloors]);

  const activeBounds = useMemo(() => {
    const activeFloors = floors.filter((f) => enabledFloors.has(f.id));
    if (activeFloors.length === 0) return L.latLngBounds([0, 0], [30, 40]);
    const maxW = Math.max(...activeFloors.map((f) => f.widthMeters));
    const totalH = activeFloors.reduce((sum, f) => sum + f.heightMeters + 5, 0);
    return L.latLngBounds([0, 0], [totalH, maxW]);
  }, [floors, enabledFloors]);

  const floorOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let y = 0;
    floors.forEach((f) => {
      if (enabledFloors.has(f.id)) { offsets[f.id] = y; y += f.heightMeters + 5; }
    });
    return offsets;
  }, [floors, enabledFloors]);

  const mapCenter: [number, number] = useMemo(() => {
    const totalH = Object.values(floorOffsets).length > 0 ? Math.max(...Object.values(floorOffsets)) + 30 : 15;
    return [totalH / 2, 20];
  }, [floorOffsets]);

  return (
    <div className="h-[calc(100vh-3.5rem)] md:h-full flex relative">
      {/* LEFT PANEL - desktop only */}
      <div className="hidden md:flex w-48 border-r border-border bg-card p-3 flex-col gap-3 overflow-y-auto shrink-0">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{BUILDING.campus}</div>
        <div className="text-sm font-semibold text-foreground">{BUILDING.building}</div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-block w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-[hsl(var(--status-online))]' : apiStatus === 'error' ? 'bg-destructive' : 'bg-muted-foreground animate-pulse'}`} />
          <span className="text-muted-foreground">{apiStatus === 'connected' ? 'API Connected' : apiStatus === 'error' ? 'API Error' : 'Connecting…'}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="text-xs text-muted-foreground font-medium mb-1">Floors</div>
        {floors.length === 0 && <div className="text-xs text-muted-foreground italic">Waiting for data…</div>}
        {floors.map((f) => {
          const isEnabled = enabledFloors.has(f.id);
          const deviceCount = devices.filter((d) => d.floorId === f.id).length;
          return (
            <button key={f.id} onClick={() => toggleFloor(f.id)} className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${isEnabled ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary'}`}>
              <span className="font-medium">{f.label}</span>
              <Badge variant="outline" className="text-[10px] h-5">{deviceCount}</Badge>
            </button>
          );
        })}
      </div>

      {/* MAP */}
      <div className="flex-1 relative min-w-0">
        {/* Mobile floating search */}
        <div className="absolute top-3 left-3 right-3 md:hidden z-[1000]">
          <div className="flex gap-1">
            <Input placeholder="Search device…" className="h-8 text-xs bg-card/90 backdrop-blur" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0 bg-card/90" onClick={handleSearch}><Search className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        <MapContainer center={mapCenter} zoom={1} className="h-full w-full bg-background" crs={L.CRS.Simple} minZoom={-1} maxZoom={5} zoomControl={!isMobile}>
          <MapController bounds={activeBounds} />
          {floors.filter((f) => enabledFloors.has(f.id)).map((floor) => {
            const yOff = floorOffsets[floor.id] ?? 0;
            const bounds = L.latLngBounds([yOff, 0], [yOff + floor.heightMeters, floor.widthMeters]);
            return <ImageOverlay key={floor.id} url={makeFloorSvg(floor)} bounds={bounds} />;
          })}
          {visibleDevices.map((device) => {
            const yOff = floorOffsets[device.floorId] ?? 0;
            const isPinged = searchResult?.id === device.id;
            return (
              <Marker key={device.id} position={[yOff + device.position.y, device.position.x]} icon={makeIcon(device.type, device.status, isPinged)}>
                <Popup>
                  <div className="text-xs space-y-1">
                    <div className="font-semibold">{device.label}</div>
                    <div className="text-muted-foreground">{device.id}</div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-[hsl(var(--status-online))]' : device.status === 'offline' ? 'bg-[hsl(var(--status-offline))]' : 'bg-[hsl(var(--status-degraded))]'}`} />
                      <span className="capitalize">{device.status}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{device.tech}</Badge>
                    <div className="text-muted-foreground">Room: {device.room}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {showNames && visibleDevices.map((device) => {
            const yOff = floorOffsets[device.floorId] ?? 0;
            return (
              <Marker key={`lbl-${device.id}`} position={[yOff + device.position.y + 1.2, device.position.x]} icon={L.divIcon({ className: 'device-label', html: `<div class="text-[9px] font-mono text-foreground bg-card/80 px-1 rounded whitespace-nowrap">${device.label}</div>`, iconSize: [80, 14], iconAnchor: [40, 7] })} interactive={false} />
            );
          })}
        </MapContainer>

        {devices.length === 0 && apiStatus !== 'error' && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
            <div className="text-muted-foreground text-sm animate-pulse">Waiting for data…</div>
          </div>
        )}

        {searchResult && (
          <Card className="absolute bottom-4 left-4 p-3 max-w-xs z-[1000]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Search Result</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setSearchResult(null); setSearchQuery(''); }}><X className="h-3 w-3" /></Button>
            </div>
            <div className="text-xs space-y-1">
              <div className="font-mono font-semibold text-primary">{searchResult.label}</div>
              <div className="text-muted-foreground">Floor: {floors.find((f) => f.id === searchResult.floorId)?.floor ?? '—'}, Room {searchResult.room}</div>
            </div>
          </Card>
        )}

        {/* Mobile floating floor button */}
        <Button className="absolute bottom-4 right-4 md:hidden z-[1000] rounded-full h-12 w-12 p-0 shadow-lg" onClick={() => setShowFloorSheet(!showFloorSheet)}>
          <MapPin className="h-5 w-5" />
        </Button>

        {/* Mobile floating layer button */}
        <Button variant="outline" className="absolute top-3 right-3 md:hidden z-[1000] rounded-full h-10 w-10 p-0 shadow-lg bg-card/90" onClick={() => setShowLayerDropdown(!showLayerDropdown)}>
          <Layers className="h-4 w-4" />
        </Button>

        {/* Mobile floor bottom sheet */}
        {isMobile && showFloorSheet && (
          <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-card border-t border-border rounded-t-xl p-4 max-h-[50vh] overflow-y-auto shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
            <div className="text-xs text-muted-foreground font-medium mb-2">Floors</div>
            <div className="space-y-2">
              {floors.map((f) => {
                const isEnabled = enabledFloors.has(f.id);
                const deviceCount = devices.filter((d) => d.floorId === f.id).length;
                return (
                  <button key={f.id} onClick={() => toggleFloor(f.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${isEnabled ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary/50 text-muted-foreground border border-border'}`}>
                    <span className="font-medium">{f.label}</span>
                    <Badge variant="outline" className="text-[10px] h-5">{deviceCount}</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile layer dropdown */}
        {isMobile && showLayerDropdown && (
          <div className="absolute top-14 right-3 z-[1001] bg-card border border-border rounded-lg p-3 shadow-2xl w-48">
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm"><Wifi className="h-4 w-4 text-primary" /><span>Anchors</span></div>
                <Switch checked={showAnchors} onCheckedChange={setShowAnchors} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4 text-destructive" /><span>Rogues</span></div>
                <Switch checked={showRogues} onCheckedChange={setShowRogues} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-chart-2" /><span>Tags</span></div>
                <Switch checked={showTags} onCheckedChange={setShowTags} />
              </label>
              <div className="h-px bg-border" />
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 text-sm">{showNames ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}<span>Names</span></div>
                <Switch checked={showNames} onCheckedChange={setShowNames} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - desktop only */}
      <div className="hidden md:flex w-64 border-l border-border bg-card p-4 flex-col gap-4 overflow-y-auto shrink-0">
        <div>
          <div className="text-xs text-muted-foreground font-medium mb-2">Search Devices</div>
          <div className="flex gap-1">
            <Input placeholder="ID or name…" className="h-8 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={handleSearch}><Search className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="text-xs text-muted-foreground font-medium">Layers</div>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm"><Wifi className="h-4 w-4 text-primary" /><span>Anchors</span></div>
          <Switch checked={showAnchors} onCheckedChange={setShowAnchors} />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm"><Radio className="h-4 w-4 text-destructive" /><span>Rogues</span></div>
          <Switch checked={showRogues} onCheckedChange={setShowRogues} />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm"><Tag className="h-4 w-4 text-chart-2" /><span>Tags</span></div>
          <Switch checked={showTags} onCheckedChange={setShowTags} />
        </label>
        <div className="h-px bg-border" />
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2 text-sm">{showNames ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}<span>Names</span></div>
          <Switch checked={showNames} onCheckedChange={setShowNames} />
        </label>
      </div>
    </div>
  );
}
