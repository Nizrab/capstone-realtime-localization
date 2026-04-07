import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRTLSStore } from "@/store/useRTLSStore";
import { useAlertPolling } from "@/hooks/useAlertPolling";
import StatusBadge from "@/components/StatusBadge";
import { Check, X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Alerts() {
  const { alerts, updateAlert } = useRTLSStore();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Start polling for live alert generation
  useAlertPolling(10_000);

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (statusFilter !== "all" && alert.status !== statusFilter) return false;
    if (typeFilter !== "all" && alert.type !== typeFilter) return false;
    return true;
  });

  const handleAcknowledge = (id: string) => updateAlert(id, { status: "acked" });
  const handleResolve = (id: string) => updateAlert(id, { status: "resolved" });

  const openCount = alerts.filter((a) => a.status === "open").length;
  const criticalCount = alerts.filter((a) => a.status === "open" && a.severity === "critical").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Auto-detected from live API data — polling every 10s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="status-online">
            {openCount} Open
          </Badge>
          {criticalCount > 0 && (
            <Badge variant="outline" className="severity-critical pulse-status">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1.5 block">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acked">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="anchor_offline">AP Offline</SelectItem>
                  <SelectItem value="weak_signal">Weak Signal</SelectItem>
                  <SelectItem value="low_confidence">Low Confidence</SelectItem>
                  <SelectItem value="tag_lost">Tag Lost</SelectItem>
                  <SelectItem value="ap_count_low">AP Count Low</SelectItem>
                  <SelectItem value="geofence_breach">Geofence Breach</SelectItem>
                  <SelectItem value="low_battery">Low Battery</SelectItem>
                  <SelectItem value="packet_loss">Packet Loss</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Alerts ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No alerts detected — all systems nominal
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <StatusBadge status={alert.severity} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {alert.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        {alert.entityId && (
                          <Badge variant="outline" className="text-xs font-mono">
                            {alert.entityId}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.details?.message || JSON.stringify(alert.details)}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        alert.status === "open"
                          ? "severity-critical"
                          : alert.status === "acked"
                          ? "severity-warning"
                          : "status-online"
                      }
                    >
                      {alert.status}
                    </Badge>
                    {alert.status === "open" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                          <Check className="h-3.5 w-3.5 mr-1.5" />
                          ACK
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                          <X className="h-3.5 w-3.5 mr-1.5" />
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === "acked" && (
                      <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                        <X className="h-3.5 w-3.5 mr-1.5" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
