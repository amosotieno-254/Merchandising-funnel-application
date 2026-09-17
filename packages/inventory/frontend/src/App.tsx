import { useEffect, useState } from 'react';

export default function App() {
  const [stock, setStock] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3003/api/v1/stock')
      .then((r) => r.json())
      .then((res) => setStock(res.data ?? []))
      .catch(() => setStock([]));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Inventory Control Center</h1>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Location</th>
            <th>On Hand</th>
            <th>Allocated</th>
            <th>Unit Cost</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s) => (
            <tr key={s.id}>
              <td>{s.productCode}</td>
              <td>{s.location}</td>
              <td>{s.onHand}</td>
              <td>{s.allocated}</td>
              <td>{s.unitCost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}