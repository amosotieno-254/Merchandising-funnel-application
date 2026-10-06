import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://localhost:3008/api/v1";

type JournalEntry = {
  id: string;
  reference: string;
  entryType: string;
  memo: string;
  createdAt: string;
};

type JournalLine = {
  id: string;
  journalEntryId: string;
  account: string;
  debit: string;
  credit: string;
};

type AccountPayable = {
  id: string;
  supplierId: string;
  reference: string;
  amountOwed: string;
  paymentTerms: string;
  dueDate: string;
  status: "OUTSTANDING" | "PAID";
  createdAt: string;
};

type View = "dashboard" | "journal" | "payable";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "journal", label: "General Ledger", icon: "▤" },
  { id: "payable", label: "Accounts Payable", icon: "▧" },
];

const money = (n: number) =>
  n.toLocaleString("en-KE", { style: "currency", currency: "KES" });

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [lines, setLines] = useState<JournalLine[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, linesRes, payablesRes] = await Promise.all([
        fetch(`${API}/journal-entries`).then((r) => r.json()),
        fetch(`${API}/journal-lines`).then((r) => r.json()),
        fetch(`${API}/accounts-payable`).then((r) => r.json()),
      ]);
      setEntries(entriesRes.data ?? []);
      setLines(linesRes.data ?? []);
      setPayables(payablesRes.data ?? []);
    } catch {
      setError("Could not reach the financials service on port 3008.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const go = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  const stats = useMemo(() => {
    const revenue = lines
      .filter((l) => l.account === "Revenue")
      .reduce((sum, l) => sum + Number(l.credit), 0);

    const cogs = lines
      .filter((l) => l.account === "Cost of Goods Sold")
      .reduce((sum, l) => sum + Number(l.debit), 0);

    const grossProfit = revenue - cogs;

    const apOutstanding = payables
      .filter((p) => p.status === "OUTSTANDING")
      .reduce((sum, p) => sum + Number(p.amountOwed), 0);

    return { revenue, cogs, grossProfit, apOutstanding };
  }, [lines, payables]);

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Financials</strong>
            <small>Finance Portal</small>
          </div>
        </div>
        <nav>
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-btn ${view === n.id ? "active" : ""}`}
              onClick={() => go(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">API: localhost:3008</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen((o) => !o)}>
            ☰
          </button>
          <h1>{NAV.find((n) => n.id === view)?.label}</h1>
          <button className="btn ghost" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "⟳ Refresh"}
          </button>
        </header>

        <main className="content">
          {error && <div className="alert error">{error}</div>}

          {view === "dashboard" && (
            <>
              <div className="cards">
                <div className="card">
                  <span className="muted">Revenue</span>
                  <strong>{money(stats.revenue)}</strong>
                </div>
                <div className="card">
                  <span className="muted">Cost of goods sold</span>
                  <strong>{money(stats.cogs)}</strong>
                </div>
                <div className="card">
                  <span className="muted">Gross profit</span>
                  <strong>{money(stats.grossProfit)}</strong>
                </div>
                <div className="card">
                  <span className="muted">AP outstanding</span>
                  <strong>{money(stats.apOutstanding)}</strong>
                </div>
              </div>

              <section className="panel">
                <div className="panel-head">
                  <h2>Recent Journal Entries</h2>
                  <span className="muted">{entries.length} total</span>
                </div>
                {entries.length === 0 ? (
                  <p className="muted">No journal entries yet. Financial entries appear as events arrive.</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Memo</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.slice(-5).reverse().map((entry) => (
                          <tr key={entry.id}>
                            <td><code>{entry.reference.slice(0, 8)}…</code></td>
                            <td><span className="badge info">{entry.entryType}</span></td>
                            <td>{entry.memo}</td>
                            <td>{new Date(entry.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {view === "journal" && (
            <section className="panel">
              <div className="panel-head">
                <h2>General Ledger</h2>
                <span className="muted">{lines.length} lines</span>
              </div>
              {lines.length === 0 ? (
                <p className="muted">No ledger lines yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Entry</th>
                        <th>Account</th>
                        <th className="num">Debit (KSH)</th>
                        <th className="num">Credit (KSH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.id}>
                          <td><code>{line.journalEntryId.slice(0, 8)}…</code></td>
                          <td>{line.account}</td>
                          <td className="num">{money(Number(line.debit))}</td>
                          <td className="num">{money(Number(line.credit))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {view === "payable" && (
            <section className="panel">
              <div className="panel-head">
                <h2>Accounts Payable</h2>
                <span className="muted">{payables.length} invoices</span>
              </div>
              {payables.length === 0 ? (
                <p className="muted">Nothing owed to suppliers yet.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Reference</th>
                        <th>Supplier</th>
                        <th className="num">Amount (KSH)</th>
                        <th>Terms</th>
                        <th>Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payables.map((p) => (
                        <tr key={p.id}>
                          <td><code>{p.reference.slice(0, 8)}…</code></td>
                          <td>{p.supplierId.slice(0, 8)}…</td>
                          <td className="num">{money(Number(p.amountOwed))}</td>
                          <td>{p.paymentTerms}</td>
                          <td>{p.dueDate}</td>
                          <td><span className="badge info">{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}