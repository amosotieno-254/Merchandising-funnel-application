import { useCallback, useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3002/api/v1';
const VENDOR_API = 'http://localhost:3001/api/v1';

type PurchaseOrder = {
  id: string;
  supplierId: string;
  status: string;
  paymentTerms: string;
  totalCost: string | number;
  createdAt?: string;
};

type PoLine = {
  id: string;
  productCode: string;
  quantity: number;
  unitCost: string | number;
  receivedQuantity: number;
};

type Supplier = { id: string; name: string; paymentTerms: string };

type View = 'dashboard' | 'orders' | 'create';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'orders', label: 'Purchase Orders', icon: '☰' },
  { id: 'create', label: 'Create PO', icon: '+' },
];

const money = (n: number) =>
  n.toLocaleString('en-KE', { style: 'currency', currency: 'KES' });

const short = (id: string) => `${id.slice(0, 8)}…`;

async function api<T>(path: string, body?: unknown, base = API): Promise<T> {
  const r = await fetch(`${base}${path}`, {
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

function statusBadge(status: string) {
  if (status === 'APPROVED') return 'ok';
  if (status === 'DRAFT') return 'warn';
  return 'neutral';
}

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await api<PurchaseOrder[]>('/purchase-orders'));
    } catch {
      setError('Could not reach the procurement service on port 3002.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
    // Supplier names are a nice-to-have; the app still works without the vendor service.
    api<Supplier[]>('/suppliers', undefined, VENDOR_API)
      .then(setSuppliers)
      .catch(() => setSuppliers([]));
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

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? short(id);
  const title = NAV.find((n) => n.id === view)?.label;

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Procurement</strong>
            <small>Purchasing Dashboard</small>
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
        <div className="sidebar-foot">API: localhost:3002</div>
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
          {view === 'dashboard' && <Dashboard orders={orders} go={go} supplierName={supplierName} />}
          {view === 'orders' && <OrdersView orders={orders} supplierName={supplierName} onChange={load} />}
          {view === 'create' && <CreatePo suppliers={suppliers} onDone={load} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  orders,
  go,
  supplierName,
}: {
  orders: PurchaseOrder[];
  go: (v: View) => void;
  supplierName: (id: string) => string;
}) {
  const stats = useMemo(() => {
    const drafts = orders.filter((o) => o.status === 'DRAFT');
    const approved = orders.filter((o) => o.status === 'APPROVED');
    const value = orders.reduce((a, o) => a + Number(o.totalCost), 0);
    const pendingValue = drafts.reduce((a, o) => a + Number(o.totalCost), 0);
    return { drafts, approved, value, pendingValue };
  }, [orders]);

  return (
    <>
      <div className="cards">
        <Card label="Purchase orders" value={orders.length} />
        <Card label="Awaiting approval" value={stats.drafts.length} sub={money(stats.pendingValue)} />
        <Card label="Approved" value={stats.approved.length} />
        <Card label="Total PO value" value={money(stats.value)} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Awaiting approval</h2>
            <span className="badge warn">{stats.drafts.length}</span>
          </div>
          {stats.drafts.length === 0 ? (
            <p className="muted">No draft purchase orders.</p>
          ) : (
            <ul className="list">
              {stats.drafts.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <span>
                    <strong>{supplierName(o.supplierId)}</strong>{' '}
                    <small className="muted mono">PO {short(o.id)}</small>
                  </span>
                  <span>{money(Number(o.totalCost))}</span>
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
            <button className="btn primary" onClick={() => go('create')}>+ Create PO</button>
            <button className="btn" onClick={() => go('orders')}>☰ Review orders</button>
          </div>
        </section>
      </div>
    </>
  );
}

function OrdersView({
  orders,
  supplierName,
  onChange,
}: {
  orders: PurchaseOrder[];
  supplierName: (id: string) => string;
  onChange: () => void;
}) {
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [lines, setLines] = useState<PoLine[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);

  const statuses = ['ALL', ...new Set(orders.map((o) => o.status))];
  const rows = orders
    .filter((o) => filter === 'ALL' || o.status === filter)
    .filter((o) => `${o.id} ${supplierName(o.supplierId)} ${o.paymentTerms}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  useEffect(() => {
    if (!selected) return setLines([]);
    api<PurchaseOrder & { lines: PoLine[] }>(`/purchase-orders/${selected}`)
      .then((po) => setLines(po.lines ?? []))
      .catch(() => setLines([]));
  }, [selected]);

  const approve = async (id: string) => {
    setBusyId(id);
    setStatus(null);
    try {
      await api(`/purchase-orders/${id}/approve`, {});
      setStatus({ kind: 'ok', msg: `PO ${short(id)} approved.` });
      onChange();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusyId(null);
    }
  };

  const po = orders.find((o) => o.id === selected);

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <input
            className="search"
            placeholder="Search PO, supplier or terms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PO</th>
                <th>Supplier</th>
                <th>Terms</th>
                <th>Status</th>
                <th className="num">Total</th>
                <th className="num">Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No purchase orders.</td>
                </tr>
              )}
              {rows.map((o) => (
                <tr
                  key={o.id}
                  className={`clickable ${selected === o.id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected === o.id ? null : o.id)}
                >
                  <td className="mono">{short(o.id)}</td>
                  <td><strong>{supplierName(o.supplierId)}</strong></td>
                  <td>{o.paymentTerms}</td>
                  <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                  <td className="num">{money(Number(o.totalCost))}</td>
                  <td className="num">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="num">
                    {o.status === 'DRAFT' && (
                      <button
                        className="btn sm primary"
                        disabled={busyId === o.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          approve(o.id);
                        }}
                      >
                        {busyId === o.id ? 'Approving…' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {po && (
        <section className="panel">
          <div className="panel-head">
            <h2>
              PO <span className="mono">{po.id}</span>
            </h2>
            <span className={`badge ${statusBadge(po.status)}`}>{po.status}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Ordered</th>
                  <th className="num">Received</th>
                  <th className="num">Unit cost</th>
                  <th className="num">Line total</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">No lines.</td>
                  </tr>
                )}
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.productCode}</strong></td>
                    <td className="num">{l.quantity}</td>
                    <td className="num">
                      <span className={`badge ${l.receivedQuantity >= l.quantity ? 'ok' : 'neutral'}`}>
                        {l.receivedQuantity}
                      </span>
                    </td>
                    <td className="num">{money(Number(l.unitCost))}</td>
                    <td className="num">{money(Number(l.unitCost) * l.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

type DraftLine = { productCode: string; quantity: string; unitCost: string };
const emptyLine: DraftLine = { productCode: '', quantity: '', unitCost: '' };

function CreatePo({ suppliers, onDone }: { suppliers: Supplier[]; onDone: () => void }) {
  const [supplierId, setSupplierId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('NET30');
  const [lines, setLines] = useState<DraftLine[]>([{ ...emptyLine }]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const total = lines.reduce((a, l) => a + Number(l.quantity || 0) * Number(l.unitCost || 0), 0);

  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const pickSupplier = (id: string) => {
    setSupplierId(id);
    const s = suppliers.find((x) => x.id === id);
    if (s) setPaymentTerms(s.paymentTerms);
  };

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const po = await api<PurchaseOrder>('/purchase-orders', {
        supplierId: supplierId.trim(),
        paymentTerms: paymentTerms.trim(),
        lines: lines.map((l) => ({
          productCode: l.productCode.trim(),
          quantity: Number(l.quantity),
          unitCost: l.unitCost,
        })),
      });
      setStatus({ kind: 'ok', msg: `Draft PO ${short(po.id)} created for ${money(Number(po.totalCost))}.` });
      setLines([{ ...emptyLine }]);
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 760 }}>
      <h2>New purchase order</h2>
      <form onSubmit={submit} className="form">
        <div className="row">
          {suppliers.length > 0 ? (
            <label className="field">
              <span>Supplier</span>
              <select required value={supplierId} onChange={(e) => pickSupplier(e.target.value)}>
                <option value="">Select a supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <Field label="Supplier ID" value={supplierId} onChange={setSupplierId} placeholder="Vendor service offline — paste a UUID" />
          )}
          <Field label="Payment terms" value={paymentTerms} onChange={setPaymentTerms} />
        </div>

        <h2 style={{ marginTop: 8, marginBottom: 0 }}>Lines</h2>
        {lines.map((l, i) => (
          <div className="line-row" key={i}>
            <Field label="Product code" value={l.productCode} onChange={(v) => setLine(i, { productCode: v })} />
            <Field label="Quantity" type="number" min="1" value={l.quantity} onChange={(v) => setLine(i, { quantity: v })} />
            <Field label="Unit cost" type="number" step="0.01" min="0" value={l.unitCost} onChange={(v) => setLine(i, { unitCost: v })} />
            <button
              type="button"
              className="btn"
              disabled={lines.length === 1}
              onClick={() => setLines(lines.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <div className="inline" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn" onClick={() => setLines([...lines, { ...emptyLine }])}>
            + Add line
          </button>
          <strong>Total: {money(total)}</strong>
        </div>

        {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Create draft PO'}</button>
      </form>
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
