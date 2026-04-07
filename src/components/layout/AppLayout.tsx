import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Radio, 
  Bell, 
  PlayCircle, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLSStore } from '@/store/useRTLSStore';
import { useLogin } from '@/contexts/LoginContext';
import { useAuth, RequireRole } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import SidebarLatency from '@/components/layout/SidebarLatency';
import { Button } from '@/components/ui/button';
import GlobalSearch from '@/components/layout/GlobalSearch';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'nurse', 'backend'] as const },
  { path: '/map', label: 'Live Map', icon: Map, roles: ['admin', 'nurse', 'backend'] as const },
  { path: '/inventory', label: 'Inventory', icon: Radio, roles: ['admin', 'nurse', 'backend'] as const },
  { path: '/alerts', label: 'Alerts', icon: Bell, roles: ['admin', 'nurse', 'backend'] as const },
  { path: '/playback', label: 'Playback', icon: PlayCircle, roles: ['admin', 'nurse', 'backend'] as const },
  { path: '/dashboards', label: 'Dashboards', icon: BarChart3, roles: ['admin', 'nurse', 'backend'] as const },
  
  { path: '/admin', label: 'Admin', icon: Settings, roles: ['admin', 'backend'] as const },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { health, alerts } = useRTLSStore();
  const { user, logout } = useLogin();
  const { roles, hasRole } = useAuth();
  
  
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
          <span className="text-primary text-lg mr-2">🍁</span>
          <span className="font-semibold text-sm">Canadian Health</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBadge = item.path === '/alerts' && openAlerts > 0;
            const hasAccess = hasRole('admin') || item.roles.some((role) => hasRole(role));

            if (!hasAccess) return null;

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
        <SidebarLatency />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
          {/* Search */}
          <GlobalSearch />

          {/* User Info */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs capitalize">
              {user.role}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              title="Logout"
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
