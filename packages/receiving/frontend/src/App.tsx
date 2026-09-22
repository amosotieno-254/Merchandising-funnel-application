import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3004';

interface ExpectedDelivery {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  paymentTerms: string;
}

interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  status: 'COMPLETE' | 'PARTIAL';
  createdAt: string;
}

export default function App() {
  const [deliveries, setDeliveries] = useState<ExpectedDelivery[]>([]);
  const [notes, setNotes] = useState<GoodsReceivedNote[]>([]);
  const [selected, setSelected] = useState<ExpectedDelivery | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [condition, setCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
  const [message, setMessage] = useState<string>('');

  async function loadData() {
    const [deliveriesRes, notesRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/expected-deliveries`).then((r) => r.json()),
      fetch(`${API_URL}/api/v1/goods-received-notes`).then((r) => r.json()),
    ]);
    setDeliveries(deliveriesRes.data ?? []);
    setNotes(notesRes.data ?? []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitGrn() {
    if (!selected) return;

    setMessage('Submitting...');

    const res = await fetch(`${API_URL}/api/v1/goods-received-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchaseOrderId: selected.purchaseOrderId,
        supplierId: selected.supplierId,
        lines: [
          {
            productCode: 'SKU-001',
            orderedQuantity: 100,
            receivedQuantity: receivedQty,
            condition,
          },
        ],
      }),
    });

    const json = await res.json();
    if (json.success) {
      setMessage(`✅ GRN created: ${json.data.id}`);
      setSelected(null);
      setReceivedQty(0);
      setCondition('GOOD');
      loadData();
    } else {
      setMessage(`❌ Failed: ${json.error}`);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 900 , margin:'0 auto',textAlign:'center'}}>
      <h1>Warehouse Receiving App</h1>

      {message && (
        <p style={{ padding: 10, background: '#f0f0f0', borderRadius: 4 }}>
          {message}
        </p>
      )}

      <h2>Expected Deliveries</h2>
      {deliveries.length === 0 ? (
        <p><em>No deliveries expected.</em></p>
      ) : (
        <ul>
          {deliveries.map((d) => (
            <li key={d.id} style={{ marginBottom: 8 }}>
              PO <code>{d.purchaseOrderId}</code> — terms: {d.paymentTerms}{' '}
              <button
                onClick={() => {
                  setSelected(d);
                  setReceivedQty(0);
                  setCondition('GOOD');
                  setMessage('');
                }}
              >
                Receive
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div
          style={{
            border: '1px solid #ccc',
            padding: 12,
            borderRadius: 4,
            marginTop: 20,
            background: '#fafafa',
          }}
        >
          <h3>Receiving PO {selected.purchaseOrderId}</h3>

          <label>
            Received quantity:{' '}
            <input
              type="number"
              value={receivedQty}
              onChange={(e) => setReceivedQty(Number(e.target.value))}
            />
          </label>
          <br />

          <label>
            Condition:{' '}
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as 'GOOD' | 'DAMAGED')
              }
            >
              <option value="GOOD">Good</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </label>
          <br />

          <button onClick={submitGrn} style={{ marginTop: 8 }}>
            Submit GRN
          </button>
          <button onClick={() => setSelected(null)} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      )}

      <h2 style={{ marginTop: 30 }}>GRN History</h2>
      {notes.length === 0 ? (
        <p><em>No GRNs yet.</em></p>
      ) : (
        <table
          border={1}
          cellPadding={6}
          style={{ borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>GRN ID</th>
              <th>PO</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td><code>{n.id.slice(0, 8)}…</code></td>
                <td><code>{n.purchaseOrderId.slice(0, 8)}…</code></td>
                <td>{n.status}</td>
                <td>{new Date(n.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}