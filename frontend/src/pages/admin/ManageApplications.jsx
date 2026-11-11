import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { registrationApi } from '../../api/registrationApi.js';
import { feeMasterApi } from '../../api/feeMasterApi.js';
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

function feesOf(a, currentFee) {
  const paidAmount = Number(a.feesPaid || 0);
  return {
    paid: `₹${paidAmount.toLocaleString('en-IN')}`,
    pending: `₹${Math.max(0, currentFee - paidAmount).toLocaleString('en-IN')}`,
  };
}

const payClass = { Paid: 'paid', Pending: 'pending', Partial: 'partial' };
export const isAdminRole = (role) => ['admin', 'super_admin'].includes(String(role || '').toLowerCase());

const applicationStatusLabel = (status) =>
  ({
    UNDER_REVIEW: 'Under Review',
    ADMIN_APPROVED: 'Admin Approved',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  }[status] || String(status || '—').replace(/_/g, ' '));

function toApplication(row) {
  const details = row.details || {};
  const payment = String(row.paymentStatus || 'PENDING').toLowerCase();
  const policeCertAvailable = details.hasPoliceCert
    ? details.hasPoliceCert === 'YES'
    : Boolean(details.policeCertNo || details.policeCertDate);
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
    policeCertStatus: policeCertAvailable ? 'Available' : 'Pending',
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
  const [masterFee, setMasterFee] = useState(2400);
  const pageSize = 10;
  const [filterValues, setFilterValues] = useState({
    keyword: '',
    staff: 'All',
    paymentStatus: 'All',
    designation: 'All',
    policeCert: 'All',
    fromDate: '',
    toDate: '',
  });
  const [feeModal, setFeeModal] = useState(null); // entry being fee-updated via ₹ button
  const [feeForm, setFeeForm] = useState({ paid: '' });
  const [feeSaveError, setFeeSaveError] = useState('');
  const [feeAttempted, setFeeAttempted] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [statusSaveError, setStatusSaveError] = useState('');
  const [editRequestModal, setEditRequestModal] = useState(null);
  const [editRequestNotes, setEditRequestNotes] = useState('');
  const [editRequestReason, setEditRequestReason] = useState('');
  const [editRequestError, setEditRequestError] = useState('');
  const [rejectionReasonModal, setRejectionReasonModal] = useState(null);
  const feeCurrentPaid = feeModal ? Number(feeModal.feesPaid || 0) : 0;
  const feePendingAmount = feeModal ? Math.max(0, masterFee - feeCurrentPaid) : 0;
  const feePaidNow = feeForm.paid === '' ? NaN : Number(feeForm.paid);
  const feeAmountValid =
    Number.isInteger(feePaidNow) &&
    feePaidNow > 0 &&
    feePaidNow <= feePendingAmount &&
    feeCurrentPaid + feePaidNow <= masterFee;
  const feeTotalAfter = feeAmountValid ? feeCurrentPaid + feePaidNow : feeCurrentPaid;
  const feePendingAfter = Math.max(0, masterFee - feeTotalAfter);
  const feeValidationError = feeAttempted || feeForm.paid !== ''
    ? !Number.isInteger(feePaidNow) || feePaidNow <= 0
      ? 'Enter a whole-rupee amount greater than ₹0.'
      : feePaidNow > feePendingAmount || feeCurrentPaid + feePaidNow > masterFee
        ? `Amount cannot exceed the current pending balance of ₹${feePendingAmount.toLocaleString('en-IN')}.`
        : ''
    : '';

  useEffect(() => {
    feeMasterApi.getRegistrationFee()
      .then((data) => {
        if (Number.isFinite(Number(data?.amount))) setMasterFee(Number(data.amount));
      })
      .catch(() => {});
  }, []);

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

  useEffect(() => {
    if (!editRequestModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !saving) setEditRequestModal(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editRequestModal, saving]);

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
      entries
        .filter((a) => {
          const q = filterValues.keyword.trim().toLowerCase();
          const staff = a.submittedBy || a.filledBy || 'Direct / Admin';
          const pan = a.registrationData?.pan || '';
          const voterId = a.registrationData?.voterId || '';
          const idDocNumber = a.registrationData?.idDocNumber || '';

          let dateMatches = true;
          if (filterValues.fromDate || filterValues.toDate) {
            const rawDate = a.date || a.createdAt;
            if (rawDate) {
              const dStr = new Date(rawDate).toISOString().slice(0, 10);
              if (filterValues.fromDate && dStr < filterValues.fromDate) dateMatches = false;
              if (filterValues.toDate && dStr > filterValues.toDate) dateMatches = false;
            } else {
              dateMatches = false;
            }
          }

          return (
            ((a.ref || '').toLowerCase().includes(q) ||
              (a.name || '').toLowerCase().includes(q) ||
              (a.mobile || '').toLowerCase().includes(q) ||
              pan.toLowerCase().includes(q) ||
              voterId.toLowerCase().includes(q) ||
              idDocNumber.toLowerCase().includes(q)) &&
            (filterValues.staff === 'All' || staff === filterValues.staff) &&
            (filterValues.paymentStatus === 'All' || (a.payment || 'Pending') === filterValues.paymentStatus) &&
            (filterValues.designation === 'All' || a.designation === filterValues.designation) &&
            (filterValues.policeCert === 'All' || a.policeCertStatus === filterValues.policeCert) &&
            dateMatches
          );
        })
        .sort((a, b) => {
          if (a.policeCertStatus !== b.policeCertStatus) {
            return a.policeCertStatus === 'Pending' ? -1 : 1;
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
    [entries, filterValues]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageEntries = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisible = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, filtered.length);
  const paidCount = filtered.filter((a) => (a.payment || 'Pending') === 'Paid').length;
  const pendingCount = filtered.filter((a) => (a.payment || 'Pending') === 'Pending').length;
  const totalDues = filtered.reduce((sum, a) => sum + rupees(feesOf(a, masterFee).pending), 0);

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
      policeCert: 'All',
      fromDate: '',
      toDate: '',
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
        { header: 'Police Certificate', key: 'policeCertificate', width: 20 },
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
        feesPending: Math.max(0, masterFee - Number(application.feesPaid || 0)),
        policeCertificate: application.policeCertStatus,
        submittedDate: fmtDate(application.date),
        branch: application.branch?.name || application.registrationData?.employeeBranch || '',
      })));
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF17365D' },
      };
      worksheet.autoFilter = { from: 'A1', to: 'Q1' };
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

  const stageApplicationStatus = (application, initialStatus) => {
    setStatusSaveError('');
    const userRole = String(session?.role || '').toLowerCase();
    let nextStatus = initialStatus || application.status || 'UNDER_REVIEW';
    if (userRole === 'admin' && application.status === 'UNDER_REVIEW') {
      nextStatus = 'ADMIN_APPROVED';
    } else if (userRole === 'super_admin' && application.status === 'ADMIN_APPROVED') {
      nextStatus = 'APPROVED';
    }
    setStatusModal({
      application,
      status: nextStatus,
      rejectionReason: application.rejectionReason || '',
    });
  };

  const saveApplicationStatus = async () => {
    if (!statusModal || saving) return;
    const { application, status } = statusModal;
    const rejectionReason = statusModal.rejectionReason.trim();
    if (status === 'REJECTED' && !rejectionReason) {
      setStatusSaveError('Enter a reason before rejecting this application.');
      return;
    }
    if (
      status === (application.status || 'UNDER_REVIEW') &&
      (status !== 'REJECTED' || rejectionReason === (application.rejectionReason || '').trim())
    ) return;
    const confirmationFailure = 'Application status was updated, but WhatsApp confirmation failed. Check the approved template configuration and retry by changing status away from Approved and approving again.';
    setSaving(true);
    setStatusSaveError('');
    setLoadError('');
    try {
      const updated = await registrationApi.review(application.ref, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
      });
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

  const openEditRequest = (application) => {
    setEditRequestNotes('');
    setEditRequestReason('');
    setEditRequestError('');
    setEditRequestModal({ application, mode: 'request' });
  };

  const openEditRequestReview = (application) => {
    setEditRequestReason('');
    setEditRequestError('');
    setEditRequestModal({ application, mode: 'review' });
  };

  const submitEditRequest = async () => {
    if (!editRequestModal || saving) return;
    const notes = editRequestNotes.trim();
    if (notes.length < 3) {
      setEditRequestError('Describe the correction you need (at least 3 characters).');
      return;
    }

    setSaving(true);
    setEditRequestError('');
    try {
      await registrationApi.requestEdit(editRequestModal.application.ref, notes);
      await refresh();
      setEditRequestModal(null);
    } catch (error) {
      setEditRequestError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const reviewEditRequest = async (action) => {
    if (!editRequestModal || saving) return;
    const reason = editRequestReason.trim();
    if (action === 'REJECT' && !reason) {
      setEditRequestError('Enter a rejection reason before rejecting this request.');
      return;
    }

    setSaving(true);
    setEditRequestError('');
    try {
      await registrationApi.reviewEditRequest(
        editRequestModal.application.ref,
        action,
        reason
      );
      await refresh();
      setEditRequestModal(null);
    } catch (error) {
      setEditRequestError(error.message);
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
      {mySubmissions && <h1 className="admin-page-title">My Submissions</h1>}
      {loadError && <div className="track-result track-error" role="alert">{loadError}</div>}

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
        {(!mySubmissions || isAdminRole(session.role)) && (
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
        <label className="registry-filter-field">
          <span>Police Certificate</span>
          <select
            className="auth-input"
            value={filterValues.policeCert}
            onChange={(e) => updateFilter('policeCert', e.target.value)}
          >
            <option value="All">All certificate statuses</option>
            <option value="Pending">Pending / Not available</option>
            <option value="Available">Certificate available</option>
          </select>
        </label>
        <label className="registry-filter-field">
          <span>From Date</span>
          <input
            type="date"
            className="auth-input"
            value={filterValues.fromDate}
            onChange={(e) => updateFilter('fromDate', e.target.value)}
            title="Filter applications submitted on or after this date"
          />
        </label>
        <label className="registry-filter-field">
          <span>To Date</span>
          <input
            type="date"
            className="auth-input"
            value={filterValues.toDate}
            onChange={(e) => updateFilter('toDate', e.target.value)}
            title="Filter applications submitted on or before this date"
          />
        </label>
        <div className="registry-filter-actions">
          {!mySubmissions && isAdminRole(session.role) && (
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
              <th>Police Certificate</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="12" className="text-center py-4 text-muted">
                  {loadError
                    ? 'Applications could not be loaded.'
                    : mySubmissions
                    ? 'You have not submitted any registration forms yet.'
                    : 'No applications match the selected filters.'}
                </td>
              </tr>
            )}
            {pageEntries.map((a, i) => {
              const fees = feesOf(a, masterFee);
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
                    {isAdminRole(session.role) ? (
                      <button
                        type="button"
                        className={`status-select app-status-select app-status-trigger ${String(
                          a.status || 'UNDER_REVIEW'
                        ).toLowerCase().replace(/_/g, '-')}`}
                        onClick={() => stageApplicationStatus(a, a.status || 'UNDER_REVIEW')}
                        aria-label={`Application status for ${a.ref}`}
                        aria-haspopup="dialog"
                        title="Click to review / update application status"
                      >
                        {applicationStatusLabel(a.status || 'UNDER_REVIEW')}
                      </button>
                    ) : (
                      <div className="applicant-cell">
                        <span className={mySubmissions
                          ? `employee-application-status ${String(a.status || 'UNDER_REVIEW')
                            .toLowerCase()
                            .replace(/_/g, '-')}`
                          : undefined}
                        >
                          {applicationStatusLabel(a.status || 'UNDER_REVIEW')}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="fees-cell">
                      <span className={`badge-pay ${payClass[pay] || ''}`}>{pay}</span>
                      <small>{fees.paid} paid</small>
                      <small>{fees.pending} pending</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pay ${a.policeCertStatus === 'Available' ? 'paid' : 'pending'}`}>
                      {a.policeCertStatus}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>                  {fmtDate(a.date)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="icon-btn view"
                      title="View application"
                      onClick={() => navigate(
                        `${isAdminRole(session.role) ? '/admin/application' : '/my-submissions'}/${encodeURIComponent(a.ref)}`,
                        { state: { application: a } }
                      )}
                    >
                      <i className="bi bi-eye"></i>
                    </button>{' '}
                    {mySubmissions && (
                      (a.status === 'REJECTED' && a.rejectionReason) ||
                      (a.editRequestStatus === 'REJECTED' && a.editRequestRejectionReason)
                    ) && (
                      <>
                        <button
                          type="button"
                          className="icon-btn danger"
                          title="View rejection reason"
                          aria-label={`View rejection reason for ${a.ref}`}
                          onClick={() => setRejectionReasonModal(a)}
                        >
                          <i className="bi bi-exclamation-circle-fill"></i>
                        </button>{' '}
                      </>
                    )}
                    {mySubmissions && (
                      a.editRequestStatus === 'APPROVED' ? (
                        <button
                          className="icon-btn primary"
                          title="Edit application (edit request approved)"
                          onClick={() => navigate(`/my-submissions/${encodeURIComponent(a.ref)}/edit`)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      ) : a.editRequestStatus === 'PENDING' ? (
                        <button
                          className="icon-btn disabled"
                          disabled
                          title="Edit request pending administrator review"
                          aria-label="Edit request pending administrator review"
                          style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        >
                          <i className="bi bi-hourglass-split"></i>
                        </button>
                      ) : (
                        <button
                          className="icon-btn primary"
                          title={a.editRequestStatus === 'REJECTED'
                            ? 'Request application correction again (previous request rejected)'
                            : 'Request permission to correct this application'}
                          aria-label={`Request an application correction for ${a.ref}`}
                          onClick={() => openEditRequest(a)}
                        >
                          <i className="bi bi-chat-left-text"></i>
                        </button>
                      )
                    )}{' '}
                    {isAdminRole(session.role) && <>
                    {a.editRequestStatus === 'PENDING' && <>
                    <button
                      className="icon-btn fees"
                      title="Review employee edit request"
                      aria-label={`Review edit request for ${a.ref}`}
                      onClick={() => openEditRequestReview(a)}
                    >
                      <i className="bi bi-chat-square-text"></i>
                    </button>{' '}
                    </>}
                    <button
                      className="icon-btn primary"
                      title="Edit application"
                      onClick={() => navigate(`/admin/application/${encodeURIComponent(a.ref)}/edit`)}
                    >
                      <i className="bi bi-pencil-square"></i>
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

      {editRequestModal && (() => {
        const application = editRequestModal.application;
        const isReview = editRequestModal.mode === 'review';
        const requestStatus = application.editRequestStatus;
        const role = String(session.role || '').toLowerCase();
        const canApprove = ['admin', 'super_admin'].includes(role) && requestStatus === 'PENDING';
        const waitingMessage = 'This request is no longer pending review.';

        return (
          <div
            className="modal-overlay"
            onClick={() => {
              if (!saving) setEditRequestModal(null);
            }}
          >
            <div
              className="modal-card"
              style={{ maxWidth: 540 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-request-title"
              aria-describedby="edit-request-description"
            >
              <div className="modal-head">
                <div className="add-user-icon" aria-hidden="true">
                  <i className={`bi ${isReview ? 'bi-chat-square-text' : 'bi-chat-left-text'}`}></i>
                </div>
                <div>
                  <h4 id="edit-request-title">
                    {isReview ? 'Review Correction Request' : 'Request Application Correction'}
                  </h4>
                  <small>{application.name} · Ref: {application.ref}</small>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setEditRequestModal(null)}
                  aria-label="Close"
                  disabled={saving}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body">
                {editRequestError && (
                  <div className="track-result track-error" role="alert">{editRequestError}</div>
                )}
                {isReview ? (
                  <>
                    <p id="edit-request-description">
                      <strong>Requested by:</strong> {application.editRequestedByName || 'Employee'}
                      {application.editRequestedAt && ` · ${fmtDate(application.editRequestedAt)}`}
                    </p>
                    <div className="field-block full">
                      <span className="input-label">Correction requested</span>
                      <div className="track-result" style={{ whiteSpace: 'pre-wrap' }}>
                        {application.editRequestNotes || 'No description was provided.'}
                      </div>
                    </div>
                    {!canApprove && (
                      <div className="track-result" role="status" style={{ marginTop: 12 }}>
                        {waitingMessage}
                      </div>
                    )}
                    {canApprove && (
                      <label
                        className="field-block full"
                        style={{
                          marginTop: 14,
                          padding: 12,
                          border: '1px solid #fca5a5',
                          borderRadius: 8,
                          background: '#fff7f7',
                        }}
                      >
                        <span className="input-label">Rejection reason (required to reject)</span>
                        <textarea
                          className="auth-input"
                          rows={4}
                          maxLength={2000}
                          value={editRequestReason}
                          onChange={(event) => {
                            setEditRequestReason(event.target.value);
                            setEditRequestError('');
                          }}
                          placeholder="Enter why this correction request is being rejected"
                          aria-label="Rejection reason for correction request"
                          disabled={saving}
                          style={{ resize: 'vertical' }}
                        />
                      </label>
                    )}
                  </>
                ) : (
                  <label className="field-block full">
                    <span id="edit-request-description" className="input-label">
                      Describe what needs to be corrected
                    </span>
                    <textarea
                      className="auth-input"
                      rows={5}
                      maxLength={2000}
                      value={editRequestNotes}
                      onChange={(event) => {
                        setEditRequestNotes(event.target.value);
                        setEditRequestError('');
                      }}
                      placeholder="For example: Please correct the candidate's address to..."
                      aria-describedby="edit-request-help"
                      aria-invalid={Boolean(editRequestError)}
                      disabled={saving}
                      required
                      style={{ resize: 'vertical', minHeight: 120 }}
                    />
                    <small id="edit-request-help">
                      Your request will be sent to the administrators. Editing is enabled after approval.
                    </small>
                  </label>
                )}
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditRequestModal(null)}
                  disabled={saving}
                >
                  Close
                </button>
                {isReview && canApprove ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => reviewEditRequest('REJECT')}
                      disabled={saving || !editRequestReason.trim()}
                    >
                      <i className="bi bi-x-circle"></i> {saving ? 'Saving...' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      className="btn add-user-btn modal-submit"
                      onClick={() => reviewEditRequest('APPROVE')}
                      disabled={saving}
                    >
                      <i className="bi bi-check-lg"></i> {saving ? 'Saving...' : 'Approve'}
                    </button>
                  </>
                ) : !isReview ? (
                  <button
                    type="button"
                    className="btn add-user-btn modal-submit"
                    onClick={submitEditRequest}
                    disabled={saving || editRequestNotes.trim().length < 3}
                  >
                    <i className="bi bi-send"></i> {saving ? 'Sending...' : 'Send Request'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })()}

      {statusModal && (() => {
        const userRole = String(session.role || '').toLowerCase();
        const isAdmin = userRole === 'admin';
        const isSuperAdmin = userRole === 'super_admin';
        const currentAppStatus = statusModal.application.status || 'UNDER_REVIEW';

        let statusOptions = [];
        let roleGuidance = '';
        let cannotApproveNotice = '';

        if (isAdmin) {
          statusOptions = [
            { value: 'UNDER_REVIEW', label: 'Under Review' },
            { value: 'ADMIN_APPROVED', label: 'Admin Approved' },
            { value: 'REJECTED', label: 'Rejected' },
          ];
          if (currentAppStatus === 'APPROVED') {
            statusOptions.unshift({ value: 'APPROVED', label: 'Approved (Both Approved)' });
          }
          roleGuidance = 'Admin Review: Super Admin gives final approval after Admin approval.';
        } else if (isSuperAdmin) {
          if (currentAppStatus === 'UNDER_REVIEW') {
            cannotApproveNotice = 'Admin must review and approve this application first before Super Admin can approve.';
            statusOptions = [
              { value: 'UNDER_REVIEW', label: 'Under Review (Awaiting Admin)' },
              { value: 'REJECTED', label: 'Reject' },
            ];
          } else {
            statusOptions = [
              { value: 'ADMIN_APPROVED', label: 'Admin Approved' },
              { value: 'APPROVED', label: 'Approve (Super Admin Final Approval)' },
              { value: 'REJECTED', label: 'Reject' },
            ];
            roleGuidance = 'Super Admin Final Review: Admin has approved this application. Employees may separately request permission to correct their application.';
          }
        }

        const isSubmitDisabled = saving ||
          (statusModal.status === currentAppStatus &&
            (statusModal.status !== 'REJECTED' ||
              statusModal.rejectionReason.trim() === (statusModal.application.rejectionReason || '').trim())) ||
          (statusModal.status === 'REJECTED' && !statusModal.rejectionReason.trim()) ||
          (isSuperAdmin && currentAppStatus === 'UNDER_REVIEW' && statusModal.status === 'APPROVED') ||
          (isAdmin && statusModal.status === 'APPROVED' && currentAppStatus !== 'APPROVED');

        return (
          <div
            className="modal-overlay"
            onClick={() => {
              if (!saving) setStatusModal(null);
            }}
          >
            <div
              className="modal-card"
              style={{ maxWidth: 500 }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="status-confirmation-title"
              aria-describedby="status-confirmation-description"
            >
              <div className="modal-head">
                <div className="add-user-icon" aria-hidden="true">
                  <i className="bi bi-shield-check"></i>
                </div>
                <div>
                  <h4 id="status-confirmation-title">Review Application Status</h4>
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

                {/* Audit trail / 2-level status display */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 14,
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>1. Admin Approval:</span>
                    <span style={{ fontWeight: 600, color: statusModal.application.adminApprovedAt ? '#16a34a' : '#d97706' }}>
                      {statusModal.application.adminApprovedAt
                        ? `✓ Approved by ${statusModal.application.adminApprovedByName || 'Admin'} (${fmtDate(statusModal.application.adminApprovedAt)})`
                        : '○ Pending Review'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>2. Super Admin Approval:</span>
                    <span style={{ fontWeight: 600, color: statusModal.application.superAdminApprovedAt ? '#16a34a' : '#d97706' }}>
                      {statusModal.application.superAdminApprovedAt
                        ? `✓ Approved by ${statusModal.application.superAdminApprovedByName || 'Super Admin'} (${fmtDate(statusModal.application.superAdminApprovedAt)})`
                        : '○ Pending Review'}
                    </span>
                  </div>
                </div>

                {cannotApproveNotice && (
                  <div className="track-result track-error" style={{ marginBottom: 12 }}>
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <div>{cannotApproveNotice}</div>
                  </div>
                )}

                {roleGuidance && (
                  <p id="status-confirmation-description" style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: 12 }}>
                    {roleGuidance}
                  </p>
                )}

                <div className="modal-grid">
                  <div className="field-block status-change-field">
                    <span className="input-label">Select Action / Status</span>
                    <div className="status-confirmation-control">
                      <select
                        className="status-confirmation-select"
                        value={statusModal.status}
                        onChange={(event) => setStatusModal((current) => (
                          current ? { ...current, status: event.target.value } : current
                        ))}
                        disabled={saving}
                        aria-label="New application status"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <i className="bi bi-chevron-down status-confirmation-chevron" aria-hidden="true"></i>
                    </div>
                  </div>
                </div>
                {statusModal.status === 'REJECTED' && (
                  <label className="field-block full" style={{ marginTop: 14 }}>
                    <span className="input-label">Rejection reason (required)</span>
                    <textarea
                      className="auth-input"
                      rows={4}
                      maxLength={2000}
                      value={statusModal.rejectionReason}
                      onChange={(event) => {
                        const rejectionReason = event.target.value;
                        setStatusModal((current) => current
                          ? { ...current, rejectionReason }
                          : current);
                        setStatusSaveError('');
                      }}
                      placeholder="Explain why this application is being rejected"
                      aria-label="Application rejection reason"
                      required
                      disabled={saving}
                      style={{ resize: 'vertical' }}
                    />
                  </label>
                )}
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
                  disabled={isSubmitDisabled}
                >
                  <i className="bi bi-check-lg"></i> {saving ? 'Saving...' : 'Confirm Status'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {rejectionReasonModal && (
        <div
          className="modal-overlay"
          onClick={() => setRejectionReasonModal(null)}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 500 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-reason-title"
          >
            <div className="modal-head">
              <div className="add-user-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <i className="bi bi-exclamation-circle-fill"></i>
              </div>
              <div>
                <h4 id="rejection-reason-title">Rejection Reason</h4>
                <small>{rejectionReasonModal.name} · Ref: {rejectionReasonModal.ref}</small>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setRejectionReasonModal(null)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              {rejectionReasonModal.status === 'REJECTED' && rejectionReasonModal.rejectionReason && (
                <div className="field-block full">
                  <span className="input-label">
                    Application rejected by {rejectionReasonModal.rejectedByRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                  </span>
                  <div className="track-result track-error" role="note" style={{ whiteSpace: 'pre-wrap' }}>
                    {rejectionReasonModal.rejectionReason}
                  </div>
                </div>
              )}
              {rejectionReasonModal.editRequestStatus === 'REJECTED' &&
                rejectionReasonModal.editRequestRejectionReason && (
                  <div className="field-block full" style={{ marginTop: 12 }}>
                    <span className="input-label">
                      Correction request rejected{rejectionReasonModal.editRejectedByName
                        ? ` by ${rejectionReasonModal.editRejectedByName}`
                        : ''}
                    </span>
                    <div className="track-result track-error" role="note" style={{ whiteSpace: 'pre-wrap' }}>
                      {rejectionReasonModal.editRequestRejectionReason}
                    </div>
                  </div>
                )}
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setRejectionReasonModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
