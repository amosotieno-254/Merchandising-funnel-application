import { useCallback, useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3004/api/v1';

interface ExpectedDelivery {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  paymentTerms: string;
  lines: string;
  receivedAt: string;
}

interface DeliveryLine {
  productCode: string;
  quantity: number;
  unitCost?: string;
}

interface GoodsReceivedNote {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  status: 'COMPLETE' | 'PARTIAL';
  createdAt: string;
}

interface GrnLine {
  id: string;
  productCode: string;
  orderedQuantity: number;
  receivedQuantity: number;
  condition: 'GOOD' | 'DAMAGED';
}

type Condition = 'GOOD' | 'DAMAGED';
type View = 'dashboard' | 'deliveries' | 'receive' | 'history';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'deliveries', label: 'Expected Deliveries', icon: '⧗' },
  { id: 'receive', label: 'Receive Goods', icon: '↓' },
  { id: 'history', label: 'GRN History', icon: '☰' },
];

const short = (id: string) => `${id.slice(0, 8)}…`;

function parseLines(raw: string): DeliveryLine[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

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
  const [deliveries, setDeliveries] = useState<ExpectedDelivery[]>([]);
  const [notes, setNotes] = useState<GoodsReceivedNote[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, n] = await Promise.all([
        api<ExpectedDelivery[]>('/expected-deliveries'),
        api<GoodsReceivedNote[]>('/goods-received-notes'),
      ]);
      setDeliveries(d);
      setNotes(n);
    } catch {
      setError('Could not reach the receiving service on port 3004.');
      setDeliveries([]);
      setNotes([]);
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

  const receive = (id: string) => {
    setSelectedId(id);
    go('receive');
  };

  const receivedPos = useMemo(() => new Set(notes.map((n) => n.purchaseOrderId)), [notes]);
  const title = NAV.find((n) => n.id === view)?.label;

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Receiving</strong>
            <small>Warehouse Receiving App</small>
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
        <div className="sidebar-foot">API: localhost:3004</div>
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
            <Dashboard deliveries={deliveries} notes={notes} receivedPos={receivedPos} go={go} receive={receive} />
          )}
          {view === 'deliveries' && (
            <Deliveries deliveries={deliveries} receivedPos={receivedPos} receive={receive} />
          )}
          {view === 'receive' && (
            <ReceiveGoods
              deliveries={deliveries}
              receivedPos={receivedPos}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              onDone={load}
            />
          )}
          {view === 'history' && <History notes={notes} />}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  deliveries,
  notes,
  receivedPos,
  go,
  receive,
}: {
  deliveries: ExpectedDelivery[];
  notes: GoodsReceivedNote[];
  receivedPos: Set<string>;
  go: (v: View) => void;
  receive: (id: string) => void;
}) {
  const waiting = deliveries.filter((d) => !receivedPos.has(d.purchaseOrderId));
  const partial = notes.filter((n) => n.status === 'PARTIAL').length;

  return (
    <>
      <div className="cards">
        <Card label="Awaiting receipt" value={waiting.length} sub={`${deliveries.length} expected in total`} />
        <Card label="GRNs created" value={notes.length} />
        <Card label="Complete" value={notes.length - partial} />
        <Card label="Partial" value={partial} />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Next deliveries to receive</h2>
            <span className="badge warn">{waiting.length}</span>
          </div>
          {waiting.length === 0 ? (
            <p className="muted">Nothing waiting. Deliveries appear when a PO is approved in Procurement.</p>
          ) : (
            <ul className="list">
              {waiting.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <span>
                    <strong className="mono">PO {short(d.purchaseOrderId)}</strong>{' '}
                    <small className="muted">{parseLines(d.lines).length} lines · {d.paymentTerms}</small>
                  </span>
                  <button className="btn sm primary" onClick={() => receive(d.id)}>Receive</button>
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
            <button className="btn primary" onClick={() => go('receive')}>↓ Receive goods</button>
            <button className="btn" onClick={() => go('deliveries')}>⧗ Expected deliveries</button>
            <button className="btn" onClick={() => go('history')}>☰ GRN history</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Deliveries({
  deliveries,
  receivedPos,
  receive,
}: {
  deliveries: ExpectedDelivery[];
  receivedPos: Set<string>;
  receive: (id: string) => void;
}) {
  return (
    <section className="panel">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>PO</th>
              <th>Supplier</th>
              <th>Terms</th>
              <th>Products</th>
              <th className="num">Units</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">No deliveries expected.</td>
              </tr>
            )}
            {deliveries.map((d) => {
              const lines = parseLines(d.lines);
              const done = receivedPos.has(d.purchaseOrderId);
              return (
                <tr key={d.id}>
                  <td className="mono">{short(d.purchaseOrderId)}</td>
                  <td className="mono">{short(d.supplierId)}</td>
                  <td>{d.paymentTerms}</td>
                  <td>{lines.map((l) => l.productCode).join(', ') || '—'}</td>
                  <td className="num">{lines.reduce((a, l) => a + l.quantity, 0)}</td>
                  <td>
                    <span className={`badge ${done ? 'ok' : 'warn'}`}>{done ? 'Received' : 'Waiting'}</span>
                  </td>
                  <td className="num">
                    <button className={`btn sm ${done ? '' : 'primary'}`} onClick={() => receive(d.id)}>
                      {done ? 'Receive again' : 'Receive'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type Entry = { productCode: string; orderedQuantity: number; receivedQuantity: string; condition: Condition };

function ReceiveGoods({
  deliveries,
  receivedPos,
  selectedId,
  setSelectedId,
  onDone,
}: {
  deliveries: ExpectedDelivery[];
  receivedPos: Set<string>;
  selectedId: string;
  setSelectedId: (id: string) => void;
  onDone: () => void;
}) {
  const delivery = deliveries.find((d) => d.id === selectedId);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setEntries(
      delivery
        ? parseLines(delivery.lines).map((l) => ({
            productCode: l.productCode,
            orderedQuantity: l.quantity,
            receivedQuantity: String(l.quantity),
            condition: 'GOOD',
          }))
        : []
    );
  }, [delivery]);

  const setEntry = (i: number, patch: Partial<Entry>) =>
    setEntries(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!delivery) return;
    setBusy(true);
    setStatus(null);
    try {
      const grn = await api<GoodsReceivedNote>('/goods-received-notes', {
        purchaseOrderId: delivery.purchaseOrderId,
        supplierId: delivery.supplierId,
        lines: entries.map((en) => ({
          productCode: en.productCode,
          orderedQuantity: en.orderedQuantity,
          receivedQuantity: Number(en.receivedQuantity),
          condition: en.condition,
        })),
      });
      setStatus({ kind: 'ok', msg: `GRN ${short(grn.id)} created (${grn.status}).` });
      setSelectedId('');
      onDone();
    } catch (err) {
      setStatus({ kind: 'error', msg: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" style={{ maxWidth: 820 }}>
      <div className="panel-head">
        <select className="select" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select a delivery…</option>
          {deliveries.map((d) => (
            <option key={d.id} value={d.id}>
              PO {short(d.purchaseOrderId)} {receivedPos.has(d.purchaseOrderId) ? '(received)' : ''}
            </option>
          ))}
        </select>
        {delivery && <span className="muted">Terms: {delivery.paymentTerms}</span>}
      </div>

      {status && <div className={`alert ${status.kind}`} style={{ marginBottom: 12 }}>{status.msg}</div>}

      {!delivery ? (
        <p className="muted">Pick an expected delivery to record what arrived.</p>
      ) : entries.length === 0 ? (
        <p className="muted">This delivery has no line details.</p>
      ) : (
        <form onSubmit={submit} className="form">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Ordered</th>
                  <th>Received</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((en, i) => {
                  const isShort = Number(en.receivedQuantity) < en.orderedQuantity;
                  return (
                    <tr key={en.productCode + i}>
                      <td><strong>{en.productCode}</strong></td>
                      <td className="num">{en.orderedQuantity}</td>
                      <td>
                        <div className="inline">
                          <input
                            className="select"
                            style={{ width: 110 }}
                            type="number"
                            min="0"
                            required
                            value={en.receivedQuantity}
                            onChange={(e) => setEntry(i, { receivedQuantity: e.target.value })}
                          />
                          {isShort && <span className="badge warn">short</span>}
                        </div>
                      </td>
                      <td>
                        <select
                          className="select"
                          value={en.condition}
                          onChange={(e) => setEntry(i, { condition: e.target.value as Condition })}
                        >
                          <option value="GOOD">Good</option>
                          <option value="DAMAGED">Damaged</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="inline">
            <button className="btn primary" disabled={busy}>{busy ? 'Submitting…' : 'Submit GRN'}</button>
            <button type="button" className="btn" onClick={() => setSelectedId('')}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

function History({ notes }: { notes: GoodsReceivedNote[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [lines, setLines] = useState<GrnLine[]>([]);
  const rows = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    if (!selected) return setLines([]);
    api<GoodsReceivedNote & { lines: GrnLine[] }>(`/goods-received-notes/${selected}`)
      .then((n) => setLines(n.lines ?? []))
      .catch(() => setLines([]));
  }, [selected]);

  return (
    <div className="stack">
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>GRN</th>
                <th>PO</th>
                <th>Supplier</th>
                <th>Status</th>
                <th className="num">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">No GRNs yet.</td>
                </tr>
              )}
              {rows.map((n) => (
                <tr
                  key={n.id}
                  className={`clickable ${selected === n.id ? 'selected' : ''}`}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                >
                  <td className="mono">{short(n.id)}</td>
                  <td className="mono">{short(n.purchaseOrderId)}</td>
                  <td className="mono">{short(n.supplierId)}</td>
                  <td><span className={`badge ${n.status === 'COMPLETE' ? 'ok' : 'warn'}`}>{n.status}</span></td>
                  <td className="num">{new Date(n.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="panel">
          <h2>GRN <span className="mono">{selected}</span></h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Ordered</th>
                  <th className="num">Received</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.productCode}</strong></td>
                    <td className="num">{l.orderedQuantity}</td>
                    <td className="num">{l.receivedQuantity}</td>
                    <td><span className={`badge ${l.condition === 'GOOD' ? 'ok' : 'err'}`}>{l.condition}</span></td>
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

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      {sub && <small className="muted">{sub}</small>}
    </div>
  );
}
