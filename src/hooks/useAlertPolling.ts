import { useEffect, useRef } from 'react';
import { fetchAnchors, fetchTags } from '@/lib/api';
import { useRTLSStore } from '@/store/useRTLSStore';
import type { Alert, AlertType, AlertSeverity } from '@/types/rtls';

function makeId(type: string, entity: string): string {
  return `${type}::${entity}`;
}

export function useAlertPolling(intervalMs = 10_000) {
  const { alerts, addAlert } = useRTLSStore();
  const existingIds = useRef(new Set<string>());

  // Keep ref in sync
  useEffect(() => {
    existingIds.current = new Set(alerts.map((a) => a.id));
  }, [alerts]);

  useEffect(() => {
    function pushIfNew(
      id: string,
      type: AlertType,
      severity: AlertSeverity,
      entityId: string,
      message: string
    ) {
      if (existingIds.current.has(id)) return;
      const alert: Alert = {
        id,
        type,
        severity,
        createdAt: new Date().toISOString(),
        status: 'open',
        entityId,
        details: { message },
      };
      addAlert(alert);
      existingIds.current.add(id);
    }

    async function poll() {
      try {
        const [anchors, tags] = await Promise.all([fetchAnchors(), fetchTags()]);

        // 1. AP Offline
        anchors.forEach((a) => {
          if (a.status === 'offline') {
            pushIfNew(
              makeId('anchor_offline', a.id),
              'anchor_offline',
              'critical',
              a.id,
              `${a.label || a.id} is offline. Last seen: ${a.lastSeen || 'unknown'}`
            );
          }
        });

        // 2. Weak Signal (RSSI < -80)
        anchors.forEach((a) => {
          if (a.rssi !== null && a.rssi < -80) {
            pushIfNew(
              makeId('weak_signal', a.id),
              'weak_signal',
              'warning',
              a.id,
              `${a.label || a.id} has weak signal: ${a.rssi} dBm`
            );
          }
        });

        // 3. Low Confidence
        tags.forEach((t) => {
          if (t.confidence < 0.5) {
            pushIfNew(
              makeId('low_confidence', t.id),
              'low_confidence',
              'warning',
              t.id,
              `${t.label || t.id} confidence ${(t.confidence * 100).toFixed(0)}% at (${t.position?.x?.toFixed(1)}, ${t.position?.y?.toFixed(1)})`
            );
          }
        });

        // 4. Tag Lost (lastSeen > 5 min ago)
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        tags.forEach((t) => {
          if (t.lastSeen && new Date(t.lastSeen).getTime() < fiveMinAgo) {
            pushIfNew(
              makeId('tag_lost', t.id),
              'tag_lost',
              'critical',
              t.id,
              `${t.label || t.id} last seen ${t.lastSeen}`
            );
          }
        });

        // 5. AP Count Low
        const onlineCount = anchors.filter((a) => a.status === 'online').length;
        if (onlineCount < 3) {
          pushIfNew(
            makeId('ap_count_low', 'system'),
            'ap_count_low',
            'warning',
            'system',
            `Only ${onlineCount} AP(s) online — localization accuracy may be degraded`
          );
        }
      } catch {
        // API unreachable — skip this cycle
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [addAlert, intervalMs]);
}
