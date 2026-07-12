import { useState, useEffect, useCallback } from 'react';
import { getFuelLogs, createFuelLog, getExpenses, createExpense, getVehicles } from '../api';
import { Modal, Toast, Spinner } from '../components/common';

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('fuel');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [f, e, v] = await Promise.all([getFuelLogs(), getExpenses(), getVehicles()]);
      setFuelLogs(f.data); setExpenses(e.data); setVehicles(v.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openFuel = () => { setForm({ vehicleId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) }); setModal('fuel'); };
  const openExpense = () => { setForm({ vehicleId: '', type: 'Toll', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); setModal('expense'); };

  const handleFuel = async () => {
    setSaving(true);
    try {
      await createFuelLog(form);
      setModal(null); setToast({ msg: 'Fuel log added', type: 'success' }); load();
    } catch (e) { setToast({ msg: e.response?.data?.error || 'Error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleExpense = async () => {
    setSaving(true);
    try {
      await createExpense(form);
      setModal(null); setToast({ msg: 'Expense added', type: 'success' }); load();
    } catch (e) { setToast({ msg: e.response?.data?.error || 'Error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <Spinner />;

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h1>Fuel & Expenses</h1>
        <div className="flex gap-8">
          <button className="btn-primary" onClick={openFuel}>+ Fuel Log</button>
          <button className="btn-ghost" onClick={openExpense}>+ Expense</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ color: 'var(--text2)', fontSize: 12 }}>TOTAL FUEL COST</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>₱{totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div style={{ color: 'var(--text2)', fontSize: 12 }}>OTHER EXPENSES</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>₱{totalExp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div style={{ color: 'var(--text2)', fontSize: 12 }}>TOTAL OPERATIONAL COST</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>₱{(totalFuel + totalExp).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        {['fuel', 'expenses'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === t ? 600 : 400, fontSize: 14,
          }}>
            {t === 'fuel' ? `Fuel Logs (${fuelLogs.length})` : `Expenses (${expenses.length})`}
          </button>
        ))}
      </div>

      {tab === 'fuel' && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th></tr></thead>
            <tbody>
              {fuelLogs.length === 0 ? (
                <tr><td colSpan={4}><div className="empty">No fuel logs</div></td></tr>
              ) : fuelLogs.map(f => (
                <tr key={f.id}>
                  <td>{f.vehicle?.regNumber}</td>
                  <td>{f.liters} L</td>
                  <td>₱{(+f.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(f.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'expenses' && (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5}><div className="empty">No expenses</div></td></tr>
              ) : expenses.map(e => (
                <tr key={e.id}>
                  <td>{e.vehicle?.regNumber}</td>
                  <td>{e.type}</td>
                  <td style={{ color: 'var(--text2)' }}>{e.description || '—'}</td>
                  <td>₱{(+e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(e.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'fuel' && (
        <Modal title="Add Fuel Log" onClose={() => setModal(null)}>
          <div className="form-group"><label>Vehicle *</label>
            <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
              <option value="">Select…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>Liters *</label><input type="number" value={form.liters} onChange={e => set('liters', e.target.value)} /></div>
            <div className="form-group"><label>Cost (₱) *</label><input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleFuel} disabled={saving || !form.vehicleId || !form.liters}>{saving ? 'Saving…' : 'Add Log'}</button>
          </div>
        </Modal>
      )}

      {modal === 'expense' && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <div className="form-group"><label>Vehicle *</label>
            <select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
              <option value="">Select…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {['Toll', 'Parking', 'Repair', 'Insurance', 'Other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Amount (₱) *</label><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={e => set('description', e.target.value)} /></div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleExpense} disabled={saving || !form.vehicleId || !form.amount}>{saving ? 'Saving…' : 'Add Expense'}</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
