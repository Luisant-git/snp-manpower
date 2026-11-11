import { useCallback, useEffect, useMemo, useState } from 'react';
import { jobRequirementsApi } from '../../api/jobRequirementsApi.js';

const PAGE_SIZE = 50;

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
}

function formatSalary(min, max) {
  const formatAmount = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
  if (min == null && max == null) return 'Not specified';
  if (min == null) return `Up to ${formatAmount(max)}`;
  if (max == null) return `From ${formatAmount(min)}`;
  return `${formatAmount(min)} – ${formatAmount(max)}`;
}

function formatExperience(min, max) {
  if (min == null && max == null) return 'Not specified';
  if (min == null) return `Up to ${max} years`;
  if (max == null) return `From ${min} years`;
  if (min === max) return `${min} years`;
  return `${min}–${max} years`;
}

function searchableText(job) {
  return [
    job.title,
    job.company,
    job.city,
    ...(Array.isArray(job.localities) ? job.localities : []),
    job.description,
    job.jobType,
    job.category,
    job.role,
    job.contactName,
    job.customer?.name,
  ].filter(Boolean).join(' ').toLowerCase();
}

export default function HiringJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    loadJobs(controller.signal);
    return () => controller.abort();
  }, [loadJobs, refreshKey]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch = !query || searchableText(job).includes(query);
      const matchesStatus = statusFilter === 'ALL' ||
        String(job.status || '').toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="hiring-board">
      <div className="hiring-board-heading">
        <div>
          <p className="section-eyebrow"><i className="bi bi-briefcase"></i> Recruitment</p>
          <h2>Published Jobs</h2>
          <p>Job requirements published on the hiring platform.</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'}`}></i>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="hiring-board-toolbar">
        <label className="hiring-board-search">
          <span className="visually-hidden">Search jobs</span>
          <i className="bi bi-search" aria-hidden="true"></i>
          <input
            type="search"
            className="auth-input"
            placeholder="Search jobs on this page"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="hiring-board-status">
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
        <span className="hiring-board-total">{total.toLocaleString('en-IN')} jobs total</span>
      </div>

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
            const contactPhone = job.showContact ? (job.contactPhone || job.whatsappNumber) : '';
            const localities = Array.isArray(job.localities) ? job.localities.filter(Boolean) : [];
            return (
              <article className="hiring-job-card" key={job.id}>
                <div className="hiring-job-main">
                  <div className="hiring-job-title-row">
                    <div>
                      <h3>{job.title || 'Untitled job'}</h3>
                      <p className="hiring-job-company">
                        {job.company || 'Company not specified'}
                        {job.role ? <span> · {job.role}</span> : null}
                      </p>
                    </div>
                    <span className={`hiring-job-status ${String(job.status || '').toLowerCase()}`}>
                      {job.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="hiring-job-facts">
                    <span><i className="bi bi-geo-alt"></i> {[job.city, ...localities].filter(Boolean).join(' · ') || 'Location not specified'}</span>
                    {job.category && <span><i className="bi bi-tag"></i> {job.category}</span>}
                    {job.jobType && <span><i className="bi bi-clock"></i> {job.jobType}</span>}
                    <span><i className="bi bi-cash-coin"></i> {formatSalary(job.salaryMin, job.salaryMax)}</span>
                    <span><i className="bi bi-person-workspace"></i> {formatExperience(job.experienceMin, job.experienceMax)} experience</span>
                    {job.remoteWork && <span><i className="bi bi-house"></i> Remote: {job.remoteWork}</span>}
                  </div>
                  {job.description && <p className="hiring-job-description">{job.description}</p>}
                  <div className="hiring-job-footer">
                    <span>Posted {formatDate(job.createdAt)}</span>
                    {job.showContact && (contactPhone || job.contactEmail) && (
                      <div className="hiring-job-contact">
                        {contactPhone && <a href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}><i className="bi bi-telephone"></i> {contactPhone}</a>}
                        {job.contactEmail && <a href={`mailto:${encodeURIComponent(job.contactEmail)}`}><i className="bi bi-envelope"></i> {job.contactEmail}</a>}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
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
