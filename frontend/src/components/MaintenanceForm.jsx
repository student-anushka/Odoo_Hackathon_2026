import { useEffect, useState } from "react";
import api from "../api";
import StatusBadge from "./StatusBadge";

export default function MaintenanceForm() {
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ vehicleId: "", type: "", description: "", cost: "" });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    const [v, l] = await Promise.all([api.getVehicles(), api.getMaintenanceLogs()]);
    setVehicles(v);
    setLogs(l);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!form.vehicleId || !form.type) {
      setMsg({ type: "error", text: "Vehicle and maintenance type are required." });
      return;
    }
    setLoading(true);
    try {
      await api.createMaintenanceLog({
        vehicleId: form.vehicleId,
        type: form.type,
        description: form.description,
        cost: form.cost ? Number(form.cost) : 0,
      });
      setMsg({ type: "success", text: "Maintenance log created — vehicle moved to IN SHOP." });
      setForm({ vehicleId: "", type: "", description: "", cost: "" });
      await loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to create log." });
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(id) {
    setMsg(null);
    try {
      await api.closeMaintenanceLog(id);
      setMsg({ type: "success", text: "Maintenance closed — vehicle restored to AVAILABLE (unless retired)." });
      await loadAll();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.error || "Failed to close log." });
    }
  }

  return (
    <div className="grid grid-2">
      <div className="panel">
        <h3 className="panel-title">New maintenance record</h3>
        <p className="panel-sub">Opening a record moves the vehicle to IN SHOP and removes it from dispatch.</p>
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
                  {v.registrationNumber} — {v.name} ({v.status})
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="field">
              <label>Type</label>
              <input
                placeholder="e.g. Oil Change"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Cost</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          <button className="btn amber" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Open maintenance record"}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 className="panel-title">Maintenance log</h3>
        <p className="panel-sub">Closing restores the vehicle to AVAILABLE (unless retired).</p>
        <table className="table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Type</th>
              <th>Cost</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.vehicle?.registrationNumber}</td>
                <td>{log.type}</td>
                <td>{log.cost?.toFixed(2)}</td>
                <td>
                  <StatusBadge status={log.status} />
                </td>
                <td>
                  {log.status === "OPEN" && (
                    <button className="btn outline" onClick={() => handleClose(log.id)}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5}>No maintenance records yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
