import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AccuracyMetrics } from '@/types/rtls';

const accuracyMetrics: AccuracyMetrics[] = [
  { tech: 'WIFI_RTT', rmse: 2.12, cep50: 1.92, cep95: 4.35, sampleCount: 0 },
];
import { BarChart3, TrendingUp, Activity, Battery } from 'lucide-react';

export default function Dashboards() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboards</h1>
        <p className="text-muted-foreground text-sm mt-1">
          System performance metrics and accuracy analytics
        </p>
      </div>

      {/* Accuracy Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Accuracy Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accuracyMetrics.map((metric) => (
            <Card key={metric.tech}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.tech}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {metric.sampleCount.toLocaleString()} samples
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">RMSE</span>
                    <span className="font-mono font-semibold">{metric.rmse.toFixed(2)}m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CEP50</span>
                    <span className="font-mono font-semibold">{metric.cep50.toFixed(2)}m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CEP95</span>
                    <span className="font-mono font-semibold">{metric.cep95.toFixed(2)}m</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        metric.tech === 'UWB'
                          ? 'bg-status-online'
                          : metric.tech === 'BLE'
                          ? 'bg-status-degraded'
                          : 'bg-severity-warning'
                      }`}
                      style={{ width: `${Math.min(100, (2 / metric.rmse) * 50)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Accuracy score: {metric.tech === 'UWB' ? 'Excellent' : metric.tech === 'BLE' ? 'Good' : 'Fair'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Health Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingest Latency
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">132ms</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-3 w-3 text-status-online" />
                <span className="text-xs text-status-online">Within SLA</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Target: ≤200ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Packet Loss
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">0.4%</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-3 w-3 text-status-online" />
                <span className="text-xs text-status-online">Excellent</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Target: &lt;1%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                System Uptime
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">99.8%</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-status-online">24h: 100%</span>
                <span className="text-xs text-muted-foreground">7d: 99.8%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Target: ≥99.5%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Battery Life
              </CardTitle>
              <Battery className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">8.2d</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-3 w-3 text-status-online" />
                <span className="text-xs text-status-online">Above target</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Target: ≥7 days</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">UWB Network Performance</span>
                <span className="font-mono font-semibold">94%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-status-online" style={{ width: '94%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">BLE Network Performance</span>
                <span className="font-mono font-semibold">87%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-status-degraded" style={{ width: '87%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-muted-foreground">Wi-Fi RTT Performance</span>
                <span className="font-mono font-semibold">78%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-severity-warning" style={{ width: '78%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
