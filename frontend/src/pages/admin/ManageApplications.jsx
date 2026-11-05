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

const REGISTRATION_FEE = 2400;

function feesOf(a) {
  return {
    paid: `₹${Number(a.feesPaid || 0).toLocaleString('en-IN')}`,
    pending: `₹${Number(a.feesPending || 0).toLocaleString('en-IN')}`,
  };
}

const payClass = { Paid: 'paid', Pending: 'pending', Partial: 'partial' };
const applicationStatusLabel = (status) =>
  ({
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }[status] || String(status || '—').replace(/_/g, ' '));

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
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [filterValues, setFilterValues] = useState({
    keyword: '',
    staff: 'All',
    paymentStatus: 'All',
    designation: 'All',
  });
  const [feeModal, setFeeModal] = useState(null); // entry being fee-updated via ₹ button
  const [feeForm, setFeeForm] = useState({ paid: '' });
  const [feeSaveError, setFeeSaveError] = useState('');
  const [feeAttempted, setFeeAttempted] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [statusSaveError, setStatusSaveError] = useState('');
  const feeCurrentPaid = feeModal ? Number(feeModal.feesPaid || 0) : 0;
  const feePendingAmount = feeModal
    ? Number(feeModal.feesPending ?? Math.max(0, REGISTRATION_FEE - feeCurrentPaid))
    : 0;
  const feePaidNow = feeForm.paid === '' ? NaN : Number(feeForm.paid);
  const feeAmountValid =
    Number.isInteger(feePaidNow) &&
    feePaidNow > 0 &&
    feePaidNow <= feePendingAmount &&
    feeCurrentPaid + feePaidNow <= REGISTRATION_FEE;
  const feeTotalAfter = feeAmountValid ? feeCurrentPaid + feePaidNow : feeCurrentPaid;
  const feePendingAfter = Math.max(0, REGISTRATION_FEE - feeTotalAfter);
  const feeValidationError = feeAttempted || feeForm.paid !== ''
    ? !Number.isInteger(feePaidNow) || feePaidNow <= 0
      ? 'Enter a whole-rupee amount greater than ₹0.'
      : feePaidNow > feePendingAmount || feeCurrentPaid + feePaidNow > REGISTRATION_FEE
        ? `Amount cannot exceed the current pending balance of ₹${feePendingAmount.toLocaleString('en-IN')}.`
        : ''
    : '';

  const refresh = async () => {
    setLoadError('');
    setCurrentPage(1);
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

  useEffect(() => {
    if (!statusModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) setStatusModal(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [statusModal, saving]);

  const entries = apps;

  /* Unique list of employee names who filled forms (for the filter) */
  const staffList = useMemo(
    () => [...new Set(entries.map((a) => a.submittedBy || a.filledBy || 'Direct / Admin'))],
    [entries]
  );

  const designationList = useMemo(
    () => [...new Set(entries.map((a) => a.designation).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [entries]
  );

  const filtered = useMemo(
    () =>
      entries.filter((a) => {
        const q = filterValues.keyword.trim().toLowerCase();
        const staff = a.submittedBy || a.filledBy || 'Direct / Admin';
        return (
          ((a.ref || '').toLowerCase().includes(q) ||
            (a.name || '').toLowerCase().includes(q) ||
            (a.mobile || '').toLowerCase().includes(q) ||
            (a.registrationData?.pan || '').toLowerCase().includes(q)) &&
          (filterValues.staff === 'All' || staff === filterValues.staff) &&
          (filterValues.paymentStatus === 'All' || (a.payment || 'Pending') === filterValues.paymentStatus) &&
          (filterValues.designation === 'All' || a.designation === filterValues.designation)
        );
      }),
    [entries, filterValues]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageEntries = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisible = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, filtered.length);
  const paidCount = filtered.filter((a) => (a.payment || 'Pending') === 'Paid').length;
  const pendingCount = filtered.filter((a) => (a.payment || 'Pending') === 'Pending').length;
  const totalDues = filtered.reduce((sum, a) => sum + rupees(feesOf(a).pending), 0);

  if (!session) return <Navigate to="/login" replace />;

  const updateFilter = (key, value) => {
    setCurrentPage(1);
    setFilterValues((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    const clearedFilters = {
      keyword: '',
      staff: 'All',
      paymentStatus: 'All',
      designation: 'All',
    };
    setCurrentPage(1);
    setFilterValues(clearedFilters);
  };

  const exportFilteredApplications = async () => {
    setExportError('');
    setExporting(true);
    try {
      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Applications');
      worksheet.columns = [
        { header: 'Reference No', key: 'ref', width: 22 },
        { header: 'Candidate Name', key: 'candidateName', width: 28 },
        { header: 'Mobile', key: 'mobile', width: 18 },
        { header: 'Applied Role', key: 'designation', width: 24 },
        { header: 'Gender', key: 'gender', width: 14 },
        { header: 'Age', key: 'age', width: 10 },
        { header: 'Filled By (Employee)', key: 'filledBy', width: 26 },
        { header: 'Employee Mobile', key: 'employeeMobile', width: 18 },
        { header: 'Driving Licence', key: 'drivingLicense', width: 22 },
        { header: 'Vehicle No', key: 'vehicleNo', width: 20 },
        { header: 'Application Status', key: 'applicationStatus', width: 20 },
        { header: 'Fees Status', key: 'feesStatus', width: 14 },
        { header: 'Fees Paid (INR)', key: 'feesPaid', width: 16 },
        { header: 'Fees Pending (INR)', key: 'feesPending', width: 18 },
        { header: 'Submitted Date', key: 'submittedDate', width: 18 },
        { header: 'Branch', key: 'branch', width: 22 },
      ];
      worksheet.addRows(filtered.map((application) => ({
        ref: application.ref || '',
        candidateName: application.name || '',
        mobile: application.mobile || '',
        designation: application.designation || '',
        gender: application.registrationData?.gender || '',
        age: application.registrationData?.age || '',
        filledBy: application.submittedBy || application.filledBy || 'Direct / Admin',
        employeeMobile: application.submittedByMobile || application.filledByMobile || '',
        drivingLicense: application.dl === 'NO LICENCE' ? 'No Licence' : application.dl === '—' ? '' : application.dl,
        vehicleNo: application.vehicleNo === '—' ? '' : application.vehicleNo,
        applicationStatus: applicationStatusLabel(application.status || 'UNDER_REVIEW'),
        feesStatus: application.payment || 'Pending',
        feesPaid: Number(application.feesPaid || 0),
        feesPending: Number(application.feesPending || 0),
        submittedDate: fmtDate(application.date),
        branch: application.branch?.name || application.registrationData?.employeeBranch || '',
      })));
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF17365D' },
      };
      worksheet.autoFilter = { from: 'A1', to: 'P1' };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(`Could not export applications: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const remove = async (ref) => {
    if (!window.confirm(`Delete application ${ref}? This cannot be undone.`)) return;
    try {
      await registrationApi.remove(ref);
      await refresh();
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const stageApplicationStatus = (application, status) => {
    setStatusSaveError('');
    setStatusModal({ application, status });
  };

  const saveApplicationStatus = async () => {
    if (!statusModal || saving) return;
    const { application, status } = statusModal;
    if (status === (application.status || 'UNDER_REVIEW')) return;
    const confirmationFailure = 'Application status was updated, but WhatsApp confirmation failed. Check the approved template configuration and retry by changing status away from Approved and approving again.';
    setSaving(true);
    setStatusSaveError('');
    setLoadError('');
    try {
      const updated = await registrationApi.review(application.ref, { status });
      await refresh();
      if (updated.confirmationStatus === 'FAILED') setLoadError(confirmationFailure);
      setStatusModal(null);
    } catch (error) {
      setStatusSaveError(error.message);
      setLoadError(error.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---- Update Fees modal (₹ button) ---- */
  const openFees = (a) => {
    setFeeForm({ paid: '' });
    setFeeSaveError('');
    setFeeAttempted(false);
    setFeeModal(a);
  };

  const saveFees = async () => {
    if (!feeModal) return;
    setFeeAttempted(true);
    if (!feeAmountValid) {
      setFeeSaveError(feeValidationError || 'Enter a valid payment amount.');
      return;
    }
    setSaving(true);
    setFeeSaveError('');
    try {
      await registrationApi.review(feeModal.ref, { feesPaid: feeCurrentPaid + feePaidNow });
      await refresh();
      setFeeModal(null);
    } catch (error) {
      setFeeSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`admin-panel ${mySubmissions ? 'my-submissions-neat' : 'manage-apps-neat'}`}>
      {loadError && <div className="track-result track-error" role="alert">{loadError}</div>}
      {mySubmissions && (
        <header className="neat-registry-head my-submissions-welcome">
          <span className="admin-welcome-mark" aria-hidden="true">
            <i className="bi bi-file-earmark-person"></i>
          </span>
          <div className="admin-welcome-copy my-submissions-welcome-copy">
            <span className="section-eyebrow">My Submissions</span>
            <h1 className="section-title">Welcome, {session.name}</h1>
            <p>
              <strong>My Submitted Forms</strong>
              <span aria-hidden="true"> — </span>
              Review and track the registration forms you have submitted.
            </p>
          </div>
          <div className="neat-head-chip my-submissions-count">
            <i className="bi bi-files" aria-hidden="true"></i>
            {loading ? 'Loading…' : `${apps.length} ${apps.length === 1 ? 'record' : 'records'}`}
          </div>
        </header>
      )}

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
      <form
        className="registry-filter-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setCurrentPage(1);
        }}
      >
        <label className="registry-filter-field registry-filter-keyword">
          <span>Keyword Search</span>
          <input
            className="auth-input"
            placeholder="Candidate, Ref, Mobile or PAN"
            value={filterValues.keyword}
            onChange={(e) => updateFilter('keyword', e.target.value)}
          />
        </label>
        {(!mySubmissions || session.role === 'admin') && (
          <label className="registry-filter-field">
            <span>Filled By Employee / Staff</span>
            <select
              className="auth-input"
              value={filterValues.staff}
              onChange={(e) => updateFilter('staff', e.target.value)}
            >
              <option value="All">All employees / staff</option>
              {staffList.map((staff) => (
                <option key={staff} value={staff}>{staff}</option>
              ))}
            </select>
          </label>
        )}
        <label className="registry-filter-field">
          <span>Payment Status</span>
          <select
            className="auth-input"
            value={filterValues.paymentStatus}
            onChange={(e) => updateFilter('paymentStatus', e.target.value)}
          >
            <option value="All">All payment statuses</option>
            <option>Pending</option>
            <option>Partial</option>
            <option>Paid</option>
          </select>
        </label>
        <label className="registry-filter-field">
          <span>Applied Designation</span>
          <select
            className="auth-input"
            value={filterValues.designation}
            onChange={(e) => updateFilter('designation', e.target.value)}
          >
            <option value="All">All designations</option>
            {designationList.map((designation) => (
              <option key={designation} value={designation}>{designation}</option>
            ))}
          </select>
        </label>
        <div className="registry-filter-actions">
          <button type="submit" className="btn btn-primary registry-filter-apply">
            <i className="bi bi-funnel"></i> Filter
          </button>
          {!mySubmissions && session.role === 'admin' && (
            <button
              type="button"
              className="btn btn-outline registry-filter-apply registry-export-excel"
              onClick={exportFilteredApplications}
              disabled={loading || exporting || filtered.length === 0}
            >
              <i className="bi bi-file-earmark-spreadsheet"></i>{' '}
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
          <button
            type="button"
            className="registry-filter-reset"
            onClick={resetFilters}
            aria-label="Reset all filters"
            title="Reset all filters"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
        </div>
      </form>
      {exportError && <div className="track-result track-error" role="alert">{exportError}</div>}

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
              <th className="registry-filled-by-heading">Filled By (Employee)</th>
              <th>DL &amp; Vehicle</th>
              <th>Application Status</th>
              <th>Fees Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center py-4 text-muted">
                  {loadError
                    ? 'Applications could not be loaded.'
                    : mySubmissions
                    ? 'You have not submitted any registration forms yet.'
                    : 'No applications match the selected filters.'}
                </td>
              </tr>
            )}
            {pageEntries.map((a, i) => {
              const fees = feesOf(a);
              const pay = a.payment || 'Pending';
              return (
                <tr key={a.ref || `row-${i}`}>
                  <td>
                    <strong style={{ color: 'var(--navy)', letterSpacing: '.3px', overflowWrap: 'anywhere' }}>
                      {a.ref}
                    </strong>
                  </td>
                  <td>
                    {a.photo ? (
                      <img
                        className="photo-thumb"
                        src={a.photo}
                        alt=""
                        crossOrigin={String(a.photo).startsWith('http') ? 'use-credentials' : undefined}
                      />
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
                    {session.role === 'admin' ? (
                      <button
                        type="button"
                        className={`status-select app-status-select app-status-trigger ${String(
                          a.status || 'UNDER_REVIEW'
                        ).toLowerCase().replace('_', '-')}`}
                        onClick={() => stageApplicationStatus(a, a.status || 'UNDER_REVIEW')}
                        aria-label={`Application status for ${a.ref}`}
                        aria-haspopup="dialog"
                        title="Click to change application status"
                      >
                        {applicationStatusLabel(a.status || 'UNDER_REVIEW')}
                      </button>
                    ) : (
                      <span>{String(a.status || 'UNDER_REVIEW').replace(/_/g, ' ')}</span>
                    )}
                  </td>
                  <td>
                    <div className="fees-cell">
                      <span className={`badge-pay ${payClass[pay] || ''}`}>{pay}</span>
                      <small>{fees.paid} paid</small>
                      <small>{fees.pending} pending</small>
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>                  {fmtDate(a.date)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="icon-btn view"
                      title="View application"
                      onClick={() => navigate(
                        `${session.role === 'admin' ? '/admin/application' : '/my-submissions'}/${encodeURIComponent(a.ref)}`,
                        { state: { application: a } }
                      )}
                    >
                      <i className="bi bi-eye"></i>
                    </button>{' '}
                    {session.role === 'admin' && <>
                    <button
                      className="icon-btn primary"
                      title="Edit application"
                      onClick={() => navigate(`/admin/application/${encodeURIComponent(a.ref)}/edit`)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>{' '}
                    <button
                      className="icon-btn fees"
                      title="Update fees"
                      onClick={() => openFees(a)}
                    >
                      <i className="bi bi-currency-rupee"></i>
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

      <nav className="registry-pagination" aria-label="Applications pagination">
        <span className="registry-pagination-count">
          Showing {firstVisible}–{lastVisible} of {filtered.length} applications
        </span>
        <div className="registry-pagination-controls">
          <button
            type="button"
            className="registry-page-button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="registry-page-indicator">Page {currentPage} of {pageCount}</span>
          <button
            type="button"
            className="registry-page-button"
            onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
            disabled={currentPage === pageCount}
            aria-label="Next page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </nav>

      {loading && <p className="registry-note">Loading applications…</p>}
      {!loading && apps.length === 0 && <p className="registry-note">No application records found.</p>}

      {/* ============ UPDATE FEES MODAL (₹ icon) ============ */}
      {feeModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) setFeeModal(null);
          }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fees-modal-title"
            aria-describedby="fees-modal-description"
          >
            <div className="modal-head">
              <div className="add-user-icon">
                <i className="bi bi-currency-rupee"></i>
              </div>
              <div>
                <h4 id="fees-modal-title">Record Fee Payment</h4>
                <small>{feeModal.name} · Ref: {feeModal.ref}</small>
              </div>
              <button
                className="modal-close"
                onClick={() => setFeeModal(null)}
                aria-label="Close"
                disabled={saving}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              <p id="fees-modal-description">
                Enter the amount received now. The payment status and remaining balance are calculated from the total paid.
              </p>
              <div className="modal-grid fee-payment-summary">
                <div className="field-block full">
                  <label className="input-label" htmlFor="fee-amount-paid">Amount paid now (₹)</label>
                  <input
                    id="fee-amount-paid"
                    className="auth-input"
                    type="number"
                    min="1"
                    max={feePendingAmount}
                    step="1"
                    value={feeForm.paid}
                    onBlur={() => setFeeAttempted(true)}
                    onChange={(e) => {
                      setFeeForm({ paid: e.target.value });
                      setFeeSaveError('');
                    }}
                    placeholder={`Enter up to ₹${feePendingAmount.toLocaleString('en-IN')}`}
                    aria-invalid={Boolean(feeSaveError || feeValidationError)}
                    aria-describedby={feeSaveError || feeValidationError ? 'fee-payment-error' : undefined}
                    disabled={saving || feePendingAmount === 0}
                  />
                </div>
                <div className="field-block">
                  <span className="input-label">Total paid after</span>
                  <strong>₹{feeTotalAfter.toLocaleString('en-IN')}</strong>
                </div>
                <div className="field-block">
                  <span className="input-label">Pending dues</span>
                  <strong>₹{feePendingAfter.toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <div className="fee-current-summary">
                <small>Current paid: ₹{feeCurrentPaid.toLocaleString('en-IN')}</small>
                <small>Current pending: ₹{feePendingAmount.toLocaleString('en-IN')}</small>
              </div>
              {(feeSaveError || feeValidationError) && (
                <div id="fee-payment-error" className="track-result track-error" role="alert">
                  {feeSaveError || feeValidationError}
                </div>
              )}
              {feePendingAmount === 0 && (
                <div className="track-result" role="status">
                  This application has no remaining fee balance.
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button
                className="btn btn-outline"
                onClick={() => setFeeModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn add-user-btn modal-submit"
                onClick={saveFees}
                disabled={saving || !feeAmountValid}
              >
                <i className="bi bi-check-lg"></i> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {statusModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!saving) setStatusModal(null);
          }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-confirmation-title"
            aria-describedby="status-confirmation-description"
          >
            <div className="modal-head">
              <div className="add-user-icon" aria-hidden="true">
                <i className="bi bi-arrow-left-right"></i>
              </div>
              <div>
                <h4 id="status-confirmation-title">Confirm status change</h4>
                <small>
                  {statusModal.application.name || 'Candidate'} · Ref: {statusModal.application.ref}
                </small>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setStatusModal(null)}
                aria-label="Close"
                disabled={saving}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="modal-body">
              {statusSaveError && <div className="track-result track-error" role="alert">{statusSaveError}</div>}
              <p id="status-confirmation-description">
                Confirm the application status update for {statusModal.application.name || 'this candidate'}.
              </p>
              <div className="modal-grid">
                <div className="field-block status-change-field">
                  <span className="input-label">New status</span>
                  <select
                    className={`status-confirmation-select ${statusModal.status
                      .toLowerCase()
                      .replace('_', '-')}`}
                    value={statusModal.status}
                    onChange={(event) => setStatusModal((current) => (
                      current ? { ...current, status: event.target.value } : current
                    ))}
                    disabled={saving}
                    aria-label="New application status"
                  >
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStatusModal(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn add-user-btn modal-submit"
                onClick={saveApplicationStatus}
                disabled={saving || statusModal.status === (statusModal.application.status || 'UNDER_REVIEW')}
              >
                <i className="bi bi-check-lg"></i> {saving ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
