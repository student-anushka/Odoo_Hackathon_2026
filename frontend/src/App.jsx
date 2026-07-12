import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import MaintenanceForm from "./components/MaintenanceForm";
import FuelLogForm from "./components/FuelLogForm";
import ExpenseForm from "./components/ExpenseForm";
import Reports from "./pages/Reports";

const TABS = [
  { key: "dashboard", label: "Dashboard", index: "01" },
  { key: "maintenance", label: "Maintenance", index: "02" },
  { key: "fuel", label: "Fuel logs", index: "03" },
  { key: "expenses", label: "Expenses", index: "04" },
  { key: "reports", label: "Reports", index: "05" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            Transit<span>Ops</span>
          </div>
          <div className="brand-sub">Person D module</div>
        </div>
        <nav className="nav">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`nav-item ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="nav-index">{t.index}</span> {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {tab === "dashboard" && <Dashboard />}
        {tab === "maintenance" && (
          <PageWrap
            eyebrow="Maintenance"
            title="Maintenance log"
            desc="Opening a record auto-sets the vehicle to IN SHOP; closing restores it to AVAILABLE unless retired."
          >
            <MaintenanceForm />
          </PageWrap>
        )}
        {tab === "fuel" && (
          <PageWrap
            eyebrow="Fuel"
            title="Fuel logs"
            desc="Record fuel purchases — total cost is computed automatically."
          >
            <FuelLogForm />
          </PageWrap>
        )}
        {tab === "expenses" && (
          <PageWrap
            eyebrow="Expenses"
            title="Expenses"
            desc="Tolls and other operational expenses, tracked per vehicle."
          >
            <ExpenseForm />
          </PageWrap>
        )}
        {tab === "reports" && <Reports />}
      </main>
    </div>
  );
}

function PageWrap({ eyebrow, title, desc, children }) {
  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">{desc}</p>
      </div>
      {children}
    </div>
  );
}
