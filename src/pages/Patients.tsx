import { useEffect, useState } from "react";

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  created_at: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      const res = await fetch("http://174.91.138.238:3077/patients");
      const data = await res.json();

      if (data.patients) {
        setPatients(data.patients);
        setError("");
      } else {
        setError("Bad API response");
      }
    } catch (err) {
      setError("Failed to reach backend");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPatients, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Patients</h1>

      {loading && <p>Loading patients...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <table className="w-full border-collapse border border-gray-700">
          <thead>
            <tr className="bg-gray-800 text-left">
              <th className="p-2 border border-gray-700">ID</th>
              <th className="p-2 border border-gray-700">Name</th>
              <th className="p-2 border border-gray-700">DOB</th>
              <th className="p-2 border border-gray-700">Gender</th>
              <th className="p-2 border border-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-gray-900">
                <td className="p-2 border border-gray-700">{p.id}</td>
                <td className="p-2 border border-gray-700">
                  {p.first_name} {p.last_name}
                </td>
                <td className="p-2 border border-gray-700">{p.date_of_birth}</td>
                <td className="p-2 border border-gray-700">{p.gender}</td>
                <td className="p-2 border border-gray-700">
                  {new Date(p.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
