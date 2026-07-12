import { useState, useEffect, useCallback } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api';
import { Modal, Toast, Badge, Spinner, ConfirmModal } from '../components/common';

const TYPES = ['Van', 'Truck', 'Pickup', 'Motorcycle', 'Bus', 'Car'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const EMPTY = { regNumber: '', name: '', type: 'Van', maxLoadKg: '', odometerKm: '', acquisitionCost: '', status: 'AVAILABLE', region: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await getVehicles(filter);
      setVehicles(data);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY); setErrors({}); setModal('add'); };
  const openEdit = (v) => { setForm(v); setErrors({}); setModal('edit'); };

  const validate = () => {
    const e = {};
    if (!form.regNumber) e.regNumber = 'Required';
    if (!form.name) e.name = 'Required';
    if (!form.maxLoadKg || +form.maxLoadKg <= 0) e.maxLoadKg = 'Must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'add') await createVehicle(form);
      else await updateVehicle(form.id, form);
      setModal(null);
      setToast({ msg: `Vehicle ${modal === 'add' ? 'added' : 'updated'}`, type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Error saving vehicle', type: 'error' });
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await deleteVehicle(id);
      setToast({ msg: 'Vehicle deleted', type: 'success' });
      load();
    } catch (e) {
      setToast({ msg: e.response?.data?.error || 'Cannot delete vehicle', type: 'error' });
    }
    setConfirm(null);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="page-header">
        <h1>Vehicle Registry</h1>
        <button className="btn-primary" onClick={openAdd}>+ Add Vehicle</button>
      </div>

      <div className="filters">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Reg #</th><th>Name</th><th>Type</th><th>Max Load</th><th>Odometer</th><th>Status</th><th>Region</th><th></th></tr></thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr><td colSpan={8}><div className="empty">No vehicles found</div></td></tr>
            ) : vehicles.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.regNumber}</td>
                <td>{v.name}</td>
                <td style={{ color: 'var(--text2)' }}>{v.type}</td>
                <td>{v.maxLoadKg} kg</td>
                <td>{v.odometerKm?.toLocaleString()} km</td>
                <td><Badge status={v.status} /></td>
                <td style={{ color: 'var(--text2)' }}>{v.region || '—'}</td>
                <td>
                  <div className="actions-row">
                    <button className="btn-ghost" onClick={() => openEdit(v)}>Edit</button>
                    <button className="btn-danger" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setConfirm(v.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Vehicle' : 'Edit Vehicle'} onClose={() => setModal(null)}>
          <div className="grid-2">
            <div className="form-group">
              <label>Registration Number *</label>
              <input className={errors.regNumber ? 'error' : ''} value={form.regNumber} onChange={e => set('regNumber', e.target.value)} placeholder="VAN-05" />
              {errors.regNumber && <p className="error-msg">{errors.regNumber}</p>}
            </div>
            <div className="form-group">
              <label>Vehicle Name / Model *</label>
              <input className={errors.name ? 'error' : ''} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ford Transit" />
              {errors.name && <p className="error-msg">{errors.name}</p>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Max Load (kg) *</label>
              <input type="number" className={errors.maxLoadKg ? 'error' : ''} value={form.maxLoadKg} onChange={e => set('maxLoadKg', e.target.value)} />
              {errors.maxLoadKg && <p className="error-msg">{errors.maxLoadKg}</p>}
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Odometer (km)</label>
              <input type="number" value={form.odometerKm} onChange={e => set('odometerKm', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Acquisition Cost</label>
              <input type="number" value={form.acquisitionCost} onChange={e => set('acquisitionCost', e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Region</label>
              <input value={form.region || ''} onChange={e => set('region', e.target.value)} placeholder="North" />
            </div>
          </div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal message="Delete this vehicle? This cannot be undone." onConfirm={() => remove(confirm)} onCancel={() => setConfirm(null)} />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
