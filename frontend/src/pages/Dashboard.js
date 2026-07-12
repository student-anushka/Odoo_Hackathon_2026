import { useState, useEffect } from 'react';
import { getDashboard, getExpiringLicenses } from '../api';
import { Spinner, Badge } from '../components/common';

const KPI = ({ label, value, sub, color }) => (
  <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
    <div style={{ color: 'var(--text2)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color }}>{value}</div>
    {sub && <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboard(), getExpiringLicenses()])
      .then(([d, e]) => { setData(d.data); setExpiring(e.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPI label="Active Vehicles" value={data.activeVehicles} color="var(--accent)" />
        <KPI label="Available" value={data.availableVehicles} color="var(--success)" />
        <KPI label="In Maintenance" value={data.inShopVehicles} color="var(--warning)" />
        <KPI label="Fleet Utilization" value={`${data.fleetUtilization}%`} color="var(--info)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <KPI label="Active Trips" value={data.activeTrips} color="var(--accent)" />
        <KPI label="Pending Trips" value={data.pendingTrips} color="var(--warning)" />
        <KPI label="Drivers On Duty" value={data.driversOnDuty} color="var(--success)" />
        <KPI label="Total Drivers" value={data.totalDrivers} color="var(--text2)" />
      </div>

      {expiring.length > 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <h3 style={{ marginBottom: 16, color: 'var(--danger)' }}>⚠ Expiring Licenses ({expiring.length})</h3>
          <table>
            <thead><tr><th>Driver</th><th>License</th><th>Expiry</th><th>Status</th></tr></thead>
            <tbody>
              {expiring.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td style={{ color: 'var(--text2)' }}>{d.licenseNumber}</td>
                  <td style={{ color: new Date(d.licenseExpiry) < new Date() ? 'var(--danger)' : 'var(--warning)' }}>
                    {new Date(d.licenseExpiry).toLocaleDateString()}
                  </td>
                  <td><Badge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
