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
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRTLSStore } from '@/store/useRTLSStore';
import { useLogin } from '@/contexts/LoginContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import SidebarLatency from '@/components/layout/SidebarLatency';
import MobileLatencyBar from '@/components/layout/MobileLatencyBar';
import { Button } from '@/components/ui/button';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { alerts } = useRTLSStore();
  const { user, logout } = useLogin();
  const { hasRole } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const openAlerts = alerts.filter((a) => a.status === 'open').length;
  const criticalAlerts = alerts.filter((a) => a.status === 'open' && a.severity === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const sidebarContent = (
    <>
      <div className="h-14 border-b border-sidebar-border flex items-center px-4 justify-between">
        <div className="flex items-center">
          <span className="text-primary text-lg mr-2">🍁</span>
          <span className="font-semibold text-sm">Canadian Health</span>
        </div>
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

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

      <SidebarLatency />
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
        <div className="absolute inset-0 bg-black/60 z-[2000]" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-sidebar flex flex-col z-[2001] animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-3 md:px-4 gap-2 md:gap-4 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile brand */}
          <span className="font-semibold text-sm md:hidden shrink-0">🍁 Canadian Health</span>

          <div className="flex-1 min-w-0">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">
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
        <main className="flex-1 overflow-auto pb-10 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom latency bar */}
        {isMobile && <MobileLatencyBar />}
      </div>
    </div>
  );
}
