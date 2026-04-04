import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export default function SidebarLatency() {
  const [latency, setLatency] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const [lastPollAt, setLastPollAt] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = useCallback(async () => {
    if (!API_BASE) { setOffline(true); return; }
    try {
      const t0 = performance.now();
      const res = await fetch(API_BASE + '/api/health', { cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await res.json();
      const ms = Math.round(performance.now() - t0);
      setLatency(ms);
      setOffline(false);
      setLastPollAt(Date.now());
    } catch {
      setOffline(true);
      setLatency(null);
    }
  }, []);

  useEffect(() => {
    measure();
    intervalRef.current = setInterval(measure, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [measure]);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setLastPollAt((prev) => {
        if (prev) setSecondsAgo(Math.round((Date.now() - prev) / 1000));
        return prev;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  const badgeClass = offline
    ? 'bg-destructive text-destructive-foreground'
    : latency !== null && latency < 200
    ? 'bg-green-600 text-white'
    : latency !== null && latency <= 500
    ? 'bg-yellow-500 text-black'
    : 'bg-destructive text-destructive-foreground';

  return (
    <div className="p-3 border-t border-sidebar-border space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">API Latency</span>
        <Badge className={cn('text-xs font-mono', badgeClass)}>
          {offline ? 'Offline' : latency !== null ? `${latency}ms` : '…'}
        </Badge>
      </div>
      <div className="text-[10px] text-muted-foreground">
        Last poll: {lastPollAt ? `${secondsAgo}s ago` : '—'}
      </div>
      <div className="text-[10px] text-muted-foreground">
        Pipeline: Backend → Admin → Client
      </div>
    </div>
  );
}
