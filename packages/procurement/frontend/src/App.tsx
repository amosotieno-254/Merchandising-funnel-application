import { useEffect, useState } from 'react';

export default function App() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3002/api/v1/purchase-orders')
      .then((r) => r.json())
      .then((res) => setOrders(res.data ?? []))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Procurement Dashboard</h1>
      <ul>
        {orders.map((po) => (
          <li key={po.id}>
            PO {po.id} — {po.status} — Total: {po.totalCost}
          </li>
        ))}
      </ul>
    </div>
  );
}