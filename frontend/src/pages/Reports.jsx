import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../api";

const STATUS_COLORS = {
  AVAILABLE: "#2f9e68",
  ON_TRIP: "#ffb400",
  IN_SHOP: "#d64545",
  RETIRED: "#55617a",
};

export default function Reports() {
  const [cost, setCost] = useState([]);
  const [efficiency, setEfficiency] = useState([]);
  const [fleetStatus, setFleetStatus] = useState([]);
  const [roi, setRoi] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    api.getOperationalCost().then(setCost);
    api.getFuelEfficiency().then(setEfficiency);
    api.getFleetStatus().then(setFleetStatus);
    api.getRoi().then(setRoi);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Reports &amp; Analytics</div>
        <h1 className="page-title">Fleet performance</h1>
        <p className="page-desc">
          Operational cost, fuel efficiency, fleet status, and ROI — computed from
          maintenance, fuel, and expense records.
        </p>
      </div>

      <div className="panel section-gap">
        <h3 className="panel-title">Export trips</h3>
        <p className="panel-sub">Download a CSV (or bonus PDF) of trips within a date range.</p>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="field">
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <a className="btn amber" href={api.exportTripsCsvUrl(from, to)}>
            Download CSV
          </a>
          <a className="btn outline" href={api.exportTripsPdfUrl(from, to)}>
            Download PDF (bonus)
          </a>
        </div>
      </div>

      <div className="grid grid-2 section-gap">
        <div className="panel chart-panel">
          <h3 className="panel-title">Operational cost per vehicle</h3>
          <p className="panel-sub">Fuel + maintenance + other expenses</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={cost}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e5df" />
              <XAxis dataKey="registrationNumber" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="fuelCost" stackId="a" fill="#ffb400" name="Fuel" />
              <Bar dataKey="maintenanceCost" stackId="a" fill="#d64545" name="Maintenance" />
              <Bar dataKey="otherExpenses" stackId="a" fill="#55617a" name="Other" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <h3 className="panel-title">Fuel efficiency over time</h3>
          <p className="panel-sub">Km per liter, per completed trip</p>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={efficiency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e5df" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString()}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#ffb400"
                strokeWidth={2}
                name="km/L"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2 section-gap">
        <div className="panel chart-panel">
          <h3 className="panel-title">Fleet status distribution</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={fleetStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {fleetStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] || "#55617a"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-title">Vehicle ROI</h3>
          <p className="panel-sub">
            (Revenue − (Maintenance + Fuel)) ÷ Acquisition cost. Revenue is a
            per-vehicle assumption field since it's not defined by the brief.
          </p>
          <div className="grid grid-3">
            {roi.map((r) => (
              <div className="metric-card" key={r.vehicleId}>
                <div className="reg">{r.registrationNumber}</div>
                <div className={`roi-value ${r.roi >= 0 ? "positive" : "negative"}`}>
                  {(r.roi * 100).toFixed(1)}%
                </div>
              </div>
            ))}
            {roi.length === 0 && <p className="panel-sub">No vehicles yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
