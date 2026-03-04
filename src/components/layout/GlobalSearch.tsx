import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Radio, MapPin, Bell, LayoutDashboard, Map, PlayCircle, BarChart3, Settings, Activity, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRTLSStore } from '@/store/useRTLSStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  label: string;
  type: 'anchor' | 'tag' | 'alert' | 'page';
  description: string;
  path: string;
  icon: typeof Search;
  tab?: string;
}

const pages: SearchResult[] = [
  { id: 'page-overview', label: 'Overview', type: 'page', description: 'System overview dashboard', path: '/', icon: LayoutDashboard },
  { id: 'page-map', label: 'Live Map', type: 'page', description: 'Real-time location map', path: '/map', icon: Map },
  { id: 'page-inventory', label: 'Inventory', type: 'page', description: 'Manage anchors, tags, and devices', path: '/inventory', icon: Radio },
  { id: 'page-alerts', label: 'Alerts', type: 'page', description: 'View and manage alerts', path: '/alerts', icon: Bell },
  { id: 'page-playback', label: 'Playback', type: 'page', description: 'Replay historical tracks', path: '/playback', icon: PlayCircle },
  { id: 'page-dashboards', label: 'Dashboards', type: 'page', description: 'Analytics dashboards', path: '/dashboards', icon: BarChart3 },
  { id: 'page-patients', label: 'Patients', type: 'page', description: 'Patient management', path: '/patients', icon: Activity },
  { id: 'page-admin', label: 'Admin', type: 'page', description: 'System administration', path: '/admin', icon: Settings },
];

export default function GlobalSearch() {
  const navigate = useNavigate();
  const { anchors, tags, alerts } = useRTLSStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    // Search pages
    pages.forEach((p) => {
      if (p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        items.push(p);
      }
    });

    // Search anchors
    anchors.forEach((a) => {
      if (a.id.toLowerCase().includes(q) || a.label.toLowerCase().includes(q) || a.tech.toLowerCase().includes(q)) {
        items.push({
          id: a.id,
          label: a.label,
          type: 'anchor',
          description: `${a.tech} anchor · ${a.id} · ${a.status}`,
          path: '/inventory',
          tab: 'anchors',
          icon: MapPin,
        });
      }
    });

    // Search tags
    tags.forEach((t) => {
      if (t.id.toLowerCase().includes(q) || t.label.toLowerCase().includes(q) || t.tech.toLowerCase().includes(q)) {
        items.push({
          id: t.id,
          label: t.label,
          type: 'tag',
          description: `${t.tech} tag · ${t.id} · ${t.batteryPct}% battery`,
          path: '/inventory',
          tab: 'tags',
          icon: Radio,
        });
      }
    });

    // Search alerts
    alerts.forEach((a) => {
      const matchText = `${a.id} ${a.type} ${a.severity} ${a.entityId || ''} ${a.details?.message || ''}`.toLowerCase();
      if (matchText.includes(q)) {
        items.push({
          id: a.id,
          label: `${a.type.replace(/_/g, ' ')} — ${a.severity}`,
          type: 'alert',
          description: `${a.id} · ${a.entityId || 'system'} · ${a.status}`,
          path: '/alerts',
          icon: Bell,
        });
      }
    });

    return items.slice(0, 15);
  }, [query, anchors, tags, alerts]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');

    if (result.tab) {
      // Navigate with search params so Inventory can pick up the tab + highlight
      navigate(`${result.path}?tab=${result.tab}&highlight=${result.id}`);
    } else {
      navigate(result.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const typeColors: Record<string, string> = {
    page: 'bg-primary/10 text-primary',
    anchor: 'bg-chart-1/20 text-chart-1',
    tag: 'bg-chart-2/20 text-chart-2',
    alert: 'bg-destructive/10 text-destructive',
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-md relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search assets, tags, anchors... (⌘K)"
          className="pl-8 bg-background pr-8"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); }}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((result, i) => {
            const Icon = result.icon;
            return (
              <button
                key={result.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  i === selectedIndex ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
                )}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{result.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{result.description}</div>
                </div>
                <Badge variant="outline" className={cn('text-[10px] shrink-0', typeColors[result.type])}>
                  {result.type}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          No results for "{query}"
        </div>
      )}
    </div>
  );
}
