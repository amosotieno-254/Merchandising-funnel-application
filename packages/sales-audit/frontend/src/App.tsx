import { useCallback, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3007/api/v1";

type RegisterSession = {
  id: string;
  displayId: string;
  storeName: string;
  registerName: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  status: "OPEN" | "CLOSED";
  expectedTotal: string;
  actualTotal: string | null;
  difference: string | null;
  explanation: string | null;
};

type RegisterClosure = {
  id: string;
  registerSessionId: string;
  managerName: string;
  signedOffAt: string;
  notes: string | null;
};

type View = "dashboard" | "sessions" | "closures";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "sessions", label: "Registers", icon: "▤" },
  { id: "closures", label: "Closures", icon: "✔" },
];

const money = (n: number) =>
  n.toLocaleString("en-KE", { style: "currency", currency: "KES" });

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [sessions, setSessions] = useState<RegisterSession[]>([]);
  const [closures, setClosures] = useState<RegisterClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, closuresRes] = await Promise.all([
        fetch(`${API}/register-sessions`).then((r) => r.json()),
        fetch(`${API}/register-closures`).then((r) => r.json()),
      ]);
      setSessions(sessionsRes.data ?? []);
      setClosures(closuresRes.data ?? []);
    } catch {
      setError("Could not reach the sales audit service on port 3007.");
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
    const openRegisters = sessions.filter((s) => s.status === "OPEN");
    const closedRegisters = sessions.filter((s) => s.status === "CLOSED");
    const totalExpected = sessions.reduce(
      (sum, s) => sum + Number(s.expectedTotal),
      0
    );
    const totalActual = closedRegisters.reduce(
      (sum, s) => sum + Number(s.actualTotal ?? 0),
      0
    );
    return {
      openRegisters,
      totalExpected,
      totalActual,
      difference: totalActual - totalExpected,
    };
  }, [sessions]);

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Sales Audit</strong>
            <small>Store Manager</small>
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
        <div className="sidebar-foot">API: {API}</div>
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
          {message && <div className="alert ok">{message}</div>}

          {view === "dashboard" && (
            <>
              <div className="cards">
                <div className="card">
                  <span className="muted">Open registers</span>
                  <strong>{stats.openRegisters.length}</strong>
                </div>
                <div className="card">
                  <span className="muted">Expected total</span>
                  <strong>{money(stats.totalExpected)}</strong>
                </div>
                <div className="card">
                  <span className="muted">Actual total</span>
                  <strong>{money(stats.totalActual)}</strong>
                </div>
                <div className="card">
                  <span className="muted">Difference</span>
                  <strong>{money(stats.difference)}</strong>
                </div>
              </div>

              <section className="panel">
                <div className="panel-head">
                  <h2>Open a Register</h2>
                </div>
                <OpenRegisterForm onDone={load} setMessage={setMessage} />
              </section>
            </>
          )}

          {view === "sessions" && (
            <SessionsPanel
              sessions={sessions}
              onClose={load}
              setMessage={setMessage}
            />
          )}

          {view === "closures" && <ClosuresPanel closures={closures} />}
        </main>
      </div>
    </div>
  );
}

function OpenRegisterForm({
  onDone,
  setMessage,
}: {
  onDone: () => void;
  setMessage: (m: string) => void;
}) {
  const [f, setF] = useState({
    storeName: "",
    registerName: "",
    cashierName: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${API}/register-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const json = await response.json();
      if (json.success) {
        setMessage(`Register ${json.data.displayId} opened.`);
        setF({ storeName: "", registerName: "", cashierName: "" });
        onDone();
      } else {
        setMessage(`Failed: ${json.error}`);
      }
    } catch {
      setMessage("Could not open register.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="form">
      <div className="row">
        <label className="field">
          <span>Store name</span>
          <input
            required
            value={f.storeName}
            onChange={(e) => setF({ ...f, storeName: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Register name</span>
          <input
            required
            value={f.registerName}
            onChange={(e) => setF({ ...f, registerName: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Cashier name</span>
          <input
            required
            value={f.cashierName}
            onChange={(e) => setF({ ...f, cashierName: e.target.value })}
          />
        </label>
      </div>
      <button className="btn primary" disabled={busy}>
        {busy ? "Opening…" : "Open Register"}
      </button>
    </form>
  );
}

function SessionsPanel({
  sessions,
  onClose,
  setMessage,
}: {
  sessions: RegisterSession[];
  onClose: () => void;
  setMessage: (m: string) => void;
}) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [actualTotal, setActualTotal] = useState("");
  const [managerName, setManagerName] = useState("");
  const [explanation, setExplanation] = useState("");

  const submitClose = async (sessionId: string) => {
    const response = await fetch(`${API}/register-sessions/${sessionId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualTotal, managerName, explanation }),
    });
    const json = await response.json();
    if (json.success) {
      setMessage(`Register ${json.data.displayId} closed.`);
      setClosingId(null);
      setActualTotal("");
      setManagerName("");
      setExplanation("");
      onClose();
    } else {
      setMessage(`Failed: ${json.error}`);
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>All Registers</h2>
      </div>
      {sessions.length === 0 ? (
        <p className="muted">No registers yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Register</th>
                <th>Store</th>
                <th>Cashier</th>
                <th className="num">Expected</th>
                <th className="num">Actual</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <>
                  <tr key={s.id}>
                    <td>
                      <strong>{s.displayId}</strong>
                    </td>
                    <td>{s.storeName}</td>
                    <td>{s.cashierName}</td>
                    <td className="num">{money(Number(s.expectedTotal))}</td>
                    <td className="num">
                      {s.actualTotal ? money(Number(s.actualTotal)) : "—"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          s.status === "OPEN" ? "info" : "ok"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="num">
                      {s.status === "OPEN" && (
                        <button
                          className="btn sm"
                          onClick={() =>
                            setClosingId(closingId === s.id ? null : s.id)
                          }
                        >
                          {closingId === s.id ? "Cancel" : "Close"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {closingId === s.id && (
                    <tr key={s.id + "-close"}>
                      <td colSpan={7} style={{ background: "#f8fafc" }}>
                        <div className="row" style={{ alignItems: "flex-end" }}>
                          <label className="field">
                            <span>Actual cash counted (KSH)</span>
                            <input
                              type="number"
                              step="0.01"
                              value={actualTotal}
                              onChange={(e) => setActualTotal(e.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Manager name</span>
                            <input
                              value={managerName}
                              onChange={(e) => setManagerName(e.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Explanation (if short/over)</span>
                            <input
                              value={explanation}
                              onChange={(e) => setExplanation(e.target.value)}
                            />
                          </label>
                          <button
                            className="btn primary"
                            onClick={() => submitClose(s.id)}
                          >
                            Confirm close
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ClosuresPanel({ closures }: { closures: RegisterClosure[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Signed-off Closures</h2>
      </div>
      {closures.length === 0 ? (
        <p className="muted">No closures yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Manager</th>
                <th>Signed off</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {closures.map((c) => (
                <tr key={c.id}>
                  <td>
                    <code>{c.registerSessionId.slice(0, 8)}…</code>
                  </td>
                  <td>{c.managerName}</td>
                  <td>{new Date(c.signedOffAt).toLocaleString()}</td>
                  <td>{c.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}