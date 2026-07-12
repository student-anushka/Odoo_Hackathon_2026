import { useState, useEffect, useCallback } from 'react';
import { getMaintenance, createMaintenance, closeMaintenance, getVehicles } from '../api';
import { Modal, Toast, Badge, Spinner } from '../components/common';

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', type: '', description: '', cost: '' });
  const [closeForm, setCloseForm] = useState({ cost: '' });
  const [selectedLog, setSelectedLog] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, v] = await Promise.all([getMaintenance(), getVehicles()]);
      setLogs(l.data);
      setVehicles(v.data.filter(v => v.status !== 'RETIRED'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createMaintenance(form);
      setModal(null);
      setToast({ msg: 'Maintenance log created — vehicle set to In Shop', type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Error', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleClose = async () => {
    setSaving(true);
    try {
      await closeMaintenance(selectedLog.id, { cost: closeForm.cost || selectedLog.cost });
      setModal(null);
      setToast({ msg: 'Maintenance closed — vehicle restored to Available', type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Error', type: 'error' });
    } finally { setSaving(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Maintenance</h1>
        <button className="btn-primary" onClick={() => { setForm({ vehicleId: '', type: '', description: '', cost: '' }); setModal('create'); }}>+ Add Record</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Cost</th><th>Status</th><th>Started</th><th>Closed</th><th></th></tr></thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">No maintenance records</div></td></tr>
            ) : logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.vehicle?.regNumber}</td>
                <td>{l.type}</td>
                <td style={{ color: 'var(--text2)' }}>{l.description || '—'}</td>
                <td>₱{(+l.cost).toLocaleString()}</td>
                <td><Badge status={l.status} /></td>
                <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(l.startDate).toLocaleDateString()}</td>
                <td style={{ color: 'var(--text2)', fontSize: 12 }}>{l.endDate ? new Date(l.endDate).toLocaleDateString() : '—'}</td>
                <td>
                  {l.status === 'ACTIVE' && (
                    <button className="btn-success" style={{ fontSize: 12, padding: '5px 10px' }}
                      onClick={() => { setSelectedLog(l); setCloseForm({ cost: l.cost }); setModal('close'); }}>
                      Close
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'create' && (
        <Modal title="Add Maintenance Record" onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Vehicle *</label>
            <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
              <option value="">Select vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name} ({v.status})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Maintenance Type *</label>
            <input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} placeholder="Oil Change, Tire Replacement…" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Estimated Cost</label>
            <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
          </div>
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--warning)' }}>
            ⚠ Creating this record will set the vehicle's status to <strong>In Shop</strong> and remove it from dispatch.
          </div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving || !form.vehicleId || !form.type}>{saving ? 'Saving…' : 'Create Record'}</button>
          </div>
        </Modal>
      )}

      {modal === 'close' && selectedLog && (
        <Modal title="Close Maintenance" onClose={() => setModal(null)}>
          <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
            {selectedLog.vehicle?.regNumber} — {selectedLog.type}
          </p>
          <div className="form-group">
            <label>Final Cost</label>
            <input type="number" value={closeForm.cost} onChange={e => setCloseForm({ cost: e.target.value })} />
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--success)' }}>
            ✓ Closing will restore the vehicle to <strong>Available</strong>.
          </div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-success" onClick={handleClose} disabled={saving}>{saving ? 'Closing…' : 'Close Maintenance'}</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
