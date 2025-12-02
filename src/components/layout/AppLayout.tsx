import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Radio, 
  Bell, 
  PlayCircle, 
  BarChart3, 
  Settings,
  Search,
  Activity,
  MapPin,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLSStore } from '@/store/useRTLSStore';
import { useLogin } from '@/contexts/LoginContext';
import { useAuth, RequireRole } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/map', label: 'Live Map', icon: Map },
  { path: '/inventory', label: 'Inventory', icon: Radio },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/playback', label: 'Playback', icon: PlayCircle },
  { path: '/dashboards', label: 'Dashboards', icon: BarChart3 },
  { path: '/patients', label: 'Patients', icon: Activity },
  { path: '/admin', label: 'Admin', icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { health, alerts } = useRTLSStore();
  const { user, logout } = useLogin();
  const { roles, hasRole } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a) => a.status === 'open' && a.severity === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        {/* Logo */}
        <div className="h-14 border-b border-sidebar-border flex items-center px-4">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          <span className="font-semibold text-sm">RTLS Pilot Monitor</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBadge = item.path === '/alerts' && openAlerts > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className={cn("h-5 px-1.5 text-xs", criticalAlerts > 0 && "pulse-status")}
                  >
                    {openAlerts}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <Badge className={health.wsConnected ? "status-online" : "status-offline"}>
              {health.wsConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <div>Uptime: {Math.floor(health.uptime / 60)}m</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets, patients, tags, anchors... (⌘K)"
                className="pl-8 bg-background"
                onFocus={() => setSearchOpen(true)}
              />
            </div>
          </div>

          {/* Health Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Latency:</span>
              <Badge 
                variant="outline" 
                className={cn(
                  health.ingestToUiMs > 200 ? "severity-warning" : "status-online"
                )}
              >
                {health.ingestToUiMs}ms
              </Badge>
            </div>
            <div className="text-xs font-mono">
              <span className="text-muted-foreground">Loss:</span>
              <span className={cn("ml-1.5", health.packetLossPct > 1 ? "text-severity-warning" : "text-status-online")}>
                {health.packetLossPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Env Badge */}
          <Badge variant="outline" className="font-mono text-xs">
            PILOT
          </Badge>

          {/* User Info */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
