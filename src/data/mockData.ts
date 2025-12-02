import type {
  Anchor,
  Tag,
  Alert,
  TrackPoint,
  Geofence,
  AccuracyMetrics,
} from "@/types/rtls";

// ICU Floor - 20m x 40m
export const mockFloorplan = {
  id: "floor-icu-1",
  name: "ICU Floor 1",
  svgUrl: "/floorplan-icu.svg",
  widthMeters: 40,
  heightMeters: 20,
  origin: { x: 0, y: 0 },
  scalePxPerMeter: 20,
};

// 20 Anchors: 12 UWB, 6 BLE, 2 Wi-Fi RTT
export const mockAnchors: Anchor[] = [
  // UWB anchors (perimeter + corners)
  {
    id: "A-UWB-01",
    label: "UWB-N1",
    tech: "UWB",
    position: { x: 2, y: 2 },
    firmware: "1.2.4",
    status: "online",
    snr: 18,
    rssi: -45,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-02",
    label: "UWB-N2",
    tech: "UWB",
    position: { x: 10, y: 2 },
    firmware: "1.2.4",
    status: "online",
    snr: 19,
    rssi: -43,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-03",
    label: "UWB-N3",
    tech: "UWB",
    position: { x: 20, y: 2 },
    firmware: "1.2.4",
    status: "online",
    snr: 17,
    rssi: -46,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-04",
    label: "UWB-N4",
    tech: "UWB",
    position: { x: 30, y: 2 },
    firmware: "1.2.4",
    status: "degraded",
    snr: 12,
    rssi: -58,
    lastSeen: new Date(Date.now() - 15000).toISOString(),
  },
  {
    id: "A-UWB-05",
    label: "UWB-N5",
    tech: "UWB",
    position: { x: 38, y: 2 },
    firmware: "1.2.4",
    status: "online",
    snr: 18,
    rssi: -44,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-06",
    label: "UWB-S1",
    tech: "UWB",
    position: { x: 2, y: 18 },
    firmware: "1.2.4",
    status: "online",
    snr: 19,
    rssi: -42,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-07",
    label: "UWB-S2",
    tech: "UWB",
    position: { x: 10, y: 18 },
    firmware: "1.2.4",
    status: "online",
    snr: 18,
    rssi: -45,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-08",
    label: "UWB-S3",
    tech: "UWB",
    position: { x: 20, y: 18 },
    firmware: "1.2.5",
    status: "online",
    snr: 20,
    rssi: -41,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-09",
    label: "UWB-S4",
    tech: "UWB",
    position: { x: 30, y: 18 },
    firmware: "1.2.5",
    status: "online",
    snr: 19,
    rssi: -43,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-10",
    label: "UWB-S5",
    tech: "UWB",
    position: { x: 38, y: 18 },
    firmware: "1.2.5",
    status: "offline",
    lastSeen: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: "A-UWB-11",
    label: "UWB-C1",
    tech: "UWB",
    position: { x: 15, y: 10 },
    firmware: "1.2.5",
    status: "online",
    snr: 21,
    rssi: -40,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-UWB-12",
    label: "UWB-C2",
    tech: "UWB",
    position: { x: 25, y: 10 },
    firmware: "1.2.5",
    status: "online",
    snr: 20,
    rssi: -42,
    lastSeen: new Date().toISOString(),
  },

  // BLE anchors
  {
    id: "A-BLE-01",
    label: "BLE-E1",
    tech: "BLE",
    position: { x: 5, y: 5 },
    firmware: "2.1.3",
    status: "online",
    rssi: -52,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-BLE-02",
    label: "BLE-E2",
    tech: "BLE",
    position: { x: 15, y: 5 },
    firmware: "2.1.3",
    status: "online",
    rssi: -50,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-BLE-03",
    label: "BLE-E3",
    tech: "BLE",
    position: { x: 25, y: 5 },
    firmware: "2.1.3",
    status: "online",
    rssi: -51,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-BLE-04",
    label: "BLE-W1",
    tech: "BLE",
    position: { x: 5, y: 15 },
    firmware: "2.1.2",
    status: "degraded",
    rssi: -68,
    lastSeen: new Date(Date.now() - 20000).toISOString(),
  },
  {
    id: "A-BLE-05",
    label: "BLE-W2",
    tech: "BLE",
    position: { x: 15, y: 15 },
    firmware: "2.1.3",
    status: "online",
    rssi: -49,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-BLE-06",
    label: "BLE-W3",
    tech: "BLE",
    position: { x: 35, y: 15 },
    firmware: "2.1.3",
    status: "online",
    rssi: -50,
    lastSeen: new Date().toISOString(),
  },

  // Wi-Fi RTT anchors
  {
    id: "A-RTT-01",
    label: "RTT-AP1",
    tech: "WIFI_RTT",
    position: { x: 8, y: 10 },
    firmware: "3.0.1",
    status: "online",
    rssi: -35,
    lastSeen: new Date().toISOString(),
  },
  {
    id: "A-RTT-02",
    label: "RTT-AP2",
    tech: "WIFI_RTT",
    position: { x: 32, y: 10 },
    firmware: "3.0.1",
    status: "online",
    rssi: -38,
    lastSeen: new Date().toISOString(),
  },
];

// 40 Tags with varied battery, sensors
export const mockTags: Tag[] = Array.from({ length: 40 }, (_, i) => {
  const tech = i < 20 ? "UWB" : i < 35 ? "BLE" : "WIFI_RTT";
  const battery = Math.max(5, 100 - i * 2 - Math.random() * 10);
  return {
    id: `T-${String(i + 1).padStart(3, "0")}`,
    label: `Patient-${String.fromCharCode(65 + (i % 26))}${
      Math.floor(i / 26) + 1
    }`,
    tech,
    batteryPct: Math.round(battery),
    sensors: {
      hr: tech === "UWB" ? Math.round(60 + Math.random() * 40) : undefined,
      tempC:
        tech === "UWB" ? +(36.5 + Math.random() * 1.2).toFixed(1) : undefined,
      imu:
        tech !== "WIFI_RTT"
          ? {
              ax: +(Math.random() * 2 - 1).toFixed(2),
              ay: +(Math.random() * 2 - 1).toFixed(2),
              az: +(9.8 + Math.random() * 0.4 - 0.2).toFixed(2),
            }
          : undefined,
    },
    firmware: tech === "UWB" ? "1.2.5" : tech === "BLE" ? "2.1.3" : "3.0.1",
    lastSeen: new Date(Date.now() - Math.random() * 10000).toISOString(),
  };
});

// Sample track points for 10 tags over 2 hours
export const generateMockTracks = (): TrackPoint[] => {
  const points: TrackPoint[] = [];
  const tagIds = mockTags.slice(0, 10).map((t) => t.id);
  const startTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago

  tagIds.forEach((tagId) => {
    let x = 5 + Math.random() * 30;
    let y = 5 + Math.random() * 10;

    for (let min = 0; min < 120; min += 1) {
      // Random walk
      x += (Math.random() - 0.5) * 0.5;
      y += (Math.random() - 0.5) * 0.3;
      x = Math.max(2, Math.min(38, x));
      y = Math.max(2, Math.min(18, y));

      const ts = new Date(startTime + min * 60 * 1000).toISOString();

      // Raw point
      points.push({
        tagId,
        ts,
        pos: {
          x: +(x + (Math.random() - 0.5) * 0.8).toFixed(2),
          y: +(y + (Math.random() - 0.5) * 0.6).toFixed(2),
        },
        cov: +(0.4 + Math.random() * 0.4).toFixed(2),
        source: "raw",
      });

      // Filtered point
      points.push({
        tagId,
        ts,
        pos: { x: +x.toFixed(2), y: +y.toFixed(2) },
        cov: +(0.2 + Math.random() * 0.2).toFixed(2),
        source: "filtered",
      });
    }
  });

  return points;
};

// 50+ alerts (mixed types)
export const mockAlerts: Alert[] = [
  {
    id: "AL-001",
    type: "geofence_breach",
    severity: "critical",
    createdAt: new Date(Date.now() - 300000).toISOString(),
    status: "open",
    entityId: "T-012",
    geofenceId: "GF-ICU-1",
    details: { message: "Patient left ICU zone" },
  },
  {
    id: "AL-002",
    type: "low_battery",
    severity: "warning",
    createdAt: new Date(Date.now() - 600000).toISOString(),
    status: "acked",
    entityId: "T-025",
    details: { batteryPct: 8 },
  },
  {
    id: "AL-003",
    type: "anchor_offline",
    severity: "critical",
    createdAt: new Date(Date.now() - 900000).toISOString(),
    status: "resolved",
    entityId: "A-UWB-10",
    details: { downSince: new Date(Date.now() - 900000).toISOString() },
  },
  {
    id: "AL-004",
    type: "packet_loss",
    severity: "warning",
    createdAt: new Date(Date.now() - 180000).toISOString(),
    status: "open",
    entityId: "A-UWB-04",
    details: { lossPct: 12.3 },
  },
  {
    id: "AL-005",
    type: "latency_sla",
    severity: "warning",
    createdAt: new Date(Date.now() - 120000).toISOString(),
    status: "acked",
    details: { latencyMs: 450 },
  },
  {
    id: "AL-006",
    type: "low_battery",
    severity: "critical",
    createdAt: new Date(Date.now() - 450000).toISOString(),
    status: "open",
    entityId: "T-030",
    details: { batteryPct: 4 },
  },
  {
    id: "AL-007",
    type: "geofence_breach",
    severity: "warning",
    createdAt: new Date(Date.now() - 240000).toISOString(),
    status: "acked",
    entityId: "T-007",
    geofenceId: "GF-ZONE-2",
    details: { message: "Asset entered restricted zone" },
  },
  {
    id: "AL-008",
    type: "anchor_offline",
    severity: "warning",
    createdAt: new Date(Date.now() - 60000).toISOString(),
    status: "open",
    entityId: "A-BLE-04",
    details: { downSince: new Date(Date.now() - 60000).toISOString() },
  },
  {
    id: "AL-009",
    type: "unexpected_movement",
    severity: "warning",
    createdAt: new Date(Date.now() - 60000).toISOString(),
    status: "open",
    entityId: "T-027",
    details: { message: "Equipment moved outside typical movement pattern." },
  },
];

// Geofences
export const mockGeofences: Geofence[] = [
  {
    id: "GF-ICU-1",
    name: "ICU Main Zone",
    polygon: [
      { x: 10, y: 5 },
      { x: 30, y: 5 },
      { x: 30, y: 15 },
      { x: 10, y: 15 },
    ],
    rule: "exit",
    active: true,
  },
  {
    id: "GF-ZONE-2",
    name: "Restricted Area",
    polygon: [
      { x: 35, y: 2 },
      { x: 39, y: 2 },
      { x: 39, y: 8 },
      { x: 35, y: 8 },
    ],
    rule: "enter",
    active: true,
  },
];

// Accuracy metrics
export const mockAccuracyMetrics: AccuracyMetrics[] = [
  { tech: "UWB", rmse: 0.68, cep50: 0.52, cep95: 1.24, sampleCount: 12450 },
  { tech: "BLE", rmse: 1.34, cep50: 1.18, cep95: 2.86, sampleCount: 8320 },
  { tech: "WIFI_RTT", rmse: 2.12, cep50: 1.92, cep95: 4.35, sampleCount: 3210 },
];
