import { useEffect, useState } from 'react';

export default function App() {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/suppliers')
      .then((r) => r.json())
      .then((res) => setSuppliers(res.data ?? []))
      .catch(() => setSuppliers([]));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Vendor Management Portal</h1>
      <ul>
        {suppliers.map((s) => (
          <li key={s.id}>
            {s.name} — {s.paymentTerms} — {s.leadTimeDays} days
          </li>
        ))}
      </ul>
    </div>
  );
}