import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, RequireRole } from '@/contexts/AuthContext';
import { useLogin } from '@/contexts/LoginContext';
import FloorplansTab from '@/components/admin/FloorplansTab';
import SystemTab from '@/components/admin/SystemTab';

export default function Admin() {
  const { hasRole } = useAuth();
  const { user } = useLogin();

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground text-sm mt-1">
          System configuration, user management, and settings
        </p>
      </div>

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
          <TabsTrigger value="rbac" disabled={!hasRole('admin')}>
            Roles & Access {!hasRole('admin') && <Lock className="h-3 w-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="floorplans">
          <FloorplansTab />
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
                {[
                  { role: 'Admin', description: 'Full system access, user management, configuration, and security settings', users: 2 },
                  { role: 'Nurse', description: 'Read-only access to device list, live map, alerts, and overview dashboards', users: 12 },
                  { role: 'Backend', description: 'API performance monitoring, backend health status, database metrics', users: 3 },
                ].map(({ role, description, users }) => (
                  <div key={role} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{role}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                    <Badge variant="outline">{users} users</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <SystemTab />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No recent activity logs to display.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
