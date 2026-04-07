import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon } from 'lucide-react';

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

const toggleSettings: ToggleSetting[] = [
  { key: 'ws_reconnect', label: 'WebSocket Auto-Reconnect', description: 'Automatically reconnect on connection loss', defaultEnabled: true },
  { key: 'data_retention', label: 'Data Retention (90 days)', description: 'Keep historical data for 90 days', defaultEnabled: true },
  { key: 'alert_notif', label: 'Alert Notifications', description: 'In-app alerts for critical events', defaultEnabled: true },
  { key: 'ap_offline', label: 'Auto-detect AP Offline', description: 'Generate alerts when access points go offline', defaultEnabled: true },
  { key: 'low_conf', label: 'Low Confidence Warnings', description: 'Warn when tag confidence drops below threshold', defaultEnabled: true },
  { key: 'email_notif', label: 'Email Notifications', description: 'Send email for critical alerts', defaultEnabled: false },
  { key: 'dark_mode', label: 'Dark Mode', description: 'Use dark color theme', defaultEnabled: true },
];

export default function SystemTab() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(toggleSettings.map((s) => [s.key, s.defaultEnabled]))
  );

  const toggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {toggleSettings.map((s) => (
            <div key={s.key} className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={settings[s.key] ? 'status-online' : 'status-offline'}>
                  {settings[s.key] ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch checked={settings[s.key]} onCheckedChange={() => toggle(s.key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
