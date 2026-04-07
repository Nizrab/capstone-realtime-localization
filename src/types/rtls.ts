export type RadioTech = "BLE" | "UWB" | "WIFI_RTT";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "geofence_breach"
  | "low_battery"
  | "anchor_offline"
  | "packet_loss"
  | "latency_sla"
  | "privacy_violation"
  | "unexpected_movement"
  | "weak_signal"
  | "low_confidence"
  | "tag_lost"
  | "ap_count_low";
export type Role =
  | "Operator"
  | "RFLead"
  | "Embedded"
  | "Algo"
  | "Backend"
  | "Security";
export type DeviceStatus = "online" | "offline" | "degraded";
export type AlertStatus = "open" | "acked" | "resolved";

export interface Floorplan {
  id: string;
  name: string;
  svgUrl: string;
  widthMeters: number;
  heightMeters: number;
  origin: { x: number; y: number };
  scalePxPerMeter: number;
}

export interface Anchor {
  id: string;
  label: string;
  tech: RadioTech;
  position: { x: number; y: number };
  firmware: string;
  status: DeviceStatus;
  snr?: number;
  rssi?: number;
  lastSeen: string;
}

export interface Tag {
  id: string;
  label: string;
  tech: RadioTech;
  batteryPct: number;
  sensors: {
    ppg?: number;
    tempC?: number;
    hr?: number;
    imu?: { ax: number; ay: number; az: number };
  };
  firmware: string;
  lastSeen: string;
  position?: { x: number; y: number };
  status?: string;
}

export interface TrackPoint {
  tagId: string;
  ts: string;
  pos: { x: number; y: number; z?: number };
  cov?: number;
  source: "raw" | "filtered" | "fingerprint";
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  createdAt: string;
  status: AlertStatus;
  entityId?: string;
  details?: Record<string, any>;
  geofenceId?: string;
}

export interface Geofence {
  id: string;
  name: string;
  polygon: Array<{ x: number; y: number }>;
  rule: "enter" | "exit" | "dwell";
  dwellSec?: number;
  active: boolean;
}

export interface HealthMetrics {
  ingestToUiMs: number;
  packetLossPct: number;
  wsConnected: boolean;
  uptime: number;
}

export interface AccuracyMetrics {
  tech: RadioTech;
  rmse: number;
  cep50: number;
  cep95: number;
  sampleCount: number;
}
