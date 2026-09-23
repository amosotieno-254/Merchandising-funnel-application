import { useCallback, useEffect, useState } from 'react';

const API = 'http://localhost:3005/api/v1';

interface StorageBin {
  id: string;
  binCode: string;
  zone: string;
  capacity: number;
}

interface PutawayTask {
  id: string;
  productCode: string;
  quantity: number;
  assignedBinId: string | null;
  status: 'PENDING' | 'COMPLETED';
  createdAt?: string;
}

interface PickTask {
  id: string;
  productCode: string;
  quantity: number;
  fromBinId: string | null;
  status: string;
  createdAt?: string;
}

interface StockTransfer {
  id: string;
  productCode: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  createdAt?: string;
}

type View = 'dashboard' | 'bins' | 'putaway' | 'picks' | 'transfers';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'bins', label: 'Storage Bins', icon: '▤' },
  { id: 'putaway', label: 'Putaway', icon: '↓' },
  { id: 'picks', label: 'Pick Tasks', icon: '↑' },
  { id: 'transfers', label: 'Stock Transfers', icon: '⇄' },
];

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

type Status = { kind: 'ok' | 'error'; msg: string } | null;

function useSubmit(onDone: () => void) {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setStatus(null);
    try {
      setStatus({ kind: 'ok', msg: await fn() });
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return { status, busy, run };
}

export default function App() {
  const [view, setView] = useState<View>(currentView);
  const [bins, setBins] = useState<StorageBin[]>([]);
  const [putaway, setPutaway] = useState<PutawayTask[]>([]);
  const [picks, setPicks] = useState<PickTask[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, p, k, t] = await Promise.all([
        api<StorageBin[]>('/storage-bins'),
        api<PutawayTask[]>('/putaway-tasks'),
        api<PickTask[]>('/pick-tasks'),
        api<StockTransfer[]>('/stock-transfers'),
      ]);
      setBins(b);
      setPutaway(p);
      setPicks(k);
      setTransfers(t);
    } catch {
      setError('Could not reach the warehouse operations service on port 3005.');
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

  const binLabel = (id: string | null) => {
    if (!id) return '—';
    const b = bins.find((x) => x.id === id);
    return b ? `${b.binCode} (${b.zone})` : `${id.slice(0, 8)}…`;
  };

  const title = NAV.find((n) => n.id === view)?.label;

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Warehouse</strong>
            <small>Floor Operations</small>
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
        <div className="sidebar-foot">API: localhost:3005</div>
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
          {view === 'dashboard' && (
            <Dashboard bins={bins} putaway={putaway} picks={picks} transfers={transfers} go={go} />
          )}
          {view === 'bins' && <Bins bins={bins} onDone={load} />}
          {view === 'putaway' && <Putaway tasks={putaway} bins={bins} binLabel={binLabel} onDone={load} />}
          {view === 'picks' && <Picks tasks={picks} bins={bins} binLabel={binLabel} onDone={load} />}
          {view === 'transfers' && <Transfers transfers={transfers} bins={bins} onDone={load} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  bins,
  putaway,
  picks,
  transfers,
  go,
}: {
  bins: StorageBin[];
  putaway: PutawayTask[];
  picks: PickTask[];
  transfers: StockTransfer[];
  go: (v: View) => void;
}) {
  const pendingPutaway = putaway.filter((t) => t.status === 'PENDING');
  const pendingPicks = picks.filter((t) => t.status === 'PENDING');
  const capacity = bins.reduce((a, b) => a + b.capacity, 0);
  const zones = new Set(bins.map((b) => b.zone)).size;

  return (
    <>
      <div className="cards">
        <Card label="Storage bins" value={bins.length} sub={`${zones} zones · ${capacity.toLocaleString()} capacity`} />
        <Card label="Pending putaway" value={pendingPutaway.length} />
        <Card label="Pending picks" value={pendingPicks.length} />
        <Card label="Stock transfers" value={transfers.length} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Putaway queue</h2>
            <span className="badge warn">{pendingPutaway.length}</span>
          </div>
          {pendingPutaway.length === 0 ? (
            <p className="muted">No pending putaway. Tasks appear automatically when a GRN is created in Receiving.</p>
          ) : (
            <ul className="list">
              {pendingPutaway.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <span><strong>{t.productCode}</strong> <small className="muted">× {t.quantity}</small></span>
                  <button className="btn sm primary" onClick={() => go('putaway')}>Assign bin</button>
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
            <button className="btn primary" onClick={() => go('putaway')}>↓ Put away stock</button>
            <button className="btn" onClick={() => go('picks')}>↑ Create pick task</button>
            <button className="btn" onClick={() => go('transfers')}>⇄ Transfer stock</button>
            <button className="btn" onClick={() => go('bins')}>▤ Manage bins</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Bins({ bins, onDone }: { bins: StorageBin[]; onDone: () => void }) {
  const [f, setF] = useState({ binCode: '', zone: '', capacity: '100' });
  const { status, busy, run } = useSubmit(onDone);

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    run(async () => {
      await api('/storage-bins', { binCode: f.binCode.trim(), zone: f.zone.trim(), capacity: Number(f.capacity) });
      const msg = `Bin ${f.binCode} created.`;
      setF({ binCode: '', zone: '', capacity: '100' });
      return msg;
    });
  };

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Storage bins</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Zone</th>
                <th className="num">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {bins.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty">No bins yet.</td>
                </tr>
              )}
              {bins.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.binCode}</strong></td>
                  <td><span className="badge info">{b.zone}</span></td>
                  <td className="num">{b.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Create a bin</h2>
        <form onSubmit={submit} className="form">
          <Field label="Bin code" placeholder="e.g. A-01" value={f.binCode} onChange={(v) => setF({ ...f, binCode: v })} />
          <Field label="Zone" placeholder="e.g. Fast Moving" value={f.zone} onChange={(v) => setF({ ...f, zone: v })} />
          <Field label="Capacity" type="number" min="1" value={f.capacity} onChange={(v) => setF({ ...f, capacity: v })} />
          {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Create bin'}</button>
        </form>
      </section>
    </div>
  );
}

function Putaway({
  tasks,
  bins,
  binLabel,
  onDone,
}: {
  tasks: PutawayTask[];
  bins: StorageBin[];
  binLabel: (id: string | null) => string;
  onDone: () => void;
}) {
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const { status, busy, run } = useSubmit(onDone);
  const rows = tasks.filter((t) => filter === 'ALL' || t.status === 'PENDING');

  const complete = (t: PutawayTask) =>
    run(async () => {
      await api(`/putaway-tasks/${t.id}/complete`, { assignedBinId: choice[t.id] });
      return `${t.quantity} × ${t.productCode} put away to ${binLabel(choice[t.id])}.`;
    });

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Putaway tasks</h2>
        <select className="select" value={filter} onChange={(e) => setFilter(e.target.value as 'PENDING' | 'ALL')}>
          <option value="PENDING">Pending only</option>
          <option value="ALL">All tasks</option>
        </select>
      </div>
      {status && <div className={`alert ${status.kind}`} style={{ marginBottom: 12 }}>{status.msg}</div>}
      {bins.length === 0 && <div className="alert error" style={{ marginBottom: 12 }}>Create a storage bin first.</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Quantity</th>
              <th>Status</th>
              <th>Bin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="empty">
                  No putaway tasks. These appear automatically when a GRN is created in Receiving.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.productCode}</strong></td>
                <td className="num">{t.quantity}</td>
                <td><span className={`badge ${t.status === 'PENDING' ? 'warn' : 'ok'}`}>{t.status}</span></td>
                <td>
                  {t.status === 'PENDING' ? (
                    <select
                      className="select"
                      value={choice[t.id] ?? ''}
                      onChange={(e) => setChoice({ ...choice, [t.id]: e.target.value })}
                    >
                      <option value="" disabled>Select a bin…</option>
                      {bins.map((b) => (
                        <option key={b.id} value={b.id}>{b.binCode} ({b.zone})</option>
                      ))}
                    </select>
                  ) : (
                    binLabel(t.assignedBinId)
                  )}
                </td>
                <td className="num">
                  {t.status === 'PENDING' && (
                    <button className="btn sm primary" disabled={busy || !choice[t.id]} onClick={() => complete(t)}>
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Picks({
  tasks,
  bins,
  binLabel,
  onDone,
}: {
  tasks: PickTask[];
  bins: StorageBin[];
  binLabel: (id: string | null) => string;
  onDone: () => void;
}) {
  const [f, setF] = useState({ productCode: '', quantity: '', fromBinId: '' });
  const { status, busy, run } = useSubmit(onDone);

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    run(async () => {
      await api('/pick-tasks', {
        productCode: f.productCode.trim(),
        quantity: Number(f.quantity),
        fromBinId: f.fromBinId || null,
      });
      const msg = `Pick task created for ${f.quantity} × ${f.productCode}.`;
      setF({ productCode: '', quantity: '', fromBinId: '' });
      return msg;
    });
  };

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Pick tasks</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Quantity</th>
                <th>From bin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">No pick tasks.</td>
                </tr>
              )}
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.productCode}</strong></td>
                  <td className="num">{t.quantity}</td>
                  <td>{binLabel(t.fromBinId)}</td>
                  <td><span className={`badge ${t.status === 'PENDING' ? 'warn' : 'ok'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Create pick task</h2>
        <form onSubmit={submit} className="form">
          <Field label="Product code" value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
          <Field label="Quantity" type="number" min="1" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} />
          <label className="field">
            <span>From bin</span>
            <select value={f.fromBinId} onChange={(e) => setF({ ...f, fromBinId: e.target.value })}>
              <option value="">Any bin</option>
              {bins.map((b) => (
                <option key={b.id} value={b.id}>{b.binCode} ({b.zone})</option>
              ))}
            </select>
          </label>
          {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Create pick task'}</button>
        </form>
      </section>
    </div>
  );
}

function Transfers({
  transfers,
  bins,
  onDone,
}: {
  transfers: StockTransfer[];
  bins: StorageBin[];
  onDone: () => void;
}) {
  const [f, setF] = useState({ productCode: '', fromLocation: '', toLocation: '', quantity: '' });
  const { status, busy, run } = useSubmit(onDone);
  const rows = [...transfers].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const submit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    run(async () => {
      await api('/stock-transfers', {
        productCode: f.productCode.trim(),
        fromLocation: f.fromLocation.trim(),
        toLocation: f.toLocation.trim(),
        quantity: Number(f.quantity),
      });
      const msg = `Moved ${f.quantity} × ${f.productCode} from ${f.fromLocation} to ${f.toLocation}.`;
      setF({ productCode: '', fromLocation: '', toLocation: '', quantity: '' });
      return msg;
    });
  };

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Transfer history</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>From</th>
                <th>To</th>
                <th className="num">Qty</th>
                <th className="num">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">No transfers yet.</td>
                </tr>
              )}
              {rows.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.productCode}</strong></td>
                  <td>{t.fromLocation}</td>
                  <td>{t.toLocation}</td>
                  <td className="num">{t.quantity}</td>
                  <td className="num">{t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>New transfer</h2>
        <form onSubmit={submit} className="form">
          <Field label="Product code" value={f.productCode} onChange={(v) => setF({ ...f, productCode: v })} />
          <div className="row">
            <Field label="From location" list="bin-codes" value={f.fromLocation} onChange={(v) => setF({ ...f, fromLocation: v })} />
            <Field label="To location" list="bin-codes" value={f.toLocation} onChange={(v) => setF({ ...f, toLocation: v })} />
          </div>
          <datalist id="bin-codes">
            {bins.map((b) => (
              <option key={b.id} value={b.binCode} />
            ))}
          </datalist>
          <Field label="Quantity" type="number" min="1" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} />
          {status && <div className={`alert ${status.kind}`}>{status.msg}</div>}
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Record transfer'}</button>
        </form>
      </section>
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
