import { useCallback, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:3006/api/v1";

type SaleLine = {
  productCode: string;
  quantity: number;
  unitPrice: string;
};

type Sale = {
  id: string;
  displayId: string;
  registerDisplayId: string;
  cashierName: string;
  paymentMethod: "CASH" | "CARD" | "MIXED";
  totalAmount: string;
  lines: SaleLine[];
  createdAt: string;
};

type View = "terminal" | "sales";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "terminal", label: "Terminal", icon: "▣" },
  { id: "sales", label: "Sales History", icon: "☰" },
];

const money = (n: number) =>
  n.toLocaleString("en-KE", { style: "currency", currency: "KES" });

export default function App() {
  const [view, setView] = useState<View>("terminal");
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/sales`).then((r) => r.json());
      setSales(response.data ?? []);
    } catch {
      setError("Could not reach the retail sales service on port 3006.");
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

  const todayTotal = useMemo(
    () =>
      sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
    [sales]
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="logo">▣</span>
          <div>
            <strong>Retail Sales</strong>
            <small>Point of Sale</small>
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

          {view === "terminal" && (
            <TerminalView onDone={load} setMessage={setMessage} todayTotal={todayTotal} saleCount={sales.length} />
          )}

          {view === "sales" && <SalesTable sales={sales} />}
        </main>
      </div>
    </div>
  );
}

function TerminalView({
  onDone,
  setMessage,
  todayTotal,
  saleCount,
}: {
  onDone: () => void;
  setMessage: (m: string) => void;
  todayTotal: number;
  saleCount: number;
}) {
  const [registerDisplayId, setRegisterDisplayId] = useState("REG-0001");
  const [cashierName, setCashierName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MIXED">("CASH");
  const [basket, setBasket] = useState<SaleLine[]>([]);
  const [productCode, setProductCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const addLine = () => {
    if (!productCode || !quantity || !unitPrice) {
      setMessage("Fill product code, quantity, and unit price.");
      return;
    }
    setBasket([
      ...basket,
      {
        productCode: productCode.trim(),
        quantity: Number(quantity),
        unitPrice,
      },
    ]);
    setProductCode("");
    setQuantity("1");
    setUnitPrice("");
    setMessage("");
  };

  const removeLine = (index: number) => {
    setBasket(basket.filter((_, i) => i !== index));
  };

  const total = basket.reduce(
    (sum, l) => sum + Number(l.unitPrice) * l.quantity,
    0
  );

  const completeSale = async () => {
    if (basket.length === 0) {
      setMessage("Basket is empty.");
      return;
    }
    if (!cashierName) {
      setMessage("Enter the cashier name.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(`${API}/sales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerDisplayId,
          cashierName,
          paymentMethod,
          lines: basket,
        }),
      });
      const json = await response.json();
      if (json.success) {
        setMessage(`Sale ${json.data.displayId} completed — ${money(total)}.`);
        setBasket([]);
        onDone();
      } else {
        setMessage(`Failed: ${json.error}`);
      }
    } catch {
      setMessage("Could not complete sale.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="cards">
        <div className="card">
          <span className="muted">Today's sales</span>
          <strong>{saleCount}</strong>
        </div>
        <div className="card">
          <span className="muted">Today's revenue</span>
          <strong>{money(todayTotal)}</strong>
        </div>
        <div className="card">
          <span className="muted">Basket total</span>
          <strong>{money(total)}</strong>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Basket</h2>
          </div>

          {basket.length === 0 ? (
            <p className="muted">No items yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit price (KSH)</th>
                    <th className="num">Subtotal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {basket.map((l, i) => (
                    <tr key={i}>
                      <td><strong>{l.productCode}</strong></td>
                      <td className="num">{l.quantity}</td>
                      <td className="num">{money(Number(l.unitPrice))}</td>
                      <td className="num">{money(Number(l.unitPrice) * l.quantity)}</td>
                      <td className="num">
                        <button className="btn sm" onClick={() => removeLine(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Add Item</h2>
          </div>

          <div className="form">
            <label className="field">
              <span>Product code</span>
              <input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="e.g. SKU-001"
              />
            </label>
            <div className="row">
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Unit price (KSH)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </label>
            </div>
            <button className="btn" onClick={addLine}>+ Add to basket</button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Checkout</h2>
        </div>

        <div className="form">
          <div className="row">
            <label className="field">
              <span>Register</span>
              <input
                value={registerDisplayId}
                onChange={(e) => setRegisterDisplayId(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Cashier</span>
              <input
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="field">
              <span>Payment method</span>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "CASH" | "CARD" | "MIXED")
                }
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MIXED">Mixed</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <strong style={{ fontSize: 24 }}>Total: {money(total)}</strong>
            <button className="btn primary" onClick={completeSale} disabled={busy}>
              {busy ? "Processing…" : "Complete Sale"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Sales History</h2>
      </div>
      {sales.length === 0 ? (
        <p className="muted">No sales yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sale</th>
                <th>Register</th>
                <th>Cashier</th>
                <th>Payment</th>
                <th className="num">Total (KSH)</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.displayId}</strong></td>
                  <td>{s.registerDisplayId}</td>
                  <td>{s.cashierName}</td>
                  <td><span className="badge info">{s.paymentMethod}</span></td>
                  <td className="num">{money(Number(s.totalAmount))}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}