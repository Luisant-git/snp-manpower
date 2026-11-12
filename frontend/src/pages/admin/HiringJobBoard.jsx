import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hiringJobsApi } from '../../api/hiringJobsApi.js';
import { jobRequirementsApi } from '../../api/jobRequirementsApi.js';
import {
  formatJobDate,
  formatJobExperience,
  formatJobSalary,
  jobSearchText,
} from '../../data/jobDisplay.js';
import { getSession } from '../../data/session.js';

const PAGE_SIZES = [10, 25, 50];

const APPROVAL_META = {
  PENDING: { label: 'Pending Admin', className: 'pending' },
  ADMIN_APPROVED: { label: 'Pending Super Admin', className: 'admin-approved' },
  APPROVED: { label: 'Approved', className: 'approved' },
  REJECTED: { label: 'Rejected', className: 'rejected' },
};

function canCloseJob(job, approvalStatus, role) {
  return (role === 'admin' || role === 'super_admin') &&
    String(job.status || '').toUpperCase() !== 'CLOSED' &&
    approvalStatus === 'APPROVED';
}

function canReopenJob(job, approvalStatus, role) {
  return (role === 'admin' || role === 'super_admin') &&
    String(job.status || '').toUpperCase() === 'CLOSED' &&
    approvalStatus === 'APPROVED';
}

export default function HiringJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvals, setApprovals] = useState({});
  const [allJobs, setAllJobs] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [viewJob, setViewJob] = useState(null);
  const [decisionJob, setDecisionJob] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState('');
  const viewDialogRef = useRef(null);
  const decisionDialogRef = useRef(null);
  const confirmationDialogRef = useRef(null);
  const viewTriggerRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const session = getSession();
  const role = String(session?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const dateRangeError = fromDate && toDate && fromDate > toDate
    ? 'From date must be on or before To date.'
    : '';

  useEffect(() => {
    const activeDialog = selectedDecision
      ? confirmationDialogRef.current
      : decisionJob
        ? decisionDialogRef.current
        : viewJob
          ? viewDialogRef.current
          : null;
    if (!activeDialog) {
      viewTriggerRef.current?.focus();
      return undefined;
    }

    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (selectedDecision) {
          setSelectedDecision('');
          setActionError('');
        } else if (decisionJob) {
          setDecisionJob(null);
          setActionError('');
        } else {
          setViewJob(null);
        }
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(activeDialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !activeDialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !activeDialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const firstFocusable = activeDialog.querySelector('button:not([disabled])');
    if (firstFocusable) firstFocusable.focus();
    else activeDialog.focus();
    window.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      window.removeEventListener('keydown', handleDialogKeyDown);
    };
  }, [viewJob, decisionJob, selectedDecision]);

  const loadJobs = useCallback(async (signal) => {
    if (dateRangeError) {
      setJobs([]);
      setTotal(0);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await jobRequirementsApi.list({
        page,
        limit: pageSize,
        fromDate,
        toDate,
        signal,
      });
      setJobs(result.jobs || []);
      setTotal(result.total);
      const resultPageCount = Math.max(1, Math.ceil(result.total / pageSize));
      if (page > resultPageCount) setPage(resultPageCount);
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message);
        setJobs([]);
        setTotal(0);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }

    if (signal?.aborted) return;
  }, [page, pageSize, fromDate, toDate, dateRangeError]);

  useEffect(() => {
    const controller = new AbortController();
    loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs, refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    setStatsLoading(true);
    setApprovalLoading(true);
    setStatsError('');
    setApprovalError('');
    Promise.allSettled([
      jobRequirementsApi.listAll({ signal: controller.signal }),
      hiringJobsApi.approvals(controller.signal),
    ]).then(([jobsResult, approvalsResult]) => {
      if (controller.signal.aborted) return;
      if (jobsResult.status === 'fulfilled') {
        setAllJobs(jobsResult.value);
      } else if (jobsResult.reason.name !== 'AbortError') {
        setAllJobs(null);
        setStatsError(jobsResult.reason.message);
      }
      if (approvalsResult.status === 'fulfilled') {
        setApprovals(Object.fromEntries(
          (approvalsResult.value.approvals || []).map((approval) => [String(approval.externalJobId), approval]),
        ));
      } else if (approvalsResult.reason.name !== 'AbortError') {
        setApprovalError(approvalsResult.reason.message);
      }
    }).finally(() => {
      if (!controller.signal.aborted) {
        setStatsLoading(false);
        setApprovalLoading(false);
      }
    });
    return () => controller.abort();
  }, [refreshKey]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch = !query || jobSearchText(job).includes(query);
      const matchesStatus = statusFilter === 'ALL' ||
        String(job.status || '').toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const stats = useMemo(() => {
    if (!allJobs) return null;
    let active = 0;
    let pending = 0;
    let rejected = 0;

    allJobs.jobs.forEach((job) => {
      if (String(job.status || '').toUpperCase() === 'ACTIVE') active += 1;
      const approvalStatus = approvals[String(job.id)]?.status || 'PENDING';
      if (approvalStatus === 'PENDING' || approvalStatus === 'ADMIN_APPROVED') pending += 1;
      if (approvalStatus === 'REJECTED') rejected += 1;
    });

    return { total: allJobs.total, active, pending, rejected };
  }, [allJobs, approvals]);

  const saveDecision = async () => {
    if (!decisionJob || !selectedDecision) return;
    if (selectedDecision === 'CLOSE' &&
      !canCloseJob(decisionJob, approvals[String(decisionJob.id)]?.status || 'PENDING', role)) {
      setSelectedDecision('');
      setActionError('Only approved jobs can be closed.');
      return;
    }
    if (selectedDecision === 'REOPEN' &&
      !canReopenJob(decisionJob, approvals[String(decisionJob.id)]?.status || 'PENDING', role)) {
      setSelectedDecision('');
      setActionError('Only approved, closed jobs can be reopened.');
      return;
    }
    const jobId = String(decisionJob.id);
    setSavingId(jobId);
    setActionError('');
    try {
      const approval = selectedDecision === 'CLOSE'
        ? await hiringJobsApi.close(decisionJob)
        : selectedDecision === 'REOPEN'
          ? await hiringJobsApi.reopen(decisionJob)
        : await hiringJobsApi.approve(decisionJob);
      setApprovals((current) => ({ ...current, [jobId]: approval }));
      if (selectedDecision === 'CLOSE' || selectedDecision === 'REOPEN') {
        const jobStatus = selectedDecision === 'CLOSE' ? 'CLOSED' : 'ACTIVE';
        setJobs((current) => current.map((job) => (
          String(job.id) === jobId ? { ...job, status: jobStatus } : job
        )));
        setAllJobs((current) => current && ({
          ...current,
          jobs: current.jobs.map((job) => (
            String(job.id) === jobId ? { ...job, status: jobStatus } : job
          )),
        }));
        setViewJob((current) => current && String(current.id) === jobId
          ? { ...current, status: jobStatus }
          : current);
      }
      setSelectedDecision('');
      setDecisionJob(null);
      setRefreshKey((key) => key + 1);
    } catch (approvalActionError) {
      setActionError(approvalActionError.message);
    } finally {
      setSavingId('');
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstVisible = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, total);

  return (
    <section className="admin-panel hiring-board-panel">
      <div className="users-toolbar">
        <h1 className="admin-page-title">Hiring Job Board</h1>
        <button
          type="button"
          className="btn add-user-btn"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'}`}></i>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <section className="stats-grid registry-stats" aria-label="Hiring job totals">
        {[
          ['Total Jobs', stats?.total, 'blue', 'bi-briefcase'],
          ['Active Jobs', stats?.active, 'green', 'bi-check2-circle'],
          ['Pending Jobs', stats?.pending, 'amber', 'bi-hourglass-split'],
          ['Rejected Jobs', stats?.rejected, 'purple', 'bi-x-circle'],
        ].map(([label, count, tone, icon]) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}>
              <i className={`bi ${icon}`} aria-hidden="true"></i>
            </div>
            <div>
              <div className="stat-value" aria-live="polite">
                {statsLoading || approvalLoading
                  ? '…'
                  : stats && Number.isFinite(count) &&
                    (!(label === 'Pending Jobs' || label === 'Rejected Jobs') || !approvalError)
                    ? count.toLocaleString('en-IN')
                    : '—'}
              </div>
              <div className="stat-label">{label}</div>
            </div>
          </article>
        ))}
      </section>

      {statsError && (
        <div className="track-result track-error hiring-board-error" role="alert">
          <span>Job statistics could not be loaded: {statsError}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}

      <div className="registry-filter-toolbar user-filter-toolbar hiring-board-filter-toolbar">
        <label className="registry-filter-field">
          <span>Search this page</span>
          <input
            type="search"
            className="auth-input"
            placeholder="Search by title, company, role or location"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="registry-filter-field">
          <span>Status on this page</span>
          <select
            className="auth-input"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label className="registry-filter-field">
          <span>From date</span>
          <input
            type="date"
            className="auth-input"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="registry-filter-field">
          <span>To date</span>
          <input
            type="date"
            className="auth-input"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="registry-filter-field">
          <span>Rows per page</span>
          <select
            className="auth-input"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {PAGE_SIZES.map((size) => <option value={size} key={size}>{size}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-outline registry-filter-apply"
          onClick={() => {
            setSearch('');
            setStatusFilter('ALL');
            setFromDate('');
            setToDate('');
            setPageSize(10);
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>

      <p className="hiring-filter-scope">
        Date range searches all jobs in the feed. Search and status filters apply to the current page.
      </p>
      {dateRangeError && (
        <div className="track-result track-error hiring-board-error" role="alert">
          {dateRangeError}
        </div>
      )}

      {approvalError && (
        <div className="track-result track-error hiring-board-error" role="alert">
          <span>Approval status could not be loaded: {approvalError}</span>
        </div>
      )}

      {error && (
        <div className="track-result track-error hiring-board-error" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setRefreshKey((key) => key + 1)}>
            Try again
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table hiring-board-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Job</th>
              <th>Location</th>
              <th>Experience &amp; salary</th>
              <th>Posted</th>
              <th>Status &amp; approval</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted" role="status">Loading hiring jobs…</td></tr>
            ) : error ? (
              <tr><td colSpan="7" className="text-center py-4 text-muted">Hiring jobs could not be loaded.</td></tr>
            ) : filteredJobs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4 text-muted">
                  {jobs.length ? 'No jobs match your search and status filters on this page.' : 'No hiring jobs found.'}
                </td>
              </tr>
            ) : filteredJobs.map((job, index) => {
              const jobId = String(job.id);
              const approval = approvals[jobId];
              const approvalStatus = approval?.status || 'PENDING';
              const approvalMeta = APPROVAL_META[approvalStatus] || APPROVAL_META.PENDING;
              const isClosed = String(job.status || '').toUpperCase() === 'CLOSED';
              const localities = Array.isArray(job.localities) ? job.localities.filter(Boolean) : [];
              const location = [job.city, ...localities].filter(Boolean).join(' · ') || 'Location not specified';
              const canAdminApprove = isAdmin && !isClosed &&
                (approvalStatus === 'PENDING' || approvalStatus === 'REJECTED');
              const canSuperApprove = isSuperAdmin && !isClosed && approvalStatus === 'ADMIN_APPROVED';
              const canReview = canAdminApprove || canSuperApprove;
              const canClose = canCloseJob(job, approvalStatus, role);
              const canReopen = canReopenJob(job, approvalStatus, role);
              const isSaving = savingId === jobId;
              return (
                <tr key={job.id}>
                    <td><span className="sno-chip">#{(page - 1) * pageSize + index + 1}</span></td>
                    <td className="hiring-board-job-cell">
                      <strong>{job.title || 'Untitled job'}</strong>
                      <div>{job.company || 'Company not specified'}</div>
                      {job.role && <small>{job.role}</small>}
                    </td>
                    <td>{location}</td>
                    <td>
                      <div>{formatJobExperience(job.experienceMin, job.experienceMax)}</div>
                      <div>{formatJobSalary(job.salaryMin, job.salaryMax)}</div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatJobDate(job.createdAt || job.postedAt || job.posted_at)}</td>
                    <td className="hiring-board-status-cell">
                      <span className={`badge-role ${String(job.status || '').toUpperCase() === 'ACTIVE' ? 'active' : 'inactive'}`}>
                        {job.status || 'Unknown'}
                      </span>
                      <span className={`admin-hiring-state ${approvalMeta.className}`}>
                        <i className={`bi ${approvalStatus === 'APPROVED' ? 'bi-check-circle-fill' : approvalStatus === 'REJECTED' ? 'bi-x-circle-fill' : 'bi-hourglass-split'}`}></i>
                        {approvalMeta.label}
                      </span>
                    </td>
                    <td className="hiring-board-actions-cell">
                      <div className="hiring-board-action-group">
                        {canReview && (
                          <button
                            type="button"
                            className="icon-btn hiring-review-action"
                            title={isAdmin ? 'Review job approval' : 'Review final job approval'}
                            aria-label={`Review approval for ${job.title || 'this job'}`}
                            onClick={(event) => {
                              viewTriggerRef.current = event.currentTarget;
                              setActionError('');
                              setDecisionJob(job);
                              setSelectedDecision('');
                            }}
                            disabled={approvalLoading || Boolean(approvalError) || Boolean(savingId)}
                          >
                            <i className={`bi ${isSaving ? 'bi-arrow-repeat' : 'bi-shield-check'}`} aria-hidden="true"></i>
                          </button>
                        )}
                        {canClose && (
                          <button
                            type="button"
                            className="icon-btn hiring-close-action"
                            title="Close job"
                            aria-label={`Close ${job.title || 'this job'}`}
                            onClick={(event) => {
                              viewTriggerRef.current = event.currentTarget;
                              setActionError('');
                              setDecisionJob(job);
                              setSelectedDecision('CLOSE');
                            }}
                            disabled={approvalLoading || Boolean(approvalError) || Boolean(savingId)}
                          >
                            <i className={`bi ${isSaving ? 'bi-arrow-repeat' : 'bi-x-circle'}`} aria-hidden="true"></i>
                          </button>
                        )}
                        {canReopen && (
                          <button
                            type="button"
                            className="icon-btn hiring-reopen-action"
                            title="Reopen job"
                            aria-label={`Reopen ${job.title || 'this job'}`}
                            onClick={(event) => {
                              viewTriggerRef.current = event.currentTarget;
                              setActionError('');
                              setDecisionJob(job);
                              setSelectedDecision('REOPEN');
                            }}
                            disabled={approvalLoading || Boolean(approvalError) || Boolean(savingId)}
                          >
                            <i className={`bi ${isSaving ? 'bi-arrow-repeat' : 'bi-arrow-counterclockwise'}`} aria-hidden="true"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn view"
                          title="View job details"
                          aria-label={`View details for ${job.title || 'this job'}`}
                          onClick={(event) => {
                            viewTriggerRef.current = event.currentTarget;
                            setViewJob(job);
                          }}
                        >
                          <i className="bi bi-eye" aria-hidden="true"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {viewJob && (() => {
        const viewApproval = approvals[String(viewJob.id)];
        const viewApprovalStatus = viewApproval?.status || 'PENDING';
        const viewApprovalMeta = APPROVAL_META[viewApprovalStatus] || APPROVAL_META.PENDING;
        const viewLocation = [
          viewJob.city,
          ...(Array.isArray(viewJob.localities) ? viewJob.localities.filter(Boolean) : []),
        ].filter(Boolean).join(' · ') || 'Location not specified';
        const viewPosted = viewJob.createdAt || viewJob.postedAt || viewJob.posted_at;
        let viewApprovalHint = 'Needs Admin approval, then Super Admin final approval.';
        if (String(viewJob.status || '').toUpperCase() === 'CLOSED') {
          viewApprovalHint = 'Closed. This job is not visible to job seekers.';
        } else if (viewApprovalStatus === 'ADMIN_APPROVED') {
          viewApprovalHint = 'Admin approved. Waiting for Super Admin final approval; this job is not visible to job seekers yet.';
        } else if (viewApprovalStatus === 'APPROVED') {
          viewApprovalHint = 'Super Admin approved. This job is visible to logged-in job seekers.';
        } else if (viewApprovalStatus === 'REJECTED') {
          viewApprovalHint = 'Rejected. This job is not visible to job seekers.';
        }
        return (
          <div
            className="admin-hiring-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setViewJob(null);
            }}
          >
            <section
              ref={viewDialogRef}
              className="admin-hiring-description-modal hiring-job-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hiring-job-details-title"
              tabIndex="-1"
            >
              <header className="hiring-detail-statusbar">
                <div className="hiring-detail-status-meta">
                  <span className={`badge-role ${String(viewJob.status || '').toUpperCase() === 'ACTIVE' ? 'active' : 'inactive'}`}>
                    {viewJob.status || 'Unknown'}
                  </span>
                  <span><i className="bi bi-calendar3" aria-hidden="true"></i> Posted {formatJobDate(viewPosted)}</span>
                </div>
                <button
                  type="button"
                  className="admin-hiring-modal-close"
                  aria-label="Close job details"
                  onClick={() => setViewJob(null)}
                >
                  <i className="bi bi-x-lg" aria-hidden="true"></i>
                </button>
              </header>
              <div className="hiring-job-details-body">
                <section className="hiring-job-summary-card">
                  <span className="hiring-job-summary-icon" aria-hidden="true"><i className="bi bi-briefcase-fill"></i></span>
                  <div>
                    <h2 id="hiring-job-details-title">{viewJob.title || 'Untitled job'}</h2>
                    <p>{viewJob.company || 'Company not specified'} <span>· Job ID {String(viewJob.id)}</span></p>
                  </div>
                </section>

                <dl className="hiring-job-facts">
                  <div><dt>Experience</dt><dd>{formatJobExperience(viewJob.experienceMin, viewJob.experienceMax)}</dd></div>
                  <div><dt>Salary</dt><dd>{formatJobSalary(viewJob.salaryMin, viewJob.salaryMax)}</dd></div>
                  <div><dt>Location</dt><dd>{viewLocation}</dd></div>
                </dl>

                <div className="hiring-job-detail-tags" aria-label="Job categories">
                  {[
                    viewJob.category && ['Category', viewJob.category],
                    viewJob.jobType && ['Job type', viewJob.jobType],
                    viewJob.remoteWork && ['Work mode', viewJob.remoteWork],
                    viewJob.role && ['Role', viewJob.role],
                  ].filter(Boolean).map(([label, value]) => (
                    <span key={label}><small>{label}</small>{value}</span>
                  ))}
                </div>

                <div className="hiring-job-detail-grid">
                  <section className="hiring-job-description-card">
                    <h3>Job description</h3>
                    <p>{viewJob.description || 'No description provided.'}</p>
                  </section>
                  <aside className="hiring-job-detail-sidebar">
                    <section className="hiring-job-sidebar-card">
                      <h3>Recruiter &amp; contact</h3>
                      {viewJob.showContact ? (
                        <dl>
                          <div><dt>Contact name</dt><dd>{viewJob.contactName || `Hiring for ${viewJob.company || 'this role'}`}</dd></div>
                          {viewJob.contactPhone && (
                            <div><dt>Phone</dt><dd><a href={`tel:${String(viewJob.contactPhone).replace(/[^\d+]/g, '')}`}>{viewJob.contactPhone}</a></dd></div>
                          )}
                          {viewJob.whatsappNumber && (
                            <div><dt>WhatsApp</dt><dd><a href={`tel:${String(viewJob.whatsappNumber).replace(/[^\d+]/g, '')}`}>{viewJob.whatsappNumber}</a></dd></div>
                          )}
                          {viewJob.contactEmail && (
                            <div><dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(viewJob.contactEmail)}`}>{viewJob.contactEmail}</a></dd></div>
                          )}
                        </dl>
                      ) : (
                        <p className="hiring-contact-private"><i className="bi bi-lock-fill" aria-hidden="true"></i> Contact details are hidden for this listing.</p>
                      )}
                    </section>
                    <section className="hiring-job-sidebar-card">
                      <h3>Approval review</h3>
                      <dl>
                        <div>
                          <dt>Approval status</dt>
                          <dd><span className={`admin-hiring-state ${viewApprovalMeta.className}`}>{viewApprovalMeta.label}</span></dd>
                        </div>
                        <div><dt>Review stage</dt><dd>{viewApprovalHint}</dd></div>
                        {viewApproval?.rejectedByName && (
                          <div><dt>Rejected by</dt><dd>{viewApproval.rejectedByName}</dd></div>
                        )}
                        {viewApproval?.rejectedAt && (
                          <div><dt>Rejection date</dt><dd>{formatJobDate(viewApproval.rejectedAt)}</dd></div>
                        )}
                      </dl>
                    </section>
                  </aside>
                </div>
              </div>
            </section>
          </div>
        );
      })()}

      {decisionJob && !selectedDecision && (() => {
        const approvalStatus = approvals[String(decisionJob.id)]?.status || 'PENDING';
        const stage = isAdmin ? 'Admin review' : 'Super Admin final review';
        return (
          <div
            className="admin-hiring-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setDecisionJob(null);
                setActionError('');
              }
            }}
          >
            <section
              ref={decisionDialogRef}
              className="hiring-decision-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hiring-decision-title"
              tabIndex="-1"
            >
              <h2 id="hiring-decision-title">{stage}</h2>
              <p>Choose how to review <strong>{decisionJob.title || 'this job'}</strong>.</p>
              <p className="hiring-decision-stage">Current stage: {APPROVAL_META[approvalStatus]?.label || 'Pending Admin'}</p>
              {actionError && <p className="hiring-decision-error" role="alert">{actionError}</p>}
              <div className="hiring-decision-actions">
                <button type="button" className="btn btn-teal" onClick={() => setSelectedDecision('APPROVE')}>
                  <i className="bi bi-check2-circle" aria-hidden="true"></i> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setDecisionJob(null);
                    setActionError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        );
      })()}

      {decisionJob && selectedDecision && (
        <div className="admin-hiring-modal-backdrop">
          <section
            ref={confirmationDialogRef}
            className="hiring-decision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hiring-confirmation-title"
            tabIndex="-1"
          >
            <p className={`hiring-confirmation-mark ${selectedDecision.toLowerCase()}`}>
              <i className={`bi ${
                selectedDecision === 'APPROVE'
                  ? 'bi-shield-check'
                  : selectedDecision === 'REOPEN'
                    ? 'bi-arrow-counterclockwise'
                    : 'bi-x-circle'
              }`} aria-hidden="true"></i>
            </p>
            <h2 id="hiring-confirmation-title">
              Confirm {selectedDecision === 'CLOSE' ? 'close job' : selectedDecision === 'REOPEN' ? 'reopen job' : 'approve'}
            </h2>
            <p>
              {selectedDecision === 'CLOSE'
                ? 'Close'
                : selectedDecision === 'REOPEN'
                  ? 'Reopen'
                  : 'Approve'} <strong>{decisionJob.title || 'this job'}</strong>?
              {selectedDecision === 'CLOSE' && ' This job will not be visible to job seekers.'}
              {selectedDecision === 'REOPEN' && ' This job will be visible to job seekers again.'}
            </p>
            {actionError && <p className="hiring-decision-error" role="alert">{actionError}</p>}
            <div className="hiring-decision-actions">
              <button
                type="button"
                className={`btn ${
                  selectedDecision === 'APPROVE'
                    ? 'btn-teal'
                    : selectedDecision === 'REOPEN'
                      ? 'hiring-reopen-confirm-button'
                      : 'hiring-close-confirm-button'
                }`}
                onClick={saveDecision}
                disabled={savingId === String(decisionJob.id)}
              >
                {savingId === String(decisionJob.id)
                  ? 'Saving…'
                  : `Confirm ${selectedDecision === 'CLOSE' ? 'close' : selectedDecision.toLowerCase()}`}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedDecision('');
                  if (selectedDecision === 'CLOSE' || selectedDecision === 'REOPEN') setDecisionJob(null);
                  setActionError('');
                }}
                disabled={savingId === String(decisionJob.id)}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSelectedDecision('');
                  setDecisionJob(null);
                  setActionError('');
                }}
                disabled={savingId === String(decisionJob.id)}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      <nav className="registry-pagination user-pagination" aria-label="Hiring jobs pagination">
        <span className="registry-pagination-count">
          Showing {firstVisible}–{lastVisible} of {total.toLocaleString('en-IN')} {fromDate || toDate ? 'jobs matching date range' : 'jobs'} · {filteredJobs.length} match current-page search/status filters
        </span>
        <div className="registry-pagination-controls user-pagination-controls">
          <button
            type="button"
            className="registry-page-button"
            disabled={page === 1 || loading}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            aria-label="Previous page"
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="registry-page-indicator">Page {page} of {pageCount}</span>
          <button
            type="button"
            className="registry-page-button"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            aria-label="Next page"
          >
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </nav>
    </section>
  );
}
