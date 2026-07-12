import { useEffect, useState } from "react";
import api from "../api";

const TYPES = ["TOLL", "MAINTENANCE", "MISC"];

export default function ExpenseForm() {
  const [vehicles, setVehicles] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ vehicleId: "", type: "TOLL", amount: "", description: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    const [v, e] = await Promise.all([api.getVehicles(), api.getExpenses()]);
    setVehicles(v);
    setExpenses(e);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.vehicleId || !form.amount) {
      setMsg({ type: "error", text: "Vehicle and amount are required." });
      return;
    }
    setLoading(true);
    try {
      await api.createExpense({
        vehicleId: form.vehicleId,
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
      });
      setMsg({ type: "success", text: "Expense recorded." });
      setForm({ vehicleId: "", type: "TOLL", amount: "", description: "" });
      await loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to record expense." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h3 className="panel-title">Log expense</h3>
        <p className="panel-sub">Tolls, misc, or manual maintenance-related expenses.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          <button className="btn amber" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Record expense"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 className="panel-title">Recent expenses</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((ex) => (
              <tr key={ex.id}>
                <td>{ex.vehicle?.registrationNumber}</td>
                <td>{ex.type}</td>
                <td>{ex.amount?.toFixed(2)}</td>
                <td>{new Date(ex.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={4}>No expenses yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
