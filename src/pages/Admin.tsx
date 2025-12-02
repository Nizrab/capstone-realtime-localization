import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Users, Key, Settings as SettingsIcon, Shield, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, RequireRole } from '@/contexts/AuthContext';
import { useLogin } from '@/contexts/LoginContext';

export default function Admin() {
  const { hasRole, hasAnyRole } = useAuth();
  const { user } = useLogin();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          System configuration, user management, and security settings
        </p>
      </div>

      {/* Admin-only banner */}
      <RequireRole role="admin">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="font-semibold text-sm">Admin Access Active</div>
                <div className="text-xs text-muted-foreground">
                  You have full system administrator privileges
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </RequireRole>

      {/* Non-admin warning */}
      {!hasRole('admin') && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-warning" />
              <div>
                <div className="font-semibold text-sm">Limited Access</div>
                <div className="text-xs text-muted-foreground">
                  Some features may be restricted based on your role: {user?.role}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="floorplans" className="w-full">
        <TabsList>
          <TabsTrigger value="floorplans">Floorplans</TabsTrigger>
          <TabsTrigger value="rbac" disabled={!hasAnyRole(['admin', 'clinician'])}>
            Roles & Access {!hasAnyRole(['admin', 'clinician']) && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="api" disabled={!hasRole('admin')}>
            API Keys {!hasRole('admin') && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="floorplans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Floorplan Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <div className="text-sm font-medium mb-1">Upload SVG Floorplan</div>
                <div className="text-xs text-muted-foreground mb-3">
                  Drag and drop or click to browse
                </div>
                <Button variant="outline" size="sm">
                  Browse Files
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Existing Floorplans</div>
                <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">ICU Floor 1</div>
                    <div className="text-xs text-muted-foreground">40m × 20m • 800×400px</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-online">Active</Badge>
                    <Button variant="outline" size="sm">Edit Layout</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Anchor Layout Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-sm">Drag-and-drop anchor placement</div>
                  <div className="text-xs mt-1">Select a floorplan to begin editing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rbac" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Operator', 'RFLead', 'Embedded', 'Algo', 'Backend', 'Security'].map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">{role}</div>
                      <div className="text-xs text-muted-foreground">
                        {role === 'Operator' && 'Monitor system, acknowledge alerts, view maps'}
                        {role === 'RFLead' && 'RF planning, anchor layout, accuracy analysis'}
                        {role === 'Embedded' && 'Firmware management, OTA updates, battery monitoring'}
                        {role === 'Algo' && 'Algorithm configuration, sensor fusion, accuracy tuning'}
                        {role === 'Backend' && 'Pipeline health, database management, API monitoring'}
                        {role === 'Security' && 'Full access, audit logs, compliance, threat management'}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {role === 'Operator' ? '12' : role === 'Security' ? '2' : Math.floor(Math.random() * 5) + 1} users
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Manage API keys for external integrations
                </p>
                {hasRole('admin') && <Button size="sm">Generate New Key</Button>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-sm font-mono">prod_api_key_***************xyz</div>
                    <div className="text-xs text-muted-foreground">Created: 2025-08-15 • Last used: 2 hours ago</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-online">Active</Badge>
                    <Button variant="outline" size="sm">Revoke</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <div className="font-medium text-sm font-mono">test_api_key_***************abc</div>
                    <div className="text-xs text-muted-foreground">Created: 2025-07-01 • Last used: Never</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-offline">Inactive</Badge>
                    <Button variant="outline" size="sm">Revoke</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">WebSocket Auto-Reconnect</div>
                    <div className="text-xs text-muted-foreground">Automatically reconnect on connection loss</div>
                  </div>
                  <Badge variant="outline" className="status-online">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Data Retention</div>
                    <div className="text-xs text-muted-foreground">Keep historical data for 90 days</div>
                  </div>
                  <Badge variant="outline">90 days</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Alert Notifications</div>
                    <div className="text-xs text-muted-foreground">Email alerts for critical events</div>
                  </div>
                  <Badge variant="outline" className="status-online">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Audit Logging</div>
                    <div className="text-xs text-muted-foreground">Track all security-sensitive actions</div>
                  </div>
                  <Badge variant="outline" className="status-online">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">PHI Redaction</div>
                    <div className="text-xs text-muted-foreground">Mask patient identifiable information</div>
                  </div>
                  <Badge variant="outline" className="status-online">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">TLS Encryption</div>
                    <div className="text-xs text-muted-foreground">Secure all data in transit</div>
                  </div>
                  <Badge variant="outline" className="status-online">Enforced</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full">View Audit Logs</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
