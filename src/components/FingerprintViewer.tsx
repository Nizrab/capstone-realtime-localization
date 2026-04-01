import { useEffect, useState } from "react";
import { listBatches, getBatch, type BatchSummary, type Fingerprint } from "../api/fingerprints";

function FingerprintViewer() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [data, setData] = useState<Fingerprint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBatches()
      .then((m) => setBatches(m.batches))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadBatch = async (batchId: string) => {
    try {
      const batch = await getBatch(batchId);
      setData(batch.fingerprints);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading batches...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Available Batches</h2>
      {batches.length === 0 && <p>No batches found.</p>}
      {batches.map((b) => (
        <button key={b.batch_id} onClick={() => loadBatch(b.batch_id)} style={{ margin: "4px", padding: "8px 12px", cursor: "pointer" }}>
          {b.batch_id} ({b.count} rooms)
        </button>
      ))}
      {data && (
        <table style={{ marginTop: "16px", borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>Room</th>
              <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>WAP Signals</th>
            </tr>
          </thead>
          <tbody>
            {data.map((fp, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>{fp.room}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                  {Object.entries(fp.vector).map(([wap, rssi]) => wap + ": " + rssi).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FingerprintViewer;
