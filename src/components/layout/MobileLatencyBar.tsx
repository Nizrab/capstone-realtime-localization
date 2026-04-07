import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export default function MobileLatencyBar() {
  const [latency, setLatency] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const measure = useCallback(async () => {
    if (!API_BASE) { setOffline(true); return; }
    try {
      const t0 = performance.now();
      const res = await fetch(API_BASE + '/api/health', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await res.json();
      setLatency(Math.round(performance.now() - t0));
      setOffline(false);
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

  const dotColor = offline
    ? 'bg-destructive'
    : latency !== null && latency < 200
    ? 'bg-green-500'
    : latency !== null && latency <= 500
    ? 'bg-yellow-500'
    : 'bg-destructive';

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-card border-t border-border flex items-center justify-center gap-2 z-40 md:hidden">
      <span className={cn('w-2 h-2 rounded-full', dotColor)} />
      <span className="text-xs font-mono text-muted-foreground">
        {offline ? 'Offline' : latency !== null ? `${latency}ms` : '…'}
      </span>
    </div>
  );
}
