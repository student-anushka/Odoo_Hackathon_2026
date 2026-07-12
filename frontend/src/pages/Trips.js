import { useState, useEffect, useCallback } from 'react';
import {
  getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip,
  getAvailableVehicles, getAvailableDrivers
} from '../api';
import { Modal, Toast, Badge, Spinner, ConfirmModal } from '../components/common';

const STATUSES = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const EMPTY_FORM = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeightKg: '', plannedDistKm: '', revenue: '' };
const EMPTY_COMPLETE = { endOdometerKm: '', fuelConsumedL: '' };

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', page: 1 });
  const [modal, setModal] = useState(null); // 'create' | 'complete' | 'cancel'
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filter.page, limit: 15 };
      if (filter.status) params.status = filter.status;
      const { data } = await getTrips(params);
      setTrips(data.trips);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSaving(false);
    const [v, d] = await Promise.all([getAvailableVehicles(), getAvailableDrivers()]);
    setVehicles(v.data);
    setDrivers(d.data);
    setModal('create');
  };

  const validate = () => {
    const e = {};
    if (!form.source) e.source = 'Required';
    if (!form.destination) e.destination = 'Required';
    if (!form.vehicleId) e.vehicleId = 'Select a vehicle';
    if (!form.driverId) e.driverId = 'Select a driver';
    if (!form.cargoWeightKg || +form.cargoWeightKg <= 0) e.cargoWeightKg = 'Must be > 0';
    if (!form.plannedDistKm || +form.plannedDistKm <= 0) e.plannedDistKm = 'Must be > 0';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createTrip(form);
      setModal(null);
      setToast({ msg: 'Trip created as DRAFT', type: 'success' });
      load();
    } catch (err) {
      const data = err.response?.data;
      if (data?.field) {
        // Inline validation error from API
        setFieldErrors(prev => ({ ...prev, [data.field]: data.error }));
      } else {
        setToast({ msg: data?.error || 'Failed to create trip', type: 'error' });
      }
    } finally { setSaving(false); }
  };

  const handleDispatch = async (trip) => {
    setSaving(true);
    try {
      await dispatchTrip(trip.id);
      setToast({ msg: `Trip #${trip.id} dispatched`, type: 'success' });
      load();
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Dispatch failed', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await completeTrip(selectedTrip.id, completeForm);
      setModal(null);
      setToast({ msg: `Trip #${selectedTrip.id} completed`, type: 'success' });
      load();
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Complete failed', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleCancel = async (id) => {
    try {
      await cancelTrip(id);
      setToast({ msg: `Trip #${id} cancelled`, type: 'success' });
      load();
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Cancel failed', type: 'error' });
    }
    setConfirmCancel(null);
  };

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Show vehicle's max load hint when selected
  const selectedVehicle = vehicles.find(v => v.id === +form.vehicleId);

  return (
    <div>
      <div className="page-header">
        <h1>Trip Management</h1>
        <button className="btn-primary" onClick={openCreate}>+ Create Trip</button>
      </div>

      <div className="filters">
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: 'var(--text2)', alignSelf: 'center', fontSize: 13 }}>{total} trips</span>
      </div>

      {loading ? <Spinner /> : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Route</th><th>Vehicle</th><th>Driver</th>
                <th>Cargo</th><th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr><td colSpan={8}><div className="empty">No trips found<p>Create your first trip to get started</p></div></td></tr>
              ) : trips.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>#{t.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{t.source} → {t.destination}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{t.plannedDistKm} km</div>
                  </td>
                  <td style={{ color: 'var(--text2)' }}>{t.vehicle?.regNumber}<br/><span style={{ fontSize: 12 }}>{t.vehicle?.name}</span></td>
                  <td>{t.driver?.name}</td>
                  <td>{t.cargoWeightKg} kg</td>
                  <td><Badge status={t.status} /></td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-row">
                      {t.status === 'DRAFT' && (
                        <>
                          <button className="btn-primary" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => handleDispatch(t)} disabled={saving}>
                            Dispatch
                          </button>
                          <button className="btn-danger" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setConfirmCancel(t.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                      {t.status === 'DISPATCHED' && (
                        <>
                          <button className="btn-success" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => { setSelectedTrip(t); setCompleteForm(EMPTY_COMPLETE); setModal('complete'); }}>
                            Complete
                          </button>
                          <button className="btn-danger" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setConfirmCancel(t.id)}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {total > 15 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" disabled={filter.page === 1} onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
              <span style={{ color: 'var(--text2)', alignSelf: 'center', fontSize: 13 }}>Page {filter.page}</span>
              <button className="btn-ghost" disabled={filter.page * 15 >= total} onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Create Trip Modal */}
      {modal === 'create' && (
        <Modal title="Create Trip" onClose={() => setModal(null)}>
          <div className="grid-2">
            <div className="form-group">
              <label>Source *</label>
              <input className={fieldErrors.source ? 'error' : ''} value={form.source} onChange={e => setF('source', e.target.value)} placeholder="Warehouse A" />
              {fieldErrors.source && <p className="error-msg">{fieldErrors.source}</p>}
            </div>
            <div className="form-group">
              <label>Destination *</label>
              <input className={fieldErrors.destination ? 'error' : ''} value={form.destination} onChange={e => setF('destination', e.target.value)} placeholder="Client B" />
              {fieldErrors.destination && <p className="error-msg">{fieldErrors.destination}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Vehicle * {selectedVehicle && <span style={{ color: 'var(--info)', fontWeight: 400 }}>— max load: {selectedVehicle.maxLoadKg} kg</span>}</label>
            <select className={fieldErrors.vehicleId ? 'error' : ''} value={form.vehicleId} onChange={e => setF('vehicleId', e.target.value)}>
              <option value="">Select vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name} ({v.maxLoadKg} kg)</option>)}
            </select>
            {fieldErrors.vehicleId && <p className="error-msg">{fieldErrors.vehicleId}</p>}
            {vehicles.length === 0 && <p className="error-msg">No vehicles available</p>}
          </div>

          <div className="form-group">
            <label>Driver *</label>
            <select className={fieldErrors.driverId ? 'error' : ''} value={form.driverId} onChange={e => setF('driverId', e.target.value)}>
              <option value="">Select driver…</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory} (score: {d.safetyScore})</option>)}
            </select>
            {fieldErrors.driverId && <p className="error-msg">{fieldErrors.driverId}</p>}
            {drivers.length === 0 && <p className="error-msg">No drivers available</p>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Cargo Weight (kg) *</label>
              <input type="number" className={fieldErrors.cargoWeightKg ? 'error' : ''} value={form.cargoWeightKg} onChange={e => setF('cargoWeightKg', e.target.value)}
                placeholder={selectedVehicle ? `Max ${selectedVehicle.maxLoadKg}` : ''} />
              {fieldErrors.cargoWeightKg && <p className="error-msg">{fieldErrors.cargoWeightKg}</p>}
            </div>
            <div className="form-group">
              <label>Planned Distance (km) *</label>
              <input type="number" className={fieldErrors.plannedDistKm ? 'error' : ''} value={form.plannedDistKm} onChange={e => setF('plannedDistKm', e.target.value)} />
              {fieldErrors.plannedDistKm && <p className="error-msg">{fieldErrors.plannedDistKm}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Revenue (optional)</label>
            <input type="number" value={form.revenue} onChange={e => setF('revenue', e.target.value)} placeholder="0" />
          </div>

          <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Trip'}</button>
          </div>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {modal === 'complete' && selectedTrip && (
        <Modal title={`Complete Trip #${selectedTrip.id}`} onClose={() => setModal(null)}>
          <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
            {selectedTrip.source} → {selectedTrip.destination}
          </p>
          <div className="form-group">
            <label>Final Odometer (km)</label>
            <input type="number" value={completeForm.endOdometerKm}
              onChange={e => setCompleteForm(f => ({ ...f, endOdometerKm: e.target.value }))}
              placeholder={`Current: ${selectedTrip.vehicle?.odometerKm} km`} />
          </div>
          <div className="form-group">
            <label>Fuel Consumed (liters)</label>
            <input type="number" value={completeForm.fuelConsumedL}
              onChange={e => setCompleteForm(f => ({ ...f, fuelConsumedL: e.target.value }))} />
          </div>
          <div className="flex gap-8" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setModal(null)}>Back</button>
            <button className="btn-success" onClick={handleComplete} disabled={saving}>{saving ? 'Completing…' : 'Mark Complete'}</button>
          </div>
        </Modal>
      )}

      {confirmCancel && (
        <ConfirmModal
          message="Cancel this trip? Vehicle and driver will be restored to Available."
          onConfirm={() => handleCancel(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
