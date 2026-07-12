import { useEffect } from 'react';

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handle = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '4px 10px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast ${type}`}>{type === 'success' ? '✓' : '✗'} {message}</div>;
}

export function Badge({ status }) {
  const s = status?.toLowerCase().replace(' ', '_');
  return <span className={`badge badge-${s}`}>{status}</span>;
}

export function Spinner() {
  return <div className="spinner" />;
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 380 }}>
        <p style={{ marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div className="flex gap-8" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
