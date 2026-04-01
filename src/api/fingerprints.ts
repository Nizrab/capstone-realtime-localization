const API = import.meta.env.VITE_API_BASE_URL;

export interface Fingerprint {
  room: string;
  vector: Record<string, number>;
}

export interface BatchSummary {
  batch_id: string;
  count: number;
  created_at: string;
}

export interface BatchDetail {
  batch_id: string;
  created_at: string;
  count: number;
  fingerprints: Fingerprint[];
}

export async function listBatches(): Promise<{ batches: BatchSummary[] }> {
  const res = await fetch(`${API}/api/fingerprints`);
  if (!res.ok) throw new Error("Failed to list batches");
  return res.json();
}

export async function getBatch(batchId: string): Promise<BatchDetail> {
  const res = await fetch(`${API}/api/fingerprints/${batchId}`);
  if (!res.ok) throw new Error(`Batch ${batchId} not found`);
  return res.json();
}
