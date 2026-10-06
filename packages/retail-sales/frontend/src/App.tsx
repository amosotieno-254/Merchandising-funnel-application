import { useCallback, useEffect, useState } from 'react';

const API = 'http://localhost:3006/api/v1';

interface CartLine {
  productCode: string;
  quantity: number;
  unitPrice: string;
  discount: string;
}

interface Sale {
  id: string;
  registerId: string;
  storeId: string;
  cashierId: string;
  totalAmount: string;
  paymentMethod: string;
  status?: string;
  createdAt: string;
}

interface Register {
  registerId: string;
  storeId: string;
  cashierId: string;
  location: string;
}

type View = 'terminal' | 'history' | 'settings';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'terminal', label: 'Terminal', icon: '▦' },
  { id: 'history', label: 'Sales History', icon: '≡' },
  { id: 'settings', label: 'Register', icon: '⚙' },
];

const PAYMENTS = ['CASH', 'CARD', 'MPESA'];

const kes = (n: number | string) =>
  Number(n).toLocaleString('en-KE', { style: 'currency', currency: 'KES' });

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    cache: 'no-store',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok || res.success === false) throw new Error(res.error ?? `Request failed (${r.status})`);
  return res.data as T;
}

function currentView(): View {
  const h = window.location.hash.replace('#', '') as View;
  return NAV.some((n) => n.id === h) ? h : 'terminal';
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [sales, setSales] = useState<Sale[]>([]);
  const [register, setRegister] = useState<Register>({
    registerId: 'REG-01',
    storeId: 'STORE-3',
    cashierId: 'CASHIER-01',
    location: 'MAIN_WAREHOUSE',
  });
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    const started = Date.now();
    setLoading(true);
    setError(null);
    try {
      setSales(await api<Sale[]>('/sales'));
      setUpdatedAt(new Date());
    } catch {
      setError('Could not reach the retail sales service on port 3006.');
    } finally {
      // Keep the loading state visible long enough to register as a refresh.
      await new Promise((r) => setTimeout(r, Math.max(0, 400 - (Date.now() - started))));
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
          <span className="logo">◧</span>
          <div>
            <strong>Retail POS</strong>
            <small>Checkout Terminal</small>
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
        <div className="sidebar-foot">
          {register.registerId} · {register.cashierId}
          <br />
          API: localhost:3006
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)}>
            ☰
          </button>
          <h1>{title}</h1>
          {updatedAt && <small className="muted">Updated {updatedAt.toLocaleTimeString()}</small>}
          <button className="btn ghost" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : '⟳ Refresh'}
          </button>
        </header>

        <main className="content">
          {error && <div className="alert error">{error}</div>}
          {view === 'terminal' && <Terminal sales={sales} register={register} onDone={load} />}
          {view === 'history' && <History sales={sales} />}
          {view === 'settings' && <Settings register={register} setRegister={setRegister} />}
        </main>
      </div>
    </div>
  );
}

function Terminal({ sales, register, onDone }: { sales: Sale[]; register: Register; onDone: () => void }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [f, setF] = useState({ productCode: '', quantity: '1', unitPrice: '' });
  const [payment, setPayment] = useState('CASH');
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const today = sales.filter((s) => isToday(s.createdAt));
  const revenue = today.reduce((a, s) => a + Number(s.totalAmount), 0);
  const items = cart.reduce((a, l) => a + l.quantity, 0);
  const total = cart.reduce((a, l) => a + Number(l.unitPrice) * l.quantity - Number(l.discount), 0);

  const add = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const code = f.productCode.trim().toUpperCase();
    const qty = Number(f.quantity);
    const price = Number(f.unitPrice).toFixed(2);
    const existing = cart.findIndex((l) => l.productCode === code && l.unitPrice === price);
    if (existing >= 0) {
      setQty(existing, cart[existing].quantity + qty);
    } else {
      setCart([...cart, { productCode: code, quantity: qty, unitPrice: price, discount: '0.00' }]);
    }
    setF({ productCode: '', quantity: '1', unitPrice: '' });
    setStatus(null);
  };

  const setQty = (i: number, q: number) =>
    setCart((c) => (q <= 0 ? c.filter((_, j) => j !== i) : c.map((l, j) => (j === i ? { ...l, quantity: q } : l))));

  const charge = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const sale = await api<Sale>('/sales', { ...register, paymentMethod: payment, lines: cart });
      setStatus({ kind: 'ok', msg: `Sale ${sale.id.slice(0, 8)} completed · ${kes(sale.totalAmount)} via ${payment}.` });
      setCart([]);
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="cards">
        <Card label="Sales today" value={today.length} />
        <Card label="Revenue today" value={kes(revenue)} />
        <Card label="Avg. basket" value={kes(today.length ? revenue / today.length : 0)} />
        <Card label="All-time sales" value={sales.length} />
      </div>

      <div className="pos">
        <div className="stack">
          <section className="panel">
            <h2>Scan item</h2>
            <form onSubmit={add} className="line-row">
              <Field label="Product code" placeholder="e.g. SKU-1001" autoFocus value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
              <Field label="Qty" type="number" min="1" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} />
              <Field label="Unit price (KES)" type="number" min="0" step="0.01" value={f.unitPrice} onChange={(v) => setF({ ...f, unitPrice: v })} />
              <button className="btn primary">+ Add</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Cart</h2>
              {cart.length > 0 && (
                <button className="btn sm ghost" onClick={() => setCart([])}>Clear</button>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th className="num">Price</th>
                    <th className="num">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty">Cart is empty. Scan an item to start a sale.</td>
                    </tr>
                  )}
                  {cart.map((l, i) => (
                    <tr key={`${l.productCode}-${l.unitPrice}`}>
                      <td><strong>{l.productCode}</strong></td>
                      <td>
                        <span className="qty">
                          <button className="btn sm" onClick={() => setQty(i, l.quantity - 1)}>−</button>
                          <span className="mono">{l.quantity}</span>
                          <button className="btn sm" onClick={() => setQty(i, l.quantity + 1)}>+</button>
                        </span>
                      </td>
                      <td className="num">{kes(l.unitPrice)}</td>
                      <td className="num">{kes(Number(l.unitPrice) * l.quantity)}</td>
                      <td className="num">
                        <button className="x" title="Remove" onClick={() => setQty(i, 0)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="panel">
          <div className="lcd">
            <small>
              <span>{register.registerId}</span>
              <span>Total due</span>
            </small>
            <strong>{kes(total)}</strong>
          </div>
          <div className="totals">
            <div><span className="muted">Lines</span><span className="mono">{cart.length}</span></div>
            <div><span className="muted">Items</span><span className="mono">{items}</span></div>
          </div>
          <h2>Payment</h2>
          <div className="pay" style={{ marginBottom: 16 }}>
            {PAYMENTS.map((p) => (
              <button key={p} className={`btn ${payment === p ? 'active' : ''}`} onClick={() => setPayment(p)}>
                {p}
              </button>
            ))}
          </div>
          {status && <div className={`alert ${status.kind}`} style={{ marginBottom: 12 }}>{status.msg}</div>}
          <button className="btn primary charge" disabled={busy || cart.length === 0} onClick={charge}>
            {busy ? 'Processing…' : `Charge ${kes(total)}`}
          </button>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            Stock is checked with Inventory at {register.location} before the sale is finalised.
          </p>
        </section>
      </div>
    </>
  );
}

function History({ sales }: { sales: Sale[] }) {
  const [q, setQ] = useState('');
  const rows = [...sales]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((s) => `${s.id} ${s.registerId} ${s.cashierId} ${s.paymentMethod}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Sales history</h2>
        <input className="search" placeholder="Search sale, register, cashier…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Sale</th>
              <th>Register</th>
              <th>Cashier</th>
              <th>Payment</th>
              <th className="num">Total</th>
              <th className="num">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">No sales yet.</td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td className="mono">{s.id.slice(0, 8)}</td>
                <td>{s.registerId}</td>
                <td>{s.cashierId}</td>
                <td><span className="badge info">{s.paymentMethod}</span></td>
                <td className="num">{kes(s.totalAmount)}</td>
                <td className="num">{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Settings({ register, setRegister }: { register: Register; setRegister: (r: Register) => void }) {
  const set = (k: keyof Register) => (v: string) => setRegister({ ...register, [k]: v });
  return (
    <section className="panel narrow">
      <h2>Register settings</h2>
      <div className="form">
        <div className="row">
          <Field label="Register ID" value={register.registerId} onChange={set('registerId')} />
          <Field label="Store" value={register.storeId} onChange={set('storeId')} />
        </div>
        <Field label="Cashier" value={register.cashierId} onChange={set('cashierId')} />
        <Field label="Inventory location" value={register.location} onChange={set('location')} />
        <p className="muted" style={{ fontSize: 13 }}>Changes apply to the next sale on this terminal.</p>
      </div>
    </section>
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
