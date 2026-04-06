const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export interface APIPosition {
  device_id: string;
  location_id: string;
  floor_id: string;
  room_id: string;
  x: number;
  y: number;
  confidence: number;
  timestamp: string;
  rssi_vector: Record<string, number>;
  scan_number: number;
}

export interface APIAnchor {
  id: string;
  label: string;
  tech: string;
  status: string;
  rssi: number | null;
  lastSeen: string;
  firmware: string;
}

export interface APITag {
  id: string;
  label: string;
  tech: string;
  status: string;
  position: { x: number; y: number };
  floor_id: string;
  room_id: string;
  location_id: string;
  confidence: number;
  lastSeen: string;
  batteryPct: number;
  firmware: string;
  scan_number: number;
}

export interface APIHealth {
  status: string;
  s3_connected: boolean;
  timestamp: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  if (!API_BASE) throw new Error('VITE_API_BASE_URL not configured');
  const res = await fetch(API_BASE + path, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('API ' + path + ' returned HTTP ' + res.status);
  return res.json();
}

export async function fetchPositions(): Promise<APIPosition[]> {
  const d = await apiFetch<{ devices: APIPosition[] }>('/api/positions');
  return d.devices || [];
}

export async function fetchAnchors(): Promise<APIAnchor[]> {
  return apiFetch<APIAnchor[]>('/api/v1/anchors');
}

export async function fetchTags(): Promise<APITag[]> {
  return apiFetch<APITag[]>('/api/v1/tags');
}

export async function fetchHealth(): Promise<APIHealth> {
  return apiFetch<APIHealth>('/api/health');
}
