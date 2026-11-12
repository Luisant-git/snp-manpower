import { useCallback, useEffect, useMemo, useState } from 'react';
import { hiringJobsApi } from '../../api/hiringJobsApi.js';
import { jobRequirementsApi } from '../../api/jobRequirementsApi.js';
import {
  formatJobDate,
  formatJobExperience,
  formatJobSalary,
  jobSearchText,
} from '../../data/jobDisplay.js';
import { getSession } from '../../data/session.js';

const PAGE_SIZE = 50;

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvals, setApprovals] = useState({});
  const [approvingId, setApprovingId] = useState('');
  const [descriptionJob, setDescriptionJob] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const session = getSession();
  const role = String(session?.role || '').toLowerCase();
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  useEffect(() => {
    if (!descriptionJob) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDescriptionJob(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [descriptionJob]);

  const loadJobs = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const result = await jobRequirementsApi.list({ page, limit: PAGE_SIZE, signal });
      setJobs(result.jobs);
      setTotal(result.total);
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
  }, [page]);

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

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          <span>Search jobs</span>
          <input
            type="search"
            className="auth-input"
            placeholder="Search by title, company, role or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="registry-filter-field">
          <span>Status</span>
          <select
            className="auth-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <label className="registry-filter-field">
          <span>Total jobs</span>
          <div className="hiring-board-total-box">{total.toLocaleString('en-IN')}</div>
        </label>
        <button
          type="button"
          className="btn btn-outline registry-filter-apply"
          onClick={() => {
            setSearch('');
            setStatusFilter('ALL');
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

      {loading ? (
        <div className="hiring-board-empty" role="status">Loading hiring jobs…</div>
      ) : !error && filteredJobs.length === 0 ? (
        <div className="hiring-board-empty">
          {jobs.length ? 'No jobs match your search and status filters.' : 'No hiring jobs found.'}
        </div>
      ) : !error && (
        <div className="hiring-job-list">
          {filteredJobs.map((job) => {
            const jobId = String(job.id);
            const approval = approvals[jobId];
            const approvalStatus = approval?.status || 'PENDING';
            const approvalMeta = APPROVAL_META[approvalStatus] || APPROVAL_META.PENDING;
            const isClosed = String(job.status || '').toUpperCase() === 'CLOSED';
            const contactPhone = job.showContact ? (job.contactPhone || job.whatsappNumber) : '';
            const localities = Array.isArray(job.localities) ? job.localities.filter(Boolean) : [];
            const location = [job.city, ...localities].filter(Boolean).join(' · ') || 'Location not specified';
            const canAdminApprove = isAdmin && !isClosed &&
              (approvalStatus === 'PENDING' || approvalStatus === 'REJECTED');
            const canSuperApprove = isSuperAdmin && !isClosed && approvalStatus === 'ADMIN_APPROVED';
            const isSaving = approvingId === jobId;

            let approvalHint = 'Needs Admin approval, then Super Admin final approval.';
            if (approvalStatus === 'ADMIN_APPROVED') {
              approvalHint = 'Admin approved. This job is visible to job seekers; Super Admin approval is still pending.';
            } else if (approvalStatus === 'APPROVED') {
              approvalHint = 'Super Admin approved. This job is visible to logged-in job seekers.';
            } else if (approvalStatus === 'REJECTED') {
              approvalHint = 'Rejected. This job is not visible to job seekers.';
            }
            if (isClosed) {
              approvalHint = 'This job is closed and will not be shown to job seekers.';
            }

            return (
              <article className="admin-hiring-card" key={job.id}>
                <div className="admin-hiring-card-topline">
                  <span className={`admin-hiring-state ${approvalMeta.className}`}>
                    <i className={`bi ${approvalStatus === 'APPROVED' ? 'bi-check-circle-fill' : approvalStatus === 'REJECTED' ? 'bi-x-circle-fill' : 'bi-hourglass-split'}`}></i>
                    {approvalMeta.label} <span aria-hidden="true">·</span> {job.status || 'Unknown'}
                  </span>
                  <span className="admin-hiring-posted">Posted {formatJobDate(job.createdAt)}</span>
                </div>

                <div className="admin-hiring-summary">
                  <div className="admin-hiring-icon" aria-hidden="true">
                    <i className="bi bi-briefcase"></i>
                  </div>
                  <div className="admin-hiring-title">
                    <h2>{job.title || 'Untitled job'}</h2>
                    <p>{job.company || 'Company not specified'}{job.role ? <span> · {job.role}</span> : null}</p>
                  </div>
                </div>

                <div className="admin-hiring-facts">
                  <div className="admin-hiring-fact">
                    <span className="admin-hiring-fact-icon"><i className="bi bi-person-workspace"></i></span>
                    <span><small>Experience</small><strong>{formatJobExperience(job.experienceMin, job.experienceMax)}</strong></span>
                  </div>
                  <div className="admin-hiring-fact">
                    <span className="admin-hiring-fact-icon"><i className="bi bi-currency-rupee"></i></span>
                    <span><small>Salary</small><strong>{formatJobSalary(job.salaryMin, job.salaryMax)}</strong></span>
                  </div>
                  <div className="admin-hiring-fact">
                    <span className="admin-hiring-fact-icon"><i className="bi bi-geo-alt"></i></span>
                    <span><small>Location</small><strong>{location}</strong></span>
                  </div>
                </div>

                <div className="admin-hiring-tags">
                  {job.role && <span className="primary">{job.role}</span>}
                  {job.category && <span>{job.category}</span>}
                  {job.jobType && <span className="teal">{job.jobType}</span>}
                  {job.remoteWork && <span className="blue">Remote: {job.remoteWork}</span>}
                </div>

                <div className="admin-hiring-details">
                  <section className="admin-hiring-description">
                    <h3>Job description</h3>
                    <button
                      type="button"
                      className="admin-hiring-description-button"
                      onClick={() => setDescriptionJob({
                        title: job.title || 'Untitled job',
                        company: job.company || 'Company not specified',
                        description: job.description || 'No description provided.',
                      })}
                    >
                      <i className="bi bi-file-text"></i>
                      View full description
                      <i className="bi bi-arrow-up-right"></i>
                    </button>
                  </section>

                  <aside className="admin-hiring-aside">
                    <section className="admin-hiring-side-card">
                      <p className="admin-hiring-side-label">Approval review</p>
                      <p className="admin-hiring-approval-hint">{approvalHint}</p>
                      <div className="admin-hiring-actions">
                        {canAdminApprove && (
                          <button
                            type="button"
                            className="btn btn-sm btn-teal"
                            onClick={() => approveJob(job)}
                            disabled={isSaving}
                          >
                            <i className="bi bi-check2-circle"></i>
                            {isSaving ? 'Saving…' : 'Approve as Admin'}
                          </button>
                        )}
                        {canSuperApprove && (
                          <button
                            type="button"
                            className="btn btn-sm btn-teal"
                            onClick={() => approveJob(job)}
                            disabled={isSaving}
                          >
                            <i className="bi bi-patch-check"></i>
                            {isSaving ? 'Saving…' : 'Give Final Approval'}
                          </button>
                        )}
                        {isSuperAdmin && approvalStatus === 'PENDING' && !isClosed && (
                          <span className="hiring-approval-wait">Waiting for Admin approval</span>
                        )}
                        {isAdmin && approvalStatus === 'ADMIN_APPROVED' && (
                          <span className="hiring-approval-wait">Waiting for Super Admin approval</span>
                        )}
                        {approvalStatus === 'APPROVED' && (
                          <span className="hiring-approval-live">
                            <i className="bi bi-broadcast"></i> Live for job seekers
                          </span>
                        )}
                      </div>
                    </section>

                    <section className="admin-hiring-side-card">
                      <p className="admin-hiring-side-label">Recruiter details</p>
                      <strong>{job.contactName || `Hiring for ${job.company || 'this role'}`}</strong>
                      {job.showContact && contactPhone && (
                        <a href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}>
                          <i className="bi bi-telephone"></i><span>Phone</span><b>{contactPhone}</b>
                        </a>
                      )}
                      {job.showContact && job.contactEmail && (
                        <a href={`mailto:${encodeURIComponent(job.contactEmail)}`}>
                          <i className="bi bi-envelope"></i><span>Email</span><b>{job.contactEmail}</b>
                        </a>
                      )}
                      {!job.showContact && <span className="admin-hiring-private">Contact details hidden</span>}
                    </section>
                  </aside>
                </div>

                <div className="admin-hiring-card-footer">
                  <span><i className="bi bi-hash"></i> Job ID {jobId}</span>
                  {approval?.adminApprovedByName && (
                    <span>Admin review by <strong>{approval.adminApprovedByName}</strong></span>
                  )}
                  {approval?.superAdminApprovedByName && (
                    <span>Final review by <strong>{approval.superAdminApprovedByName}</strong></span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {descriptionJob && (
        <div
          className="admin-hiring-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDescriptionJob(null);
          }}
        >
          <section
            className="admin-hiring-description-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-hiring-description-title"
          >
            <header>
              <div>
                <p>Job description</p>
                <h2 id="admin-hiring-description-title">{descriptionJob.title}</h2>
                <span>{descriptionJob.company}</span>
              </div>
              <button
                type="button"
                className="admin-hiring-modal-close"
                aria-label="Close job description"
                onClick={() => setDescriptionJob(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </header>
            <div className="admin-hiring-description-modal-body">{descriptionJob.description}</div>
          </section>
        </div>
      )}

      {!loading && !error && pageCount > 1 && (
        <nav className="registry-pagination" aria-label="Hiring jobs pagination">
          <span className="registry-pagination-count">
            Page {page} of {pageCount} · Showing {filteredJobs.length} jobs on this page
          </span>
          <div className="registry-pagination-controls">
            <button type="button" className="registry-page-button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <button type="button" className="registry-page-button" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
