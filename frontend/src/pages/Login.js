import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const quickLogin = (email) => setForm({ email, password: 'password123' });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>🚌</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>TransitOps</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Smart Transport Operations</p>
        </div>
        <div className="card">
          <form onSubmit={handle}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            {error && <p className="error-msg" style={{ marginBottom: 12 }}>⚠ {error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>Quick login (demo):</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                ['manager@transitops.com', 'Fleet Manager'],
                ['driver@transitops.com', 'Driver'],
                ['safety@transitops.com', 'Safety Officer'],
                ['finance@transitops.com', 'Finance'],
              ].map(([email, label]) => (
                <button key={email} className="btn-ghost" style={{ fontSize: 12, padding: '6px' }} onClick={() => quickLogin(email)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
