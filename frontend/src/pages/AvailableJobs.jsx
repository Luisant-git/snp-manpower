import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hiringJobsApi } from '../api/hiringJobsApi.js';
import {
  formatJobDate,
  formatJobExperience,
  formatJobSalary,
  jobSearchText,
} from '../data/jobDisplay.js';
import { getSession } from '../data/session.js';

export default function AvailableJobs() {
  const [session] = useState(getSession);
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session) return undefined;
    let active = true;

    const loadJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await hiringJobsApi.available();
        if (active) setJobs(Array.isArray(result.jobs) ? result.jobs : []);
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
          setJobs([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadJobs();
    return () => {
      active = false;
    };
  }, [session, refreshKey]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;
    return jobs.filter((job) => jobSearchText(job).includes(query));
  }, [jobs, search]);

  const totalOpenRoles = jobs.filter(
    (job) => String(job.status || '').toUpperCase() !== 'CLOSED',
  ).length;

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="container available-jobs-page">
      <section className="hiring-board hiring-board-shell">
        <div className="hiring-board-hero">
          <div className="hiring-board-hero-copy">
            <p className="section-eyebrow"><i className="bi bi-briefcase"></i> Opportunities</p>
            <h1>Find the right role for your next move</h1>
            <p>Explore verified openings from SNP Manpower &amp; Job Services across skilled, semi-skilled, and support roles.</p>
          </div>

          <div className="hiring-board-hero-stats" aria-label="Available roles summary">
            <div className="hiring-board-stat">
              <strong>{totalOpenRoles.toLocaleString('en-IN')}</strong>
              <span>Open roles</span>
            </div>
            <div className="hiring-board-stat">
              <strong>{filteredJobs.length.toLocaleString('en-IN')}</strong>
              <span>Matches</span>
            </div>
            <div className="hiring-board-stat">
              <strong>24/7</strong>
              <span>Support</span>
            </div>
          </div>
        </div>

        <div className="hiring-board-toolbar">
          <label className="hiring-board-search">
            <span className="visually-hidden">Search available jobs</span>
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              type="search"
              className="auth-input"
              placeholder="Search by job, company, or location"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
          >
            <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'}`}></i>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <span className="hiring-board-total">
            {filteredJobs.length.toLocaleString('en-IN')} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
          </span>
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
          <div className="hiring-board-empty" role="status">Loading available jobs…</div>
        ) : !error && filteredJobs.length === 0 ? (
          <div className="hiring-board-empty">
            {jobs.length ? 'No jobs match your search.' : 'No approved jobs are available right now.'}
          </div>
        ) : !error && (
          <div className="hiring-job-list">
            {filteredJobs.map((job) => {
              const contactPhone = job.showContact ? (job.contactPhone || job.whatsappNumber) : '';
              const localities = Array.isArray(job.localities) ? job.localities.filter(Boolean) : [];
              const location = [job.city, ...localities].filter(Boolean).join(' · ') || 'Location not specified';
              const roleType = job.jobType || 'Full Time';

              return (
                <article className="hiring-job-card" key={job.id}>
                  <div className="hiring-job-accent" aria-hidden="true" />
                  <div className="hiring-job-main">
                    <div className="hiring-job-title-row">
                      <div className="hiring-job-heading">
                        <span className="hiring-job-pill">{roleType}</span>
                        <h2>{job.title || 'Untitled job'}</h2>
                        <p className="hiring-job-company">
                          {job.company || 'Company not specified'}
                          {job.role ? <span> · {job.role}</span> : null}
                        </p>
                      </div>
                      <span className="hiring-approval-badge approved">
                        <i className="bi bi-patch-check-fill"></i> Approved
                      </span>
                    </div>

                    <div className="hiring-job-facts">
                      <span><i className="bi bi-geo-alt"></i> {location}</span>
                      {job.category && <span><i className="bi bi-tag"></i> {job.category}</span>}
                      {job.jobType && <span><i className="bi bi-clock"></i> {job.jobType}</span>}
                      <span><i className="bi bi-cash-coin"></i> {formatJobSalary(job.salaryMin, job.salaryMax)}</span>
                      <span><i className="bi bi-person-workspace"></i> {formatJobExperience(job.experienceMin, job.experienceMax)} experience</span>
                      {job.remoteWork && <span><i className="bi bi-house"></i> Remote: {job.remoteWork}</span>}
                    </div>

                    {job.description && <p className="hiring-job-description">{job.description}</p>}

                    <div className="hiring-job-footer">
                      <span>Posted {formatJobDate(job.createdAt)}</span>
                      {job.showContact && (contactPhone || job.contactEmail) && (
                        <div className="hiring-job-contact">
                          {contactPhone && <a href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}><i className="bi bi-telephone"></i> {contactPhone}</a>}
                          {job.contactEmail && <a href={`mailto:${encodeURIComponent(job.contactEmail)}`}><i className="bi bi-envelope"></i> {job.contactEmail}</a>}
                        </div>
                      )}
                    </div>

                    {job.showContact && (contactPhone || job.contactEmail) && (
                      <div className="hiring-job-actions">
                        {contactPhone && (
                          <a className="btn btn-primary btn-sm" href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}>
                            <i className="bi bi-telephone"></i> Call now
                          </a>
                        )}
                        {job.contactEmail && (
                          <a className="btn btn-outline btn-sm" href={`mailto:${encodeURIComponent(job.contactEmail)}`}>
                            <i className="bi bi-send"></i> Apply now
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
