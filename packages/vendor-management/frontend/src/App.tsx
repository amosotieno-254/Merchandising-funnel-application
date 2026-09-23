import { useCallback, useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3001/api/v1';

type Supplier = {
  id: string;
  name: string;
  contactEmail: string;
  paymentTerms: string;
  leadTimeDays: number;
  createdAt?: string;
};

type SupplierProduct = {
  id: string;
  supplierId: string;
  productCode: string;
  unitCost: string | number;
};

type View = 'dashboard' | 'suppliers' | 'add' | 'catalog';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'suppliers', label: 'Suppliers', icon: '☰' },
  { id: 'add', label: 'Add Supplier', icon: '+' },
  { id: 'catalog', label: 'Product Catalog', icon: '◫' },
];

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok || res.success === false) throw new Error(res.error ?? `Request failed (${r.status})`);
  return res.data as T;
}

function currentView(): View {
  const h = window.location.hash.replace('#', '') as View;
  return NAV.some((n) => n.id === h) ? h : 'dashboard';
}

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSuppliers(await api<Supplier[]>('/suppliers'));
    } catch {
      setError('Could not reach the vendor management service on port 3001.');
      setSuppliers([]);
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

  const openCatalog = (id: string) => {
    setSelectedId(id);
    go('catalog');
  };

  const title = NAV.find((n) => n.id === view)?.label;

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Vendors</strong>
            <small>Management Portal</small>
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
        <div className="sidebar-foot">API: localhost:3001</div>
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
          {view === 'dashboard' && <Dashboard suppliers={suppliers} go={go} open={openCatalog} />}
          {view === 'suppliers' && <SupplierTable suppliers={suppliers} open={openCatalog} />}
          {view === 'add' && <AddSupplier onDone={load} />}
          {view === 'catalog' && (
            <Catalog suppliers={suppliers} selectedId={selectedId} setSelectedId={setSelectedId} />
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  suppliers,
  go,
  open,
}: {
  suppliers: Supplier[];
  go: (v: View) => void;
  open: (id: string) => void;
}) {
  const stats = useMemo(() => {
    const avgLead = suppliers.length
      ? suppliers.reduce((a, s) => a + s.leadTimeDays, 0) / suppliers.length
      : 0;
    const terms = new Set(suppliers.map((s) => s.paymentTerms)).size;
    const fastest = [...suppliers].sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0];
    return { avgLead, terms, fastest };
  }, [suppliers]);

  const slowest = [...suppliers].sort((a, b) => b.leadTimeDays - a.leadTimeDays).slice(0, 5);

  return (
    <>
      <div className="cards">
        <Card label="Suppliers" value={suppliers.length} />
        <Card label="Avg lead time" value={`${stats.avgLead.toFixed(1)} days`} />
        <Card label="Payment terms in use" value={stats.terms} />
        <Card
          label="Fastest supplier"
          value={stats.fastest ? `${stats.fastest.leadTimeDays} days` : '—'}
          sub={stats.fastest?.name}
        />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Longest lead times</h2>
          </div>
          {slowest.length === 0 ? (
            <p className="muted">No suppliers yet.</p>
          ) : (
            <ul className="list">
              {slowest.map((s) => (
                <li key={s.id}>
                  <span>
                    <strong>{s.name}</strong> <small className="muted">{s.paymentTerms}</small>
                  </span>
                  <span className="inline">
                    <span className={`badge ${s.leadTimeDays > 14 ? 'warn' : 'ok'}`}>
                      {s.leadTimeDays} days
                    </span>
                    <button className="btn sm" onClick={() => open(s.id)}>Catalog</button>
                  </span>
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
            <button className="btn primary" onClick={() => go('add')}>+ Add supplier</button>
            <button className="btn" onClick={() => go('suppliers')}>☰ View suppliers</button>
            <button className="btn" onClick={() => go('catalog')}>◫ Product catalog</button>
          </div>
        </section>
      </div>
    </>
  );
}

function SupplierTable({ suppliers, open }: { suppliers: Supplier[]; open: (id: string) => void }) {
  const [q, setQ] = useState('');
  const rows = suppliers.filter((s) =>
    `${s.name} ${s.contactEmail} ${s.paymentTerms}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="panel">
      <div className="panel-head">
        <input
          className="search"
          placeholder="Search name, email or terms…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="muted">{rows.length} suppliers</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Payment terms</th>
              <th className="num">Lead time</th>
              <th className="num">Added</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">No suppliers.</td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.contactEmail}</td>
                <td><span className="badge info">{s.paymentTerms}</span></td>
                <td className="num">{s.leadTimeDays} days</td>
                <td className="num">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</td>
                <td className="num">
                  <button className="btn sm" onClick={() => open(s.id)}>Products</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function useStatus() {
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return { status, setStatus, busy, setBusy };
}

function AddSupplier({ onDone }: { onDone: () => void }) {
  const empty = { name: '', contactEmail: '', paymentTerms: 'NET30', leadTimeDays: '' };
  const [f, setF] = useState(empty);
  const { status, setStatus, busy, setBusy } = useStatus();

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const s = await api<Supplier>('/suppliers', {
        name: f.name.trim(),
        contactEmail: f.contactEmail.trim(),
        paymentTerms: f.paymentTerms.trim(),
        leadTimeDays: Number(f.leadTimeDays),
      });
      setStatus({ kind: 'ok', msg: `Supplier ${s.name} created.` });
      setF(empty);
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Add supplier</h2>
      <form onSubmit={submit} className="form">
        <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="Contact email" type="email" value={f.contactEmail} onChange={(v) => setF({ ...f, contactEmail: v })} />
        <div className="row">
          <label className="field">
            <span>Payment terms</span>
            <select value={f.paymentTerms} onChange={(e) => setF({ ...f, paymentTerms: e.target.value })}>
              {['NET15', 'NET30', 'NET45', 'NET60', 'COD', 'PREPAID'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <Field label="Lead time (days)" type="number" min="0" value={f.leadTimeDays} onChange={(v) => setF({ ...f, leadTimeDays: v })} />
        </div>
        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Create supplier'}</button>
      </form>
    </section>
  );
}

function Catalog({
  suppliers,
  selectedId,
  setSelectedId,
}: {
  suppliers: Supplier[];
  selectedId: string;
  setSelectedId: (id: string) => void;
}) {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [f, setF] = useState({ productCode: '', unitCost: '' });
  const { status, setStatus, busy, setBusy } = useStatus();
  const supplier = suppliers.find((s) => s.id === selectedId);

  const loadProducts = useCallback(async () => {
    if (!selectedId) return setProducts([]);
    try {
      setProducts(await api<SupplierProduct[]>(`/suppliers/${selectedId}/products`));
    } catch {
      setProducts([]);
    }
  }, [selectedId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await api(`/suppliers/${selectedId}/products`, {
        productCode: f.productCode.trim(),
        unitCost: f.unitCost,
      });
      setStatus({ kind: 'ok', msg: `Added ${f.productCode} to ${supplier?.name}.` });
      setF({ productCode: '', unitCost: '' });
      loadProducts();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select a supplier…</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {supplier && (
            <span className="muted">
              {supplier.contactEmail} · {supplier.paymentTerms} · {supplier.leadTimeDays} days
            </span>
          )}
        </div>
        {!selectedId ? (
          <p className="muted">Pick a supplier to see and manage the products it supplies.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product code</th>
                  <th className="num">Unit cost</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr>
                    <td colSpan={2} className="empty">No products for this supplier yet.</td>
                  </tr>
                )}
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.productCode}</strong></td>
                    <td className="num">{money(Number(p.unitCost))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedId && (
        <section className="panel narrow">
          <h2>Add product to {supplier?.name}</h2>
          <form onSubmit={submit} className="form">
            <div className="row">
              <Field label="Product code" value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
              <Field label="Unit cost" type="number" step="0.01" min="0" value={f.unitCost} onChange={(v) => setF({ ...f, unitCost: v })} />
            </div>
            {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
            <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Add product'}</button>
          </form>
        </section>
      )}
    </div>
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
