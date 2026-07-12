import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/vehicles', label: 'Vehicles', icon: '🚛' },
  { to: '/drivers', label: 'Drivers', icon: '👤' },
  { to: '/trips', label: 'Trips', icon: '🗺️' },
  { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { to: '/fuel', label: 'Fuel & Expenses', icon: '⛽' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff' }}>🚌 TransitOps</div>
          <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>{user?.role?.replace('_', ' ')}</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              borderRadius: 6, marginBottom: 2, textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--text2)',
              background: isActive ? 'var(--accent)' : 'transparent',
              fontWeight: isActive ? 600 : 400, fontSize: 14,
            })}>
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>{user?.name}</div>
          <button className="btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main style={{ marginLeft: 220, flex: 1, padding: '28px 32px', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
