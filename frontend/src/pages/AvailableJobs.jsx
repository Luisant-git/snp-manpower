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
          setError(loadError.message || 'Please try again in a moment.');
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

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="container available-jobs-page">
      <section className="hiring-board hiring-board-shell" aria-labelledby="available-jobs-title">
        <div className="hiring-board-hero">
          <div className="hiring-board-hero-copy">
            <p className="section-eyebrow"><i className="bi bi-briefcase"></i> SNP · Career opportunities</p>
            <h1 id="available-jobs-title">Your next opportunity<br /><span>starts here.</span></h1>
            <p>Explore current openings from SNP Manpower &amp; Job Services. Find a role that fits, then contact the hiring team directly.</p>
          </div>

        </div>

        <div className="hiring-board-toolbar">
          <label className="hiring-board-search">
            <span className="visually-hidden">Search available jobs by title, company, role, or location</span>
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              type="search"
              className="auth-input"
              placeholder="Try “driver”, “warehouse”, or “Mumbai”"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-controls="available-job-results"
            />
            {search && (
              <button
                type="button"
                className="hiring-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear job search"
              >
                <i className="bi bi-x-circle" aria-hidden="true"></i>
              </button>
            )}
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={loading}
            aria-label={loading ? 'Refreshing available jobs' : 'Refresh available jobs'}
          >
            <i className={`bi ${loading ? 'bi-arrow-repeat hiring-spin' : 'bi-arrow-clockwise'}`} aria-hidden="true"></i>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <p className="hiring-board-total" aria-live="polite">
            <strong>{filteredJobs.length.toLocaleString('en-IN')}</strong>
            {filteredJobs.length === 1 ? ' role found' : ' roles found'}
          </p>
        </div>

        {error && (
          <div className="track-result track-error hiring-board-error" id="available-job-results" role="alert">
            <span><strong>We couldn’t load the jobs.</strong> {error}</span>
            <button type="button" className="btn btn-sm btn-outline" onClick={() => setRefreshKey((key) => key + 1)}>
              <i className="bi bi-arrow-clockwise" aria-hidden="true"></i> Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="hiring-job-list hiring-job-list-loading" id="available-job-results" role="status" aria-label="Loading available jobs">
            {[0, 1, 2].map((item) => (
              <div className="hiring-job-skeleton" key={item} aria-hidden="true">
                <span className="hiring-skeleton-line short"></span>
                <span className="hiring-skeleton-line title"></span>
                <span className="hiring-skeleton-line medium"></span>
                <span className="hiring-skeleton-line facts"></span>
              </div>
            ))}
            <span className="visually-hidden">Loading available jobs…</span>
          </div>
        ) : !error && filteredJobs.length === 0 ? (
          <div className="hiring-board-empty hiring-board-empty-enhanced" id="available-job-results" role="status">
            <span className="hiring-empty-icon" aria-hidden="true">
              <i className={`bi ${jobs.length ? 'bi-search' : 'bi-briefcase'}`}></i>
            </span>
            <h2>{jobs.length ? 'No roles match that search' : 'No openings just yet'}</h2>
            <p>{jobs.length ? 'Try another job title, company, role, or location.' : 'Please check back soon for new approved opportunities.'}</p>
            {jobs.length > 0 && search && (
              <button type="button" className="btn btn-outline" onClick={() => setSearch('')}>
                Clear search
              </button>
            )}
          </div>
        ) : !error && (
          <div className="hiring-job-list" id="available-job-results" role="list" aria-label="Available job listings">
            {filteredJobs.map((job, index) => {
              const contactPhone = job.showContact ? (job.contactPhone || job.whatsappNumber) : '';
              const whatsappPhone = job.showContact ? job.whatsappNumber : '';
              const localities = Array.isArray(job.localities) ? job.localities.filter(Boolean) : [];
              const location = [job.city, ...localities].filter(Boolean).join(' · ') || 'Location not specified';
              const phoneDigits = String(whatsappPhone || '').replace(/\D/g, '');
              const whatsappNumber = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
              const hasContact = Boolean(job.showContact && (contactPhone || job.contactEmail));

              return (
                <article className="hiring-job-card hiring-job-card-clean" key={job.id || `${job.title || 'job'}-${index}`} role="listitem">
                  <div className="hiring-job-main">
                    <div className="hiring-job-title-row">
                      <div className="hiring-job-heading">
                        <h2>{job.title || 'Untitled job'}</h2>
                        <p className="hiring-job-company">
                          {job.company || 'Company not specified'}
                          {job.role ? <span> · {job.role}</span> : null}
                        </p>
                      </div>
                      <span className="hiring-availability"><i className="bi bi-circle-fill" aria-hidden="true"></i> Open</span>
                    </div>

                    <div className="hiring-job-facts">
                      {job.jobType && <span><i className="bi bi-briefcase" aria-hidden="true"></i> {job.jobType}</span>}
                      <span><i className="bi bi-geo-alt" aria-hidden="true"></i> {location}</span>
                      <span><i className="bi bi-person-workspace" aria-hidden="true"></i> {formatJobExperience(job.experienceMin, job.experienceMax)} experience</span>
                      <span><i className="bi bi-cash-coin" aria-hidden="true"></i> {formatJobSalary(job.salaryMin, job.salaryMax)}</span>
                      {job.category && job.category !== job.jobType && <span><i className="bi bi-tag" aria-hidden="true"></i> {job.category}</span>}
                      {job.remoteWork && <span><i className="bi bi-house" aria-hidden="true"></i> {job.remoteWork}</span>}
                    </div>

                    {job.description && (
                      <details className="hiring-job-details">
                        <summary>
                          <span>Read job details</span>
                          <i className="bi bi-chevron-down" aria-hidden="true"></i>
                        </summary>
                        <div className="hiring-job-description">{job.description}</div>
                      </details>
                    )}

                    <div className="hiring-job-footer">
                      <span><i className="bi bi-calendar3" aria-hidden="true"></i> Posted {formatJobDate(job.createdAt)}</span>
                      <span className="hiring-contact-note">{hasContact ? 'Contact the hiring team to apply' : 'Contact details are not public'}</span>
                    </div>

                    {hasContact && (
                      <div className="hiring-job-actions">
                        {contactPhone && (
                          <a className="btn btn-primary btn-sm" href={`tel:${String(contactPhone).replace(/[^\d+]/g, '')}`}>
                            <i className="bi bi-telephone" aria-hidden="true"></i> Call
                          </a>
                        )}
                        {whatsappPhone && whatsappNumber && (
                          <a
                            className="btn btn-whatsapp btn-sm"
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <i className="bi bi-whatsapp" aria-hidden="true"></i> WhatsApp
                          </a>
                        )}
                        {job.contactEmail && (
                          <a className="btn btn-outline btn-sm" href={`mailto:${encodeURIComponent(job.contactEmail)}`}>
                            <i className="bi bi-envelope" aria-hidden="true"></i> Email to enquire
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
