import { useState, useEffect } from 'react';
import { getAnalytics } from '../api';
import { Spinner, Badge } from '../components/common';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a78bfa'];

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = ['Vehicle', 'Reg#', 'Type', 'Status', 'Trips Completed', 'Total Distance(km)', 'Fuel(L)', 'Fuel Cost', 'Maint Cost', 'Operational Cost', 'Revenue', 'Fuel Efficiency(km/L)', 'ROI(%)'];
    const rows = data.map(d => [
      d.name, d.regNumber, d.type, d.status, d.tripsCompleted,
      d.totalDistKm, d.totalFuelL, d.totalFuelCost, d.totalMaintCost,
      d.operationalCost, d.totalRevenue, d.fuelEfficiency || 'N/A', d.roi || 'N/A'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `transitops-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) return <Spinner />;

  const chartData = data.slice(0, 8).map(d => ({
    name: d.regNumber,
    cost: +d.operationalCost,
    revenue: +d.totalRevenue,
  }));

  const effData = data.filter(d => d.fuelEfficiency).map(d => ({
    name: d.regNumber,
    efficiency: +d.fuelEfficiency,
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <button className="btn-ghost" onClick={exportCSV}>↓ Export CSV</button>
      </div>

      {data.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)' }}>OPERATIONAL COST vs REVENUE</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e2436', border: '1px solid #2a3050', borderRadius: 8 }} />
                  <Bar dataKey="cost" name="Op. Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--text2)' }}>FUEL EFFICIENCY (km/L)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={effData}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e2436', border: '1px solid #2a3050', borderRadius: 8 }} />
                  <Bar dataKey="efficiency" name="km/L" radius={[4, 4, 0, 0]}>
                    {effData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Vehicle</th><th>Status</th><th>Trips</th>
              <th>Op. Cost</th><th>Revenue</th><th>Fuel Eff.</th><th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={7}><div className="empty">No data yet</div></td></tr>
            ) : data.map(d => {
              const roi = d.roi ? +d.roi : null;
              return (
                <tr key={d.vehicleId}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.regNumber}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{d.name}</div>
                  </td>
                  <td><Badge status={d.status} /></td>
                  <td>{d.tripsCompleted}</td>
                  <td>₱{(+d.operationalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--success)' }}>₱{(+d.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{d.fuelEfficiency ? `${d.fuelEfficiency} km/L` : '—'}</td>
                  <td style={{ color: roi === null ? 'var(--text2)' : roi >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {roi !== null ? `${roi}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
