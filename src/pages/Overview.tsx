import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRTLSStore } from "@/store/useRTLSStore";
import { fetchAnchors, fetchTags, fetchHealth, type APIHealth } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import { Radio, Tag, Activity, Server, Database, Cloud } from "lucide-react";
import type { Anchor, Tag as TagType } from "@/types/rtls";

export default function Overview() {
  const { anchors, tags, setAnchors, setTags } = useRTLSStore();
  const [apiHealth, setApiHealth] = useState<APIHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [apiAnchors, apiTags, health] = await Promise.all([
        fetchAnchors(),
        fetchTags(),
        fetchHealth(),
      ]);
      setAnchors(
        apiAnchors.map((a): Anchor => ({
          id: a.id,
          label: a.label,
          tech: (a.tech as Anchor["tech"]) || "WIFI_RTT",
          position: { x: 0, y: 0 },
          firmware: a.firmware || "—",
          status: (a.status as Anchor["status"]) || "online",
          rssi: a.rssi ?? undefined,
          lastSeen: a.lastSeen || new Date().toISOString(),
        }))
      );
      setTags(
        apiTags.map((t): TagType => ({
          id: t.id,
          label: t.label,
          tech: (t.tech as TagType["tech"]) || "WIFI_RTT",
          batteryPct: t.batteryPct ?? 100,
          sensors: {},
          firmware: t.firmware || "—",
          lastSeen: t.lastSeen || new Date().toISOString(),
          position: t.position,
          status: t.status,
        }))
      );
      setApiHealth(health);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    }
  }, [setAnchors, setTags]);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const onlineAnchors = anchors.filter((a) => a.status === "online").length;
  const totalDevices = tags.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time indoor positioning monitoring
        </p>
        {error && (
          <p className="text-destructive text-xs mt-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
            {error}
          </p>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Access Points
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {onlineAnchors}/{anchors.length}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={onlineAnchors > 0 ? "online" : "offline"} />
              <span className="text-xs text-muted-foreground">online</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tracked Devices
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{totalDevices}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">Active tags/devices</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {apiHealth?.status === "healthy" ? "OK" : error ? "ERR" : "…"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge
                status={
                  apiHealth?.status === "healthy"
                    ? "online"
                    : error
                    ? "critical"
                    : "degraded"
                }
              />
              <span className="text-xs text-muted-foreground">
                {apiHealth?.status === "healthy" ? "Connected" : error || "Connecting…"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              S3 Pipeline
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {apiHealth?.s3_connected ? "Live" : "—"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge
                status={apiHealth?.s3_connected ? "online" : "offline"}
              />
              <span className="text-xs text-muted-foreground">
                {apiHealth?.s3_connected ? "S3 connected" : "Waiting…"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Wi-Fi RSSI Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Access Points</span>
              <span className="font-mono">{anchors.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tracked Devices</span>
              <span className="font-mono">{tags.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-mono text-primary">RSSI Trilateration</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Data Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-mono">AWS S3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compute</span>
              <span className="font-mono">Elastic Beanstalk</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Region</span>
              <span className="font-mono">us-east-2</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
