import { useEffect, useState } from 'react';
import { feeMasterApi } from '../../api/feeMasterApi.js';

export default function FeeMaster() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const refresh = async () => {
    setLoadError('');
    try {
      const data = await feeMasterApi.listAll();
      setFees(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openEdit = (fee) => {
    setAmount(String(fee.amount ?? ''));
    setDescription(fee.description || '');
    setFormError('');
    setMessage('');
    setModal({ fee });
  };

  const save = async () => {
    const num = Number(amount);
    if (!Number.isInteger(num) || num < 0) {
      setFormError('Enter a valid whole-rupee amount (e.g. 2400).');
      return;
    }

    setSaving(true);
    try {
      await feeMasterApi.updateRegistrationFee(num, description);
      setMessage(`Registration Fee updated to ₹${num.toLocaleString('en-IN')} successfully.`);
      await refresh();
      setModal(null);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      {message && (
        <div className="branch-master-message" role="status">
          <i className="bi bi-check-circle-fill"></i>
          <span>{message}</span>
        </div>
      )}
      {loadError && <div className="track-result track-error" role="alert">{loadError}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table fee-master-table">
          <colgroup>
            <col className="fee-master-name-column" />
            <col className="fee-master-amount-column" />
            <col className="fee-master-description-column" />
            <col className="fee-master-status-column" />
            <col className="fee-master-actions-column" />
          </colgroup>
          <thead>
            <tr>
              <th>Fee Master Name</th>
              <th>Configured Fee Amount</th>
              <th>Description / Purpose</th>
              <th>Master Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.id}>
                <td className="fee-master-name">
                  <i className="bi bi-cash-coin" aria-hidden="true"></i>
                  <strong>{fee.name}</strong>
                </td>
                <td className="fee-master-amount">
                  <span className="badge-pay pay-paid">
                    ₹{Number(fee.amount || 0).toLocaleString('en-IN')}
                  </span>
                </td>
                <td className="fee-master-description">
                  {fee.description || 'Standard Registration Fee'}
                </td>
                <td className="fee-master-status">
                  <span className={`badge-role ${fee.isActive ? 'active' : 'inactive'}`}>
                    {fee.isActive ? '● Active in Master' : '○ Inactive'}
                  </span>
                </td>
                <td className="fee-master-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    title="Edit Master Fee"
                    aria-label={`Edit ${fee.name}`}
                    onClick={() => openEdit(fee)}
                    style={{ gap: 6 }}
                  >
                    <i className="bi bi-pencil-square"></i> Update Fee
                  </button>
                </td>
              </tr>
            ))}
            {loading ? (
              <tr>
                <td colSpan="5" className="branch-master-empty">Loading Fee Master settings…</td>
              </tr>
            ) : fees.length === 0 && (
              <tr>
                <td colSpan="5" className="branch-master-empty">
                  No Fee Master record found. Default registration fee is ₹2,400.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="add-user-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <div>
                <h4>Update Registration Fee</h4>
                <small>This master fee will be applied to all new registrations and balance calculations.</small>
              </div>
              <button className="modal-close" onClick={() => setModal(null)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {formError && (
                <div className="track-result track-error" style={{ marginBottom: 14 }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{formError}</div>
                </div>
              )}
              <div className="field-block full" style={{ marginBottom: 14 }}>
                <label className="input-label" htmlFor="feeAmount">
                  Official Registration Fee Amount (₹) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontWeight: 800,
                      color: 'var(--navy)',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 10,
                      padding: '10px 14px',
                      background: '#f8fafc',
                    }}
                  >
                    ₹
                  </span>
                  <input
                    id="feeAmount"
                    type="number"
                    min="0"
                    step="1"
                    className="auth-input"
                    autoFocus
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Enter fee amount (e.g. 2400)"
                    style={{ fontWeight: 800, fontSize: '1.05rem' }}
                  />
                </div>
                <small style={{ color: 'var(--muted)', marginTop: 4 }}>
                  Enter a whole-rupee amount. New candidates will have this fee set as their standard processing charge.
                </small>
              </div>

              <div className="field-block full">
                <label className="input-label" htmlFor="feeDescription">
                  Description / Master Note
                </label>
                <input
                  id="feeDescription"
                  className="auth-input"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="e.g. Driver and Candidate Registration Processing Fee"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn add-user-btn modal-submit" onClick={save} disabled={saving}>
                <i className="bi bi-check-lg"></i>
                {saving ? 'Saving...' : 'Save Master Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
