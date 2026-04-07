import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Wifi, Radio, Clock, Server } from 'lucide-react';
import { fetchAnchors, fetchTags, fetchHealth, type APIAnchor, type APITag, type APIHealth } from '@/lib/api';

function colorClass(level: 'green' | 'yellow' | 'red') {
  return level === 'green'
    ? 'text-emerald-400'
    : level === 'yellow'
    ? 'text-yellow-400'
    : 'text-red-400';
}

function badgeClass(level: 'green' | 'yellow' | 'red') {
  return level === 'green'
    ? 'status-online'
    : level === 'yellow'
    ? 'severity-warning'
    : 'severity-critical';
}

function barBg(level: 'green' | 'yellow' | 'red') {
  return level === 'green'
    ? 'bg-emerald-500'
    : level === 'yellow'
    ? 'bg-yellow-500'
    : 'bg-red-500';
}

function confidenceLevel(pct: number): 'green' | 'yellow' | 'red' {
  return pct >= 70 ? 'green' : pct >= 50 ? 'yellow' : 'red';
}

function rssiLevel(rssi: number | null): 'green' | 'yellow' | 'red' {
  if (rssi === null) return 'red';
  return rssi > -60 ? 'green' : rssi > -80 ? 'yellow' : 'red';
}

export default function Dashboards() {
  const [anchors, setAnchors] = useState<APIAnchor[]>([]);
  const [tags, setTags] = useState<APITag[]>([]);
  const [health, setHealth] = useState<APIHealth | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState(false);

  const poll = useCallback(async () => {
    try {
      const t0 = performance.now();
      const [a, t, h] = await Promise.all([fetchAnchors(), fetchTags(), fetchHealth()]);
      const elapsed = Math.round(performance.now() - t0);
      setAnchors(a);
      setTags(t);
      setHealth(h);
      setLatencyMs(elapsed);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [poll]);

  // Derived metrics
  const confidences = tags.map((t) => t.confidence ?? 0);
  const avgConf = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  const minConf = confidences.length ? Math.min(...confidences) : 0;
  const maxConf = confidences.length ? Math.max(...confidences) : 0;
  const avgPct = Math.round(avgConf * 100);

  const onlineAnchors = anchors.filter((a) => a.status === 'online').length;
  const apPct = anchors.length ? Math.round((onlineAnchors / anchors.length) * 100) : 0;
  const apOffline = anchors.length - onlineAnchors;
  const apLevel: 'green' | 'yellow' | 'red' = apOffline === 0 ? 'green' : apOffline === 1 ? 'yellow' : 'red';

  const trackingTags = tags.filter((t) => (t.confidence ?? 0) > 0.5).length;
  const trackPct = tags.length ? Math.round((trackingTags / tags.length) * 100) : 0;
  const trackLevel: 'green' | 'yellow' | 'red' = trackPct >= 80 ? 'green' : trackPct >= 50 ? 'yellow' : 'red';

  const latestSeen = tags.length
    ? Math.max(...tags.map((t) => (t.lastSeen ? new Date(t.lastSeen).getTime() : 0)))
    : 0;
  const freshnessSec = latestSeen ? Math.round((Date.now() - latestSeen) / 1000) : 999;
  const freshLevel: 'green' | 'yellow' | 'red' = freshnessSec < 30 ? 'green' : freshnessSec < 60 ? 'yellow' : 'red';

  const latLevel: 'green' | 'yellow' | 'red' =
    latencyMs === null ? 'red' : latencyMs < 200 ? 'green' : latencyMs < 500 ? 'yellow' : 'red';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Dashboards</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live system metrics — polling every 10s
        </p>
      </div>

      {/* 1. Accuracy Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Accuracy Metrics</CardTitle>
            <Badge variant="outline" className="text-xs">WIFI_RSSI • {tags.length} samples</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
              <div className={`text-2xl font-bold font-mono ${colorClass(confidenceLevel(avgPct))}`}>{avgPct}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Min</div>
              <div className="text-2xl font-bold font-mono">{Math.round(minConf * 100)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Max</div>
              <div className="text-2xl font-bold font-mono">{Math.round(maxConf * 100)}%</div>
            </div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barBg(confidenceLevel(avgPct))}`} style={{ width: `${avgPct}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* 2. System Health */}
      <div>
        <h2 className="text-lg font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Latency */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">API Latency</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${colorClass(latLevel)}`}>
                {latencyMs !== null ? `${latencyMs}ms` : 'Offline'}
              </div>
              <Badge variant="outline" className={`mt-2 text-xs ${badgeClass(latLevel)}`}>
                {latLevel === 'green' ? 'Within SLA' : latLevel === 'yellow' ? 'Elevated' : 'Critical'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Target: ≤200ms</div>
            </CardContent>
          </Card>

          {/* AP Coverage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AP Coverage</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${colorClass(apLevel)}`}>
                {onlineAnchors}/{anchors.length} ({apPct}%)
              </div>
              <Badge variant="outline" className={`mt-2 text-xs ${badgeClass(apLevel)}`}>
                {apOffline === 0 ? 'All Online' : `${apOffline} Offline`}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Target: 100%</div>
            </CardContent>
          </Card>

          {/* Tag Tracking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tag Tracking</CardTitle>
              <Radio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${colorClass(trackLevel)}`}>
                {trackingTags}/{tags.length} ({trackPct}%)
              </div>
              <Badge variant="outline" className={`mt-2 text-xs ${badgeClass(trackLevel)}`}>
                {trackLevel === 'green' ? 'Healthy' : trackLevel === 'yellow' ? 'Degraded' : 'Poor'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Target: ≥80%</div>
            </CardContent>
          </Card>

          {/* Data Freshness */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Freshness</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-mono ${colorClass(freshLevel)}`}>
                {freshnessSec}s ago
              </div>
              <Badge variant="outline" className={`mt-2 text-xs ${badgeClass(freshLevel)}`}>
                {freshLevel === 'green' ? 'Fresh' : freshLevel === 'yellow' ? 'Stale' : 'Outdated'}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Target: &lt;30s</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Signal Strength by AP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Signal Strength by AP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {anchors.length === 0 && <p className="text-sm text-muted-foreground">No anchors detected</p>}
          {anchors.map((a) => {
            const level = rssiLevel(a.rssi);
            const width = a.rssi !== null ? Math.max(5, Math.min(100, ((a.rssi + 100) / 60) * 100)) : 0;
            return (
              <div key={a.id}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">{a.label || a.id}</span>
                  <span className={`font-mono font-semibold ${colorClass(level)}`}>
                    {a.rssi !== null ? `${a.rssi} dBm` : 'N/A'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barBg(level)}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 4. Position Confidence by Device */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Position Confidence by Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tags.length === 0 && <p className="text-sm text-muted-foreground">No tags detected</p>}
          {tags.map((t) => {
            const pct = Math.round((t.confidence ?? 0) * 100);
            const level = confidenceLevel(pct);
            return (
              <div key={t.id}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-muted-foreground">
                    {t.label || t.id}
                    {t.room_id && <span className="ml-2 text-xs opacity-60">({t.room_id})</span>}
                  </span>
                  <span className={`font-mono font-semibold ${colorClass(level)}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barBg(level)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 5. Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pipeline Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-4">
            {/* Engine */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${health && health.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'} ${health && health.status === 'ok' ? 'animate-pulse' : ''}`} />
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">Engine</span>
              <span className="text-xs text-muted-foreground">(Backend)</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-px bg-border" />
              {latencyMs !== null && (
                <span className="text-xs text-muted-foreground mt-1">{latencyMs}ms</span>
              )}
            </div>

            {/* AWS S3 */}
            <div className="flex flex-col items-center gap-1">
              <div className={`h-3 w-3 rounded-full ${health?.s3_connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-medium">AWS S3</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-px bg-border" />
            </div>

            {/* Frontend */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">Frontend</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
