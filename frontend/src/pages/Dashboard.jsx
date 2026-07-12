import { useEffect, useState } from "react";
import api from "../api";
import ExpiryBanner from "../components/ExpiryBanner";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [cost, setCost] = useState([]);

  useEffect(() => {
    api.getLicenseExpiryAlerts(30).then(setAlerts);
    api.getDrivers().then(setDrivers);
    api.getOperationalCost().then(setCost);
  }, []);

  const alertIds = new Set(alerts.map((a) => a.id));
  const totalOpCost = cost.reduce((sum, c) => sum + c.totalOperationalCost, 0);

  function rowClass(driver) {
    if (!alertIds.has(driver.id)) return "";
    const alert = alerts.find((a) => a.id === driver.id);
    return alert.isExpired ? "expired" : "expiring";
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Person D — Maintenance · Fuel · Expenses · Reports</div>
        <h1 className="page-title">Operations dashboard</h1>
        <p className="page-desc">
          Live view of costs and driver license compliance. Vehicle/trip CRUD
          are stubbed read-only here — owned by teammates in the full app.
        </p>
      </div>

      <ExpiryBanner alerts={alerts} />

      <div className="board section-gap">
        <div className="board-cell">
          <div className="board-label">Total Operational Cost</div>
          <div className="board-value">${totalOpCost.toFixed(2)}</div>
        </div>
        <div className="board-cell">
          <div className="board-label">Vehicles Tracked</div>
          <div className="board-value small">{cost.length}</div>
        </div>
        <div className="board-cell">
          <div className="board-label">License Alerts</div>
          <div className="board-value small">{alerts.length}</div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Drivers — license status</h3>
        <p className="panel-sub">Rows highlight amber (expiring ≤ 30 days) or red (already expired).</p>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>License #</th>
              <th>Expiry</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id} className={rowClass(d)}>
                <td>{d.name}</td>
                <td>{d.licenseNumber}</td>
                <td>{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                <td>
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={4}>No drivers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
