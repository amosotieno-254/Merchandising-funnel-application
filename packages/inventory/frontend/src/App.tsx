import { useCallback, useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3003/api/v1';
const LOW_STOCK = 10;

type Stock = {
  id: string;
  productCode: string;
  location: string;
  onHand: number;
  allocated: number;
  unitCost: string | number;
  updatedAt?: string;
};

type View = 'dashboard' | 'stock' | 'receive' | 'sell' | 'availability';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'stock', label: 'Stock', icon: '☰' },
  { id: 'receive', label: 'Receive Stock', icon: '↓' },
  { id: 'sell', label: 'Sell / Issue', icon: '↑' },
  { id: 'availability', label: 'Availability', icon: '?' },
];

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

function currentView(): View {
  const h = window.location.hash.replace('#', '') as View;
  return NAV.some((n) => n.id === h) ? h : 'dashboard';
}

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API}/stock`);
      const res = await r.json();
      setStock(res.data ?? []);
    } catch {
      setError('Could not reach the inventory service on port 3003.');
      setStock([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onHash = () => setView(currentView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (v: View) => {
    window.location.hash = v;
    setView(v);
    setMenuOpen(false);
  };

  const title = NAV.find((n) => n.id === view)?.label;

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Inventory</strong>
            <small>Control Center</small>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-btn ${view === n.id ? 'active' : ''}`}
              onClick={() => go(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">API: localhost:3003</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)}>
            ☰
          </button>
          <h1>{title}</h1>
          <button className="btn ghost" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : '⟳ Refresh'}
          </button>
        </header>

        <main className="content">
          {error && <div className="alert error">{error}</div>}
          {view === 'dashboard' && <Dashboard stock={stock} go={go} />}
          {view === 'stock' && <StockTable stock={stock} />}
          {view === 'receive' && <ReceiveForm onDone={load} />}
          {view === 'sell' && <SellForm onDone={load} />}
          {view === 'availability' && <Availability />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ stock, go }: { stock: Stock[]; go: (v: View) => void }) {
  const stats = useMemo(() => {
    const onHand = stock.reduce((a, s) => a + s.onHand, 0);
    const allocated = stock.reduce((a, s) => a + s.allocated, 0);
    const value = stock.reduce((a, s) => a + s.onHand * Number(s.unitCost), 0);
    const locations = new Set(stock.map((s) => s.location)).size;
    return { onHand, allocated, value, locations };
  }, [stock]);

  const low = stock.filter((s) => s.onHand - s.allocated <= LOW_STOCK);

  return (
    <>
      <div className="cards">
        <Card label="SKUs tracked" value={stock.length} sub={`${stats.locations} locations`} />
        <Card label="Units on hand" value={stats.onHand.toLocaleString()} />
        <Card label="Allocated" value={stats.allocated.toLocaleString()} />
        <Card label="Stock value" value={money(stats.value)} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Low stock</h2>
            <span className="badge warn">{low.length}</span>
          </div>
          {low.length === 0 ? (
            <p className="muted">Everything is above {LOW_STOCK} available units.</p>
          ) : (
            <ul className="list">
              {low.map((s) => (
                <li key={s.id}>
                  <span>
                    <strong>{s.productCode}</strong> <small className="muted">{s.location}</small>
                  </span>
                  <span className="badge warn">{s.onHand - s.allocated} avail</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Quick actions</h2>
          </div>
          <div className="actions">
            <button className="btn primary" onClick={() => go('receive')}>↓ Receive stock</button>
            <button className="btn" onClick={() => go('sell')}>↑ Sell / issue</button>
            <button className="btn" onClick={() => go('availability')}>? Check availability</button>
            <button className="btn" onClick={() => go('stock')}>☰ View all stock</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {sub && <small className="muted">{sub}</small>}
    </div>
  );
}

function StockTable({ stock }: { stock: Stock[] }) {
  const [q, setQ] = useState('');
  const rows = stock.filter((s) =>
    `${s.productCode} ${s.location}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="panel">
      <div className="panel-head">
        <input
          className="search"
          placeholder="Search product or location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="muted">{rows.length} rows</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Location</th>
              <th className="num">On hand</th>
              <th className="num">Allocated</th>
              <th className="num">Available</th>
              <th className="num">Unit cost</th>
              <th className="num">Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">No stock records.</td>
              </tr>
            )}
            {rows.map((s) => {
              const avail = s.onHand - s.allocated;
              return (
                <tr key={s.id}>
                  <td><strong>{s.productCode}</strong></td>
                  <td>{s.location}</td>
                  <td className="num">{s.onHand}</td>
                  <td className="num">{s.allocated}</td>
                  <td className="num">
                    <span className={`badge ${avail <= LOW_STOCK ? 'warn' : 'ok'}`}>{avail}</span>
                  </td>
                  <td className="num">{money(Number(s.unitCost))}</td>
                  <td className="num">{money(s.onHand * Number(s.unitCost))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function post(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(res.error ?? res.message ?? `Request failed (${r.status})`);
  return res;
}

function useStatus() {
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return { status, setStatus, busy, setBusy };
}

function ReceiveForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ productCode: '', location: '', quantity: '', unitCost: '' });
  const { status, setStatus, busy, setBusy } = useStatus();

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await post('/stock/receive', {
        productCode: f.productCode.trim(),
        location: f.location.trim(),
        quantity: Number(f.quantity),
        unitCost: f.unitCost,
      });
      setStatus({ kind: 'ok', msg: `Received ${f.quantity} × ${f.productCode} at ${f.location}.` });
      setF({ productCode: '', location: '', quantity: '', unitCost: '' });
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Receive stock</h2>
      <form onSubmit={submit} className="form">
        <Field label="Product code" value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
        <Field label="Location" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
        <div className="row">
          <Field label="Quantity" type="number" min="1" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} />
          <Field label="Unit cost" type="number" step="0.01" min="0" value={f.unitCost} onChange={(v) => setF({ ...f, unitCost: v })} />
        </div>
        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Receive'}</button>
      </form>
    </section>
  );
}

function SellForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ productCode: '', location: '', quantity: '' });
  const { status, setStatus, busy, setBusy } = useStatus();

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await post('/stock/sell', {
        productCode: f.productCode.trim(),
        location: f.location.trim(),
        quantity: Number(f.quantity),
      });
      setStatus({ kind: 'ok', msg: `Issued ${f.quantity} × ${f.productCode} from ${f.location}.` });
      setF({ productCode: '', location: '', quantity: '' });
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Sell / issue stock</h2>
      <form onSubmit={submit} className="form">
        <Field label="Product code" value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
        <Field label="Location" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
        <Field label="Quantity" type="number" min="1" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} />
        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Issue stock'}</button>
      </form>
    </section>
  );
}

function Availability() {
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const { status, setStatus, busy, setBusy } = useStatus();

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    setResult(null);
    try {
      const r = await fetch(
        `${API}/stock/${encodeURIComponent(code.trim())}/available?location=${encodeURIComponent(location.trim())}`
      );
      const res = await r.json();
      setResult(res.data?.available ?? 0);
    } catch {
      setStatus({ kind: 'error', msg: 'Lookup failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Check availability</h2>
      <form onSubmit={submit} className="form">
        <Field label="Product code" value={code} onChange={setCode} />
        <Field label="Location" value={location} onChange={setLocation} />
        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Checking…' : 'Check'}</button>
      </form>
      {result !== null && (
        <div className="result">
          <span className="muted">Available</span>
          <strong>{result}</strong>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}
