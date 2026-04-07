import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRTLSStore } from '@/store/useRTLSStore';
import { fetchAnchors, fetchTags, type APIAnchor, type APITag } from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import { Search, Download, Wifi, RefreshCw, Radio, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Anchor, Tag } from '@/types/rtls';

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

function getRssiColor(rssi: number): string {
  if (rssi > -60) return 'text-green-400';
  if (rssi > -80) return 'text-yellow-400';
  return 'text-red-400';
}

function getRssiBgColor(rssi: number): string {
  if (rssi > -60) return 'bg-green-500/10 border-green-500/20';
  if (rssi > -80) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export default function Inventory() {
  const { anchors, tags, setAnchors, setTags } = useRTLSStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [anchorSearch, setAnchorSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [rfSearch, setRfSearch] = useState('');
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

  // RF Environment filtered data
  const rfSearchLower = rfSearch.toLowerCase();
  const rfFilteredAnchors = anchors.filter(
    (a) =>
      a.label.toLowerCase().includes(rfSearchLower) ||
      a.id.toLowerCase().includes(rfSearchLower) ||
      String(a.rssi ?? '').includes(rfSearchLower)
  );
  const rfFilteredTags = tags.filter(
    (t) =>
      t.label.toLowerCase().includes(rfSearchLower) ||
      t.id.toLowerCase().includes(rfSearchLower)
  );

  // RF stats
  const onlineAnchors = anchors.filter((a) => a.status === 'online').length;
  const anchorsWithRssi = anchors.filter((a) => a.rssi != null);
  const avgRssi = anchorsWithRssi.length > 0
    ? Math.round(anchorsWithRssi.reduce((sum, a) => sum + (a.rssi ?? 0), 0) / anchorsWithRssi.length)
    : null;

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
      csvContent = 'ID,Label,Technology,Status,Position X,Position Y,Firmware,Last Seen\n';
      tags.forEach((t) => {
        csvContent += `${t.id},${t.label},${t.tech},${t.status ?? ''},${t.position?.x ?? ''},${t.position?.y ?? ''},${t.firmware},${new Date(t.lastSeen).toLocaleString()}\n`;
      });
      filename = 'tags.csv';
    } else if (activeTab === 'rf') {
      csvContent = 'Type,ID,Label,Status,RSSI,Last Seen\n';
      anchors.forEach((a) => {
        csvContent += `AP,${a.id},${a.label},${a.status},${a.rssi ?? ''},${new Date(a.lastSeen).toLocaleString()}\n`;
      });
      tags.forEach((t) => {
        csvContent += `Device,${t.id},${t.label},${t.status ?? ''},,${new Date(t.lastSeen).toLocaleString()}\n`;
      });
      filename = 'rf_environment.csv';
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
          <TabsTrigger value="rf">
            <Wifi className="h-3.5 w-3.5 mr-1.5" />
            RF Environment
          </TabsTrigger>
        </TabsList>

        {/* Anchors Tab */}
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
                            <Badge variant="outline" className="text-xs">{anchor.tech}</Badge>
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

        {/* Tags Tab */}
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
                            <Badge variant="outline" className="text-xs">{tag.tech}</Badge>
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

        {/* RF Environment Tab */}
        <TabsContent value="rf" className="space-y-4">
          {/* Network Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Active APs</span>
                </div>
                <div className="text-2xl font-bold font-mono">
                  {onlineAnchors}<span className="text-sm text-muted-foreground font-normal">/{anchors.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TagIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tracked Devices</span>
                </div>
                <div className="text-2xl font-bold font-mono">{tags.length}</div>
              </CardContent>
            </Card>
            <Card className={cn("border", avgRssi !== null && getRssiBgColor(avgRssi))}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Signal</span>
                </div>
                <div className={cn("text-2xl font-bold font-mono", avgRssi !== null ? getRssiColor(avgRssi) : 'text-muted-foreground')}>
                  {avgRssi !== null ? `${avgRssi} dBm` : '—'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search APs or devices by name, ID, or RSSI..."
              value={rfSearch}
              onChange={(e) => setRfSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* System Access Points */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Radio className="h-4 w-4" />
                System Access Points ({rfFilteredAnchors.length})
                {loading && <Badge variant="outline" className="ml-2 text-xs animate-pulse">Updating…</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rfFilteredAnchors.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No access points found.</div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full text-xs md:text-sm min-w-[500px]">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-muted-foreground">AP Name</th>
                        <th className="pb-3 font-medium text-muted-foreground">RSSI</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfFilteredAnchors.map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 font-medium">{a.label}</td>
                          <td className={cn("py-3 font-mono text-xs", a.rssi != null ? getRssiColor(a.rssi) : '')}>
                            {a.rssi != null ? `${a.rssi} dBm` : '—'}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className={cn("inline-block w-2 h-2 rounded-full", a.status === 'online' ? 'bg-green-500' : 'bg-red-500')} />
                              <span className="text-xs capitalize">{a.status}</span>
                            </div>
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(a.lastSeen).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detected Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TagIcon className="h-4 w-4" />
                Detected Devices ({rfFilteredTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rfFilteredTags.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">No devices detected.</div>
              ) : (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full text-xs md:text-sm min-w-[600px]">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Device</th>
                        <th className="pb-3 font-medium text-muted-foreground">Floor / Room</th>
                        <th className="pb-3 font-medium text-muted-foreground">Position</th>
                        <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                        <th className="pb-3 font-medium text-muted-foreground">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfFilteredTags.map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 font-medium">{t.label}</td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {(t.position as any)?.floor ?? '—'} / {(t.position as any)?.room ?? '—'}
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {t.position ? `(${t.position.x.toFixed(1)}, ${t.position.y.toFixed(1)})` : '—'}
                          </td>
                          <td className="py-3 font-mono text-xs">
                            {(t.position as any)?.confidence != null
                              ? `${((t.position as any).confidence * 100).toFixed(0)}%`
                              : '—'}
                          </td>
                          <td className="py-3 text-xs text-muted-foreground">
                            {new Date(t.lastSeen).toLocaleTimeString()}
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
      </Tabs>
    </div>
  );
}
