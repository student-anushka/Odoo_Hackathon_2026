import { useState, useEffect, useCallback } from 'react';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '../api';
import { Modal, Toast, Badge, Spinner, ConfirmModal } from '../components/common';

const CATS = ['A', 'B', 'C', 'D', 'BE', 'CE'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
const EMPTY = { name: '', licenseNumber: '', licenseCategory: 'B', licenseExpiry: '', contactNumber: '', safetyScore: 100, status: 'AVAILABLE' };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getDrivers(filter ? { status: filter } : {});
      setDrivers(data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setErrors({}); setModal('add'); };
  const openEdit = (d) => {
    setForm({ ...d, licenseExpiry: d.licenseExpiry?.slice(0, 10) });
    setErrors({}); setModal('edit');
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Required';
    if (!form.licenseNumber) e.licenseNumber = 'Required';
    if (!form.licenseExpiry) e.licenseExpiry = 'Required';
    if (!form.contactNumber) e.contactNumber = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') await createDriver(form);
      else await updateDriver(form.id, form);
      setModal(null);
      setToast({ msg: `Driver ${modal === 'add' ? 'added' : 'updated'}`, type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Error', type: 'error' });
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await deleteDriver(id);
      setToast({ msg: 'Driver deleted', type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Cannot delete', type: 'error' });
    }
    setConfirm(null);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isExpired = (d) => new Date(d.licenseExpiry) <= new Date();

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Driver Management</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Driver</button>
      </div>

      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>License #</th><th>Category</th><th>Expiry</th><th>Safety Score</th><th>Contact</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">No drivers found</div></td></tr>
            ) : drivers.map(d => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td style={{ color: 'var(--text2)' }}>{d.licenseNumber}</td>
                <td>{d.licenseCategory}</td>
                <td style={{ color: isExpired(d) ? 'var(--danger)' : 'inherit' }}>
                  {new Date(d.licenseExpiry).toLocaleDateString()}
                  {isExpired(d) && ' ⚠'}
                </td>
                <td>
                  <span style={{ color: d.safetyScore >= 80 ? 'var(--success)' : d.safetyScore >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                    {d.safetyScore}
                  </span>
                </td>
                <td style={{ color: 'var(--text2)' }}>{d.contactNumber}</td>
                <td><Badge status={d.status} /></td>
                <td>
                  <div className="actions-row">
                    <button className="btn-ghost" onClick={() => openEdit(d)}>Edit</button>
                    <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setConfirm(d.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Driver' : 'Edit Driver'} onClose={() => setModal(null)}>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input className={errors.name ? 'error' : ''} value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>
            <div className="form-group">
              <label>License Number *</label>
              <input className={errors.licenseNumber ? 'error' : ''} value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} />
              {errors.licenseNumber && <p className="error-msg">{errors.licenseNumber}</p>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>License Category</label>
              <select value={form.licenseCategory} onChange={e => set('licenseCategory', e.target.value)}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>License Expiry *</label>
              <input type="date" className={errors.licenseExpiry ? 'error' : ''} value={form.licenseExpiry} onChange={e => set('licenseExpiry', e.target.value)} />
              {errors.licenseExpiry && <p className="error-msg">{errors.licenseExpiry}</p>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Contact Number *</label>
              <input className={errors.contactNumber ? 'error' : ''} value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} />
              {errors.contactNumber && <p className="error-msg">{errors.contactNumber}</p>}
            </div>
            <div className="form-group">
              <label>Safety Score</label>
              <input type="number" min="0" max="100" value={form.safetyScore} onChange={e => set('safetyScore', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal message="Delete this driver?" onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
