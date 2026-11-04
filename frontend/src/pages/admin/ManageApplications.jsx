import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { registrationApi } from '../../api/registrationApi.js';
import { getSession } from '../../data/session.js';

/* 03 Nov 2026 style date */
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function rupees(str) {
  const n = parseFloat(String(str || '').replace(/[^\d.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function feesOf(a) {
  return {
    paid: `₹${Number(a.feesPaid || 0).toLocaleString('en-IN')}`,
    pending: `₹${Number(a.feesPending || 0).toLocaleString('en-IN')}`,
  };
}

const payClass = { Paid: 'paid', Pending: 'pending', Partial: 'partial' };

function toApplication(row) {
  const details = row.details || {};
  const payment = String(row.paymentStatus || 'PENDING').toLowerCase();
  return {
    ...row,
    payment: payment[0].toUpperCase() + payment.slice(1),
    mobile: row.mobile ? `+91 ${row.mobile}` : '',
    meta: details.gender ? `${details.gender}${details.age ? ` | Age: ${details.age}` : ''}` : '',
    photo: row.photoUrl || details.photoUrl || null,
    submittedBy: row.submittedByName || row.submittedBy?.name || '',
    submittedByMobile: row.submittedByMobile || row.submittedBy?.mobile || '',
    designation: row.designation || details.designation || '',
    dl: details.hasLicense === 'NO' ? 'NO LICENCE' : details.dlNumber || '—',
    vehicleNo: details.vehicleRegNo || '—',
    date: row.createdAt,
    registrationData: details,
  };
}

export default function ManageApplications({ mySubmissions = false }) {
  const navigate = useNavigate();
  const session = getSession();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feeModal, setFeeModal] = useState(null); // entry being fee-updated via ₹ button
  const [feeForm, setFeeForm] = useState({ paid: '0' });

  const refresh = async () => {
    setLoadError('');
    try {
      const rows = mySubmissions
        ? await registrationApi.listMine()
        : await registrationApi.listAll();
      setApps(rows.map(toApplication));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [mySubmissions]);

  const entries = apps;

  /* Unique list of employee names who filled forms (for the filter) */
  const staffList = useMemo(
    () => [...new Set(entries.map((a) => a.submittedBy || a.filledBy || 'Direct / Admin'))],
    [entries]
  );

  const filtered = useMemo(
    () =>
      entries.filter((a) => {
        const q = search.toLowerCase();
        const staff = a.submittedBy || a.filledBy || 'Direct / Admin';
        return (
          ((a.ref || '').toLowerCase().includes(q) || (a.name || '').toLowerCase().includes(q)) &&
          (staffFilter === 'All' || staff === staffFilter) &&
          (statusFilter === 'All' || (a.payment || 'Pending') === statusFilter)
        );
      }),
    [entries, search, staffFilter, statusFilter]
  );

  const paidCount = filtered.filter((a) => (a.payment || 'Pending') === 'Paid').length;
  const pendingCount = filtered.filter((a) => (a.payment || 'Pending') === 'Pending').length;
  const totalDues = filtered.reduce((sum, a) => sum + rupees(feesOf(a).pending), 0);

  if (!session) return <Navigate to="/login" replace />;

  const remove = async (ref) => {
    if (!window.confirm(`Delete application ${ref}? This cannot be undone.`)) return;
    try {
      await registrationApi.remove(ref);
      await refresh();
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const setPayment = async (ref, payment) => {
    const paidAmounts = { Pending: 0, Partial: 1200, Paid: 2400 };
    try {
      await registrationApi.review(ref, { feesPaid: paidAmounts[payment] });
      await refresh();
    } catch (error) {
      setLoadError(error.message);
    }
  };

  /* ---- Update Fees modal (₹ button) ---- */
  const openFees = (a) => {
    const fees = feesOf(a);
    setFeeForm({
      paid: String(rupees(fees.paid)),
    });
    setFeeModal(a);
  };

  const saveFees = async () => {
    if (!feeModal) return;
    const paidAmount = Number(feeForm.paid);
    if (!Number.isInteger(paidAmount) || paidAmount < 0 || paidAmount > 2400) {
      setLoadError('Paid amount must be a whole number between ₹0 and ₹2,400.');
      return;
    }
    setSaving(true);
    try {
      await registrationApi.review(feeModal.ref, { feesPaid: paidAmount });
      await refresh();
      setFeeModal(null);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      {loadError && <div className="track-result track-error" role="alert">{loadError}</div>}
      {/* ---------- Registry header ---------- */}
      <div className="registry-head">
        <span className="section-eyebrow">
          <i className={`bi ${mySubmissions ? 'bi-person-lines-fill' : 'bi-journal-text'}`}></i>{' '}
          {mySubmissions && session.role !== 'admin' ? 'My Submissions' : 'Manage Applications'}
        </span>
        <h2 className="section-title" style={{ fontSize: '1.45rem', marginBottom: 0 }}>
          {mySubmissions && session.role !== 'admin' ? 'My Submitted Forms' : 'Manpower Application Registry'}
        </h2>
      </div>

      {/* ---------- Stat cards ---------- */}
      <div className="stats-grid registry-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="bi bi-folder2-open"></i>
          </div>
          <div>
            <div className="stat-value">{loadError ? '—' : filtered.length}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="bi bi-check2-circle"></i>
          </div>
          <div>
            <div className="stat-value">{loadError ? '—' : paidCount}</div>
            <div className="stat-label">Paid / Verified Fees</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div>
            <div className="stat-value">{loadError ? '—' : pendingCount}</div>
            <div className="stat-label">Pending Payments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div>
            <div className="stat-value">{loadError ? '—' : `₹${totalDues.toLocaleString('en-IN')}`}</div>
            <div className="stat-label">Pending Processing Dues</div>
          </div>
        </div>
      </div>

      {/* ---------- Filters ---------- */}
      <div className="table-toolbar">
        <input
          className="auth-input"
          style={{ maxWidth: 260 }}
          placeholder="Search by reference code or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {(!mySubmissions || session.role === 'admin') && <select
          className="auth-input"
          style={{ maxWidth: 220 }}
          value={staffFilter}
          onChange={(e) => setStaffFilter(e.target.value)}
        >
          <option value="All">Filled By (Employee) — All</option>
          {staffList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>}
        <select
          className="auth-input"
          style={{ maxWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">Fees Status — All</option>
          <option>Pending</option>
          <option>Partial</option>
          <option>Paid</option>
        </select>
        <span style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{filtered.length} record(s)</span>
      </div>

      {/* ---------- Registry table ---------- */}
      <div className="admin-table-wrap">
        <table className="admin-table registry-table">
          <thead>
            <tr>
              <th>Reference No</th>
              <th>Photo</th>
              <th>Candidate Name</th>
              <th>Mobile</th>
              <th>Applied Role</th>
              <th>Filled By (Employee)</th>
              <th>DL &amp; Vehicle</th>
              <th>Fees Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="10" className="text-center py-4 text-muted">
                  {loadError
                    ? 'Applications could not be loaded.'
                    : mySubmissions
                    ? 'You have not submitted any registration forms yet.'
                    : 'No applications match the selected filters.'}
                </td>
              </tr>
            )}
            {filtered.map((a, i) => {
              const fees = feesOf(a);
              const pay = a.payment || 'Pending';
              return (
                <tr key={a.ref || `row-${i}`}>
                  <td>
                    <strong style={{ color: 'var(--navy)', letterSpacing: '.3px', whiteSpace: 'nowrap' }}>
                      {a.ref}
                    </strong>
                  </td>
                  <td>
                    {a.photo ? (
                      <img className="photo-thumb" src={a.photo} alt="" />
                    ) : (
                      <div className="photo-thumb photo-empty" title="No photograph attached">
                        <i className="bi bi-person-fill"></i>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="applicant-cell">
                      <strong>{a.name}</strong>
                      <small>{a.meta || '—'}</small>
                    </div>
                  </td>
                  <td className="mono-cell" style={{ whiteSpace: 'nowrap' }}>
                    {a.mobile || '—'}
                  </td>
                  <td>{a.designation || '—'}</td>
                  <td>
                    <div className="applicant-cell">
                      <strong>{a.submittedBy || a.filledBy || 'Direct / Admin'}</strong>
                      <small>{a.submittedByMobile || a.filledByMobile || ''}</small>
                    </div>
                  </td>
                  <td>
                    <div className="applicant-cell">
                      <small style={{ color: 'var(--navy)', fontWeight: 600 }}>{a.dl || '—'}</small>
                      <small>{a.vehicleNo || '—'}</small>
                    </div>
                  </td>
                  <td>
                    <div className="fees-cell">
                      {session.role === 'admin' ? (
                        <select
                          className={`status-select ${payClass[pay] || ''}`}
                          value={pay}
                          onChange={(e) => setPayment(a.ref, e.target.value)}
                        >
                          <option>Pending</option>
                          <option>Partial</option>
                          <option>Paid</option>
                        </select>
                      ) : (
                        <span className={`badge-pay ${payClass[pay] || ''}`}>{pay}</span>
                      )}
                      <small>
                        {fees.paid} paid / {fees.pending} pending
                      </small>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>                  {fmtDate(a.date)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="icon-btn"
                      title="View application"
                      onClick={() => navigate(
                        `${session.role === 'admin' ? '/admin/application' : '/my-submissions'}/${encodeURIComponent(a.ref)}`,
                        { state: { application: a } }
                      )}
                    >
                      <i className="bi bi-eye"></i>
                    </button>{' '}
                    {session.role === 'admin' && <><button
                      className="icon-btn"
                      title="Update fees"
                      onClick={() => openFees(a)}
                    >
                      <i className="bi bi-currency-rupee"></i>
                    </button>{' '}
                    <button className="icon-btn" title="Print registry" onClick={() => window.print()}>
                      <i className="bi bi-printer"></i>
                    </button>{' '}
                    <button
                      className="icon-btn danger"
                      title="Delete application"
                      onClick={() => remove(a.ref)}
                    >
                      <i className="bi bi-trash3"></i>
                    </button></>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && <p className="registry-note">Loading applications…</p>}
      {!loading && apps.length === 0 && <p className="registry-note">No application records found.</p>}

      {/* ============ UPDATE FEES MODAL (₹ icon) ============ */}
      {feeModal && (
        <div className="modal-overlay" onClick={() => setFeeModal(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-head">
              <div className="add-user-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <div>
                <h4>Update Fees: {feeModal.ref}</h4>
                <small>Applicant: {feeModal.name}</small>
              </div>
              <button className="modal-close" onClick={() => setFeeModal(null)} aria-label="Close">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="field-block full">
                <label className="input-label">Paid Amount (₹)</label>
                <input
                  className="auth-input"
                  type="number"
                  min="0"
                  value={feeForm.paid}
                  onChange={(e) => setFeeForm({ ...feeForm, paid: e.target.value })}
                  placeholder="e.g. 2400"
                />
              </div>
              <small>Pending dues are calculated from the ₹2,400 registration fee.</small>
            </div>

            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setFeeModal(null)}>
                Cancel
              </button>
              <button className="btn add-user-btn modal-submit" onClick={saveFees} disabled={saving}>
                <i className="bi bi-check-lg"></i> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
