import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRTLSStore } from '@/store/useRTLSStore';
import { fetchAnchors, fetchTags, type APIAnchor, type APITag } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Search, Download, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Anchor, Tag } from '@/types/rtls';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface NetworkDevice {
  id: string;
  label: string;
  ip: string;
  mac: string;
  status: string;
  lastSeen: string;
}

function mapAPIAnchor(a: APIAnchor): Anchor {
  return {
    id: a.id,
    label: a.label,
    tech: (a.tech as Anchor['tech']) || 'WIFI_RTT',
    position: { x: 0, y: 0 },
    firmware: a.firmware || '—',
    status: (a.status as Anchor['status']) || 'online',
    rssi: a.rssi ?? undefined,
    lastSeen: a.lastSeen || new Date().toISOString(),
  };
}

function mapAPITag(t: APITag): Tag {
  return {
    id: t.id,
    label: t.label,
    tech: (t.tech as Tag['tech']) || 'WIFI_RTT',
    batteryPct: t.batteryPct ?? 100,
    sensors: {},
    firmware: t.firmware || '—',
    lastSeen: t.lastSeen || new Date().toISOString(),
    position: t.position,
    status: t.status,
  };
}

export default function Inventory() {
  const { anchors, tags, setAnchors, setTags } = useRTLSStore();
  const { hasRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [anchorSearch, setAnchorSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [networkSearch, setNetworkSearch] = useState('');
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [apiAnchors, apiTags] = await Promise.all([fetchAnchors(), fetchTags()]);
      setAnchors(apiAnchors.map(mapAPIAnchor));
      setTags(apiTags.map(mapAPITag));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [setAnchors, setTags]);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadData]);

  const fetchNetworkDevices = useCallback(async () => {
    if (!API_BASE_URL) {
      setNetworkError('API URL not configured');
      return;
    }
    setNetworkLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/devices/network`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNetworkDevices(data.devices || []);
      setNetworkError(null);
    } catch (err: any) {
      setNetworkError(err.message || 'Failed to fetch');
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  const urlTab = searchParams.get('tab');
  const urlHighlight = searchParams.get('highlight');
  const [activeTab, setActiveTab] = useState(urlTab || 'anchors');

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
    if (urlHighlight) {
      setHighlightId(urlHighlight);
      const timeout = setTimeout(() => setHighlightId(null), 3000);
      setSearchParams({}, { replace: true });
      return () => clearTimeout(timeout);
    }
  }, [urlTab, urlHighlight, setSearchParams]);

  useEffect(() => {
    if (activeTab !== 'network' || !hasRole('admin')) return;
    fetchNetworkDevices();
    const interval = setInterval(fetchNetworkDevices, 5000);
    return () => clearInterval(interval);
  }, [activeTab, hasRole, fetchNetworkDevices]);

  const filteredAnchors = anchors.filter(
    (a) =>
      a.label.toLowerCase().includes(anchorSearch.toLowerCase()) ||
      a.id.toLowerCase().includes(anchorSearch.toLowerCase())
  );

  const filteredTags = tags.filter(
    (t) =>
      t.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const filteredNetwork = networkDevices.filter(
    (d) =>
      d.id.toLowerCase().includes(networkSearch.toLowerCase()) ||
      d.label.toLowerCase().includes(networkSearch.toLowerCase()) ||
      d.ip.toLowerCase().includes(networkSearch.toLowerCase()) ||
      d.mac.toLowerCase().includes(networkSearch.toLowerCase())
  );

  const isAdmin = hasRole('admin');

  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (activeTab === 'anchors') {
      csvContent = 'ID,Label,Technology,Status,RSSI,Firmware,Last Seen\n';
      anchors.forEach((a) => {
        csvContent += `${a.id},${a.label},${a.tech},${a.status},${a.rssi ?? ''},${a.firmware},${new Date(a.lastSeen).toLocaleString()}\n`;
      });
      filename = 'anchors.csv';
    } else if (activeTab === 'tags') {
      csvContent = 'ID,Label,Technology,Status,Position X,Position Y,Floor,Room,Confidence,Firmware,Last Seen\n';
      tags.forEach((t) => {
        csvContent += `${t.id},${t.label},${t.tech},${t.status ?? ''},${t.position?.x ?? ''},${t.position?.y ?? ''},,,,${t.firmware},${new Date(t.lastSeen).toLocaleString()}\n`;
      });
      filename = 'tags.csv';
    } else if (activeTab === 'network') {
      csvContent = 'ID,Label,IP Address,MAC Address,Status,Last Seen\n';
      networkDevices.forEach((d) => {
        csvContent += `${d.id},${d.label},${d.ip},${d.mac},${d.status},${new Date(d.lastSeen).toLocaleString()}\n`;
      });
      filename = 'network_devices.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor all anchors, tags, and devices
          </p>
          {error && (
            <p className="text-destructive text-xs mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="anchors">
            Anchors ({anchors.length})
          </TabsTrigger>
          <TabsTrigger value="tags">
            Tags ({tags.length})
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="network">
              <Wifi className="h-3.5 w-3.5 mr-1.5" />
              Network
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="anchors" className="space-y-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anchors..."
              value={anchorSearch}
              onChange={(e) => setAnchorSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Anchors ({filteredAnchors.length})
                {loading && <Badge variant="outline" className="ml-2 text-xs animate-pulse">Updating…</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAnchors.length === 0 && !loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {error ? 'Unable to fetch anchors. Check API configuration.' : 'No anchors found. Waiting for API data…'}
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full text-xs md:text-sm min-w-[600px]">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-muted-foreground">ID</th>
                        <th className="pb-3 font-medium text-muted-foreground">Label</th>
                        <th className="pb-3 font-medium text-muted-foreground">Technology</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">RSSI</th>
                        <th className="pb-3 font-medium text-muted-foreground">Firmware</th>
                        <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnchors.map((anchor) => (
                        <tr
                          key={anchor.id}
                          id={`row-${anchor.id}`}
                          className={cn(
                            "border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors duration-500",
                            highlightId === anchor.id && "bg-primary/15 ring-1 ring-primary/30"
                          )}
                          ref={highlightId === anchor.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                        >
                          <td className="py-3 font-mono text-xs">{anchor.id}</td>
                          <td className="py-3 font-medium">{anchor.label}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-xs">
                              {anchor.tech}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={anchor.status} />
                          </td>
                          <td className="py-3 font-mono text-xs">{anchor.rssi ?? '—'}</td>
                          <td className="py-3 font-mono text-xs">{anchor.firmware}</td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(anchor.lastSeen).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Tags ({filteredTags.length})
                {loading && <Badge variant="outline" className="ml-2 text-xs animate-pulse">Updating…</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTags.length === 0 && !loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {error ? 'Unable to fetch tags. Check API configuration.' : 'No tags found. Waiting for API data…'}
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full text-xs md:text-sm min-w-[700px]">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-muted-foreground">ID</th>
                        <th className="pb-3 font-medium text-muted-foreground">Label</th>
                        <th className="pb-3 font-medium text-muted-foreground">Technology</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">Position</th>
                        <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                        <th className="pb-3 font-medium text-muted-foreground">Firmware</th>
                        <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTags.map((tag) => (
                        <tr
                          key={tag.id}
                          id={`row-${tag.id}`}
                          className={cn(
                            "border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors duration-500",
                            highlightId === tag.id && "bg-primary/15 ring-1 ring-primary/30"
                          )}
                          ref={highlightId === tag.id ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : undefined}
                        >
                          <td className="py-3 font-mono text-xs">{tag.id}</td>
                          <td className="py-3 font-medium">{tag.label}</td>
                          <td className="py-3">
                            <Badge variant="outline" className="text-xs">
                              {tag.tech}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={(tag.status as any) || 'online'} />
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {tag.position ? `(${tag.position.x.toFixed(1)}, ${tag.position.y.toFixed(1)})` : '—'}
                          </td>
                          <td className="py-3 font-mono text-xs">—</td>
                          <td className="py-3 font-mono text-xs">{tag.firmware}</td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(tag.lastSeen).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="network" className="space-y-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, IP, or MAC..."
                value={networkSearch}
                onChange={(e) => setNetworkSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Network Devices ({filteredNetwork.length})
                  {networkLoading && (
                    <Badge variant="outline" className="text-xs animate-pulse">Fetching…</Badge>
                  )}
                  {networkError && (
                    <Badge variant="destructive" className="text-xs">{networkError}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredNetwork.length === 0 && !networkLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {networkError
                      ? 'Unable to fetch network devices. Check API configuration.'
                      : 'No network devices found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr className="text-left">
                          <th className="pb-3 font-medium text-muted-foreground">ID</th>
                          <th className="pb-3 font-medium text-muted-foreground">Label</th>
                          <th className="pb-3 font-medium text-muted-foreground">IP Address</th>
                          <th className="pb-3 font-medium text-muted-foreground">MAC Address</th>
                          <th className="pb-3 font-medium text-muted-foreground">Status</th>
                          <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNetwork.map((device) => (
                          <tr
                            key={device.id}
                            className="border-b border-border last:border-0 hover:bg-muted/50"
                          >
                            <td className="py-3 font-mono text-xs">{device.id}</td>
                            <td className="py-3 font-medium">{device.label}</td>
                            <td className="py-3 font-mono text-xs">{device.ip}</td>
                            <td className="py-3 font-mono text-xs uppercase">{device.mac}</td>
                            <td className="py-3">
                              <StatusBadge status={device.status as any} />
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {new Date(device.lastSeen).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
