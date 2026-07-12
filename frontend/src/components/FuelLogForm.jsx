import { useEffect, useState } from "react";
import api from "../api";

export default function FuelLogForm() {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ vehicleId: "", liters: "", costPerLiter: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    const [v, l] = await Promise.all([api.getVehicles(), api.getFuelLogs()]);
    setVehicles(v);
    setLogs(l);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const total =
    form.liters && form.costPerLiter
      ? (Number(form.liters) * Number(form.costPerLiter)).toFixed(2)
      : "0.00";

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.vehicleId || !form.liters || !form.costPerLiter) {
      setMsg({ type: "error", text: "Vehicle, liters and cost per liter are required." });
      return;
    }
    setLoading(true);
    try {
      await api.createFuelLog({
        vehicleId: form.vehicleId,
        liters: Number(form.liters),
        costPerLiter: Number(form.costPerLiter),
      });
      setMsg({ type: "success", text: "Fuel log recorded." });
      setForm({ vehicleId: "", liters: "", costPerLiter: "" });
      await loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to record fuel log." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h3 className="panel-title">Log fuel</h3>
        <p className="panel-sub">Total cost is computed automatically as liters × cost/liter.</p>
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
              <label>Liters</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.liters}
                onChange={(e) => setForm({ ...form, liters: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Cost per liter</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costPerLiter}
                onChange={(e) => setForm({ ...form, costPerLiter: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Total cost</label>
            <input value={total} disabled />
          </div>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          <button className="btn amber" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Record fuel log"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 className="panel-title">Recent fuel logs</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Liters</th>
              <th>Cost/L</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.vehicle?.registrationNumber}</td>
                <td>{log.liters}</td>
                <td>{log.costPerLiter?.toFixed(2)}</td>
                <td>{log.totalCost?.toFixed(2)}</td>
                <td>{new Date(log.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5}>No fuel logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
