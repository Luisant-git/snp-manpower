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

export default function HiringJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvals, setApprovals] = useState({});
  const [approvingId, setApprovingId] = useState('');
  const [viewJob, setViewJob] = useState(null);
  const viewDialogRef = useRef(null);
  const viewTriggerRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const session = getSession();
  const role = String(session?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    if (!viewJob) return undefined;
    const handleDialogKeyDown = (event) => {
      if (event.key === 'Escape') {
        setViewJob(null);
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = viewDialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !dialog.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    viewDialogRef.current?.focus();
    window.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      window.removeEventListener('keydown', handleDialogKeyDown);
      viewTriggerRef.current?.focus();
    };
  }, [viewJob]);

  const loadJobs = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const result = await jobRequirementsApi.list({ page, limit: pageSize, signal });
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

    try {
      const result = await hiringJobsApi.approvals();
      setApprovals(Object.fromEntries(
        (result.approvals || []).map((approval) => [String(approval.externalJobId), approval]),
      ));
      setApprovalError('');
    } catch (approvalLoadError) {
      if (approvalLoadError.name !== 'AbortError') {
        setApprovalError(approvalLoadError.message);
      }
    }
  }, [page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs, refreshKey]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch = !query || jobSearchText(job).includes(query);
      const matchesStatus = statusFilter === 'ALL' ||
        String(job.status || '').toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const approveJob = async (job) => {
    const jobId = String(job.id);
    setApprovingId(jobId);
    setActionError('');
    try {
      const approval = await hiringJobsApi.approve(job);
      setApprovals((current) => ({ ...current, [jobId]: approval }));
    } catch (approvalActionError) {
      setActionError(approvalActionError.message);
    } finally {
      setApprovingId('');
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
            setPageSize(10);
            setPage(1);
          }}
        >
          Reset
        </button>
      </div>

      {approvalError && (
        <div className="track-result track-error hiring-board-error" role="alert">
          <span>Approval status could not be loaded: {approvalError}</span>
        </div>
      )}

      {actionError && (
        <div className="track-result track-error hiring-board-error" role="alert">
          <span>{actionError}</span>
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
              const isSaving = approvingId === jobId;
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
                    <td style={{ whiteSpace: 'nowrap' }}>{formatJobDate(job.createdAt)}</td>
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
                        {canAdminApprove && (
                          <button
                            type="button"
                            className="btn btn-sm btn-teal"
                            onClick={() => approveJob(job)}
                            disabled={isSaving}
                          >
                            <i className="bi bi-check2-circle"></i> {isSaving ? 'Saving…' : 'Approve as Admin'}
                          </button>
                        )}
                        {canSuperApprove && (
                          <button
                            type="button"
                            className="btn btn-sm btn-teal"
                            onClick={() => approveJob(job)}
                            disabled={isSaving}
                          >
                            <i className="bi bi-patch-check"></i> {isSaving ? 'Saving…' : 'Give Final Approval'}
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
        const viewClosed = String(viewJob.status || '').toUpperCase() === 'CLOSED';
        const viewLocation = [
          viewJob.city,
          ...(Array.isArray(viewJob.localities) ? viewJob.localities.filter(Boolean) : []),
        ].filter(Boolean).join(' · ') || 'Location not specified';
        let viewApprovalHint = 'Needs Admin approval, then Super Admin final approval.';
        if (viewApprovalStatus === 'ADMIN_APPROVED') {
          viewApprovalHint = 'Admin approved. This job is visible to job seekers; Super Admin approval is still pending.';
        } else if (viewApprovalStatus === 'APPROVED') {
          viewApprovalHint = 'Super Admin approved. This job is visible to logged-in job seekers.';
        } else if (viewApprovalStatus === 'REJECTED') {
          viewApprovalHint = 'Rejected. This job is not visible to job seekers.';
        }
        if (viewClosed) viewApprovalHint = 'This job is closed and will not be shown to job seekers.';
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
              <header>
                <div>
                  <p>Hiring job details</p>
                  <h2 id="hiring-job-details-title">{viewJob.title || 'Untitled job'}</h2>
                  <span>{viewJob.company || 'Company not specified'}</span>
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
              <div className="admin-hiring-description-modal-body hiring-job-details-body">
                <section className="hiring-job-detail-section">
                  <h3>Job information</h3>
                  <dl>
                    <div><dt>Job ID</dt><dd>{String(viewJob.id)}</dd></div>
                    <div><dt>Role</dt><dd>{viewJob.role || 'Not specified'}</dd></div>
                    <div><dt>Category</dt><dd>{viewJob.category || 'Not specified'}</dd></div>
                    <div><dt>Job type</dt><dd>{viewJob.jobType || 'Not specified'}</dd></div>
                    <div><dt>Remote work</dt><dd>{viewJob.remoteWork || 'Not specified'}</dd></div>
                    <div><dt>Location</dt><dd>{viewLocation}</dd></div>
                    <div><dt>Experience</dt><dd>{formatJobExperience(viewJob.experienceMin, viewJob.experienceMax)}</dd></div>
                    <div><dt>Salary</dt><dd>{formatJobSalary(viewJob.salaryMin, viewJob.salaryMax)}</dd></div>
                    <div><dt>Posted</dt><dd>{formatJobDate(viewJob.createdAt)}</dd></div>
                    <div><dt>Job status</dt><dd>{viewJob.status || 'Unknown'}</dd></div>
                  </dl>
                </section>
                <section className="hiring-job-detail-section">
                  <h3>Recruiter</h3>
                  <dl>
                    <div><dt>Contact name</dt><dd>{viewJob.contactName || `Hiring for ${viewJob.company || 'this role'}`}</dd></div>
                    <div><dt>Contact visibility</dt><dd>{viewJob.showContact ? 'Visible' : 'Hidden'}</dd></div>
                    {viewJob.showContact && viewJob.contactPhone && (
                      <div>
                        <dt>Phone</dt>
                        <dd><a href={`tel:${String(viewJob.contactPhone).replace(/[^\d+]/g, '')}`}>{viewJob.contactPhone}</a></dd>
                      </div>
                    )}
                    {viewJob.showContact && viewJob.whatsappNumber && (
                      <div>
                        <dt>WhatsApp</dt>
                        <dd><a href={`tel:${String(viewJob.whatsappNumber).replace(/[^\d+]/g, '')}`}>{viewJob.whatsappNumber}</a></dd>
                      </div>
                    )}
                    {viewJob.showContact && viewJob.contactEmail && (
                      <div><dt>Email</dt><dd><a href={`mailto:${encodeURIComponent(viewJob.contactEmail)}`}>{viewJob.contactEmail}</a></dd></div>
                    )}
                    {!viewJob.showContact && <div><dt>Contact details</dt><dd>Contact details hidden</dd></div>}
                  </dl>
                </section>
                <section className="hiring-job-detail-section">
                  <h3>Approval review</h3>
                  <dl>
                    <div>
                      <dt>Approval status</dt>
                      <dd><span className={`admin-hiring-state ${viewApprovalMeta.className}`}>{viewApprovalMeta.label}</span></dd>
                    </div>
                    <div><dt>Review</dt><dd>{viewApprovalHint}</dd></div>
                    {viewApproval?.adminApprovedByName && (
                      <div><dt>Admin reviewer</dt><dd>{viewApproval.adminApprovedByName}</dd></div>
                    )}
                    {viewApproval?.superAdminApprovedByName && (
                      <div><dt>Super Admin reviewer</dt><dd>{viewApproval.superAdminApprovedByName}</dd></div>
                    )}
                  </dl>
                </section>
                <section className="hiring-job-detail-section hiring-job-description-section">
                  <h3>Job description</h3>
                  <p>{viewJob.description || 'No description provided.'}</p>
                </section>
              </div>
            </section>
          </div>
        );
      })()}

      <nav className="registry-pagination user-pagination" aria-label="Hiring jobs pagination">
        <span className="registry-pagination-count">
          Showing {firstVisible}–{lastVisible} of {total.toLocaleString('en-IN')} jobs · {filteredJobs.length} match current filters on this page
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
