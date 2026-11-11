import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationApi } from '../../api/registrationApi.js';
import { userApi } from '../../api/userApi.js';
import { getSession } from '../../data/session.js';

const CARD_INFO = [
  { label: 'Total Applications', icon: 'bi-file-earmark-person-fill', tone: 'blue' },
  { label: 'Paid / Verified Fees', icon: 'bi-cash-coin', tone: 'green' },
  { label: 'Pending Payments', icon: 'bi-hourglass-split', tone: 'amber' },
  { label: 'Registered Candidates', icon: 'bi-people-fill', tone: 'purple' },
];

function money(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function dateTimeLabel(date) {
  return date
    ? new Date(date).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '—';
}

function requestStatusLabel(status) {
  return ({
    PENDING: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Completed',
  }[status] || status || '—');
}

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [applications, setApplications] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestReview, setRequestReview] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const refreshDashboard = () => {
    setLoading(true);
    setError('');
    Promise.all([registrationApi.listAll(), userApi.list()])
      .then(([rows, users]) => {
        setApplications(rows);
        setUserCount(users.filter((user) => user.role === 'APPLICANT').length);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const paidCount = applications.filter((application) => application.paymentStatus === 'PAID').length;
  const pendingCount = applications.filter((application) => application.paymentStatus === 'PENDING').length;
  const cards = [
    { ...CARD_INFO[0], value: applications.length },
    { ...CARD_INFO[1], value: paidCount },
    { ...CARD_INFO[2], value: pendingCount },
    { ...CARD_INFO[3], value: userCount },
  ];
  const pendingDues = applications.reduce((sum, application) => sum + application.feesPending, 0);
  const editRequests = applications
    .filter((application) => application.editRequestStatus && application.editRequestStatus !== 'NONE')
    .sort((a, b) => new Date(a.editRequestedAt || 0).getTime() - new Date(b.editRequestedAt || 0).getTime());
  const role = String(session?.role || '').toLowerCase();
  const canReviewRequest = requestReview &&
    ['admin', 'super_admin'].includes(role) &&
    requestReview.editRequestStatus === 'PENDING';

  const reviewEditRequest = async (action) => {
    if (!requestReview || reviewing) return;
    const reason = rejectionReason.trim();
    if (action === 'REJECT' && !reason) {
      setReviewError('Enter a rejection reason before rejecting this request.');
      return;
    }

    setReviewing(true);
    setReviewError('');
    try {
      await registrationApi.reviewEditRequest(requestReview.ref, action, reason);
      setRequestReview(null);
      refreshDashboard();
    } catch (requestError) {
      setReviewError(requestError.message);
    } finally {
      setReviewing(false);
    }
  };

  return (
    <>
      {error && <div className="track-result track-error" role="alert">{error}</div>}
      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className={`stat-icon ${card.tone}`}><i className={`bi ${card.icon}`}></i></div>
            <div>
              <div className="stat-value">{loading || error ? '—' : card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dues-card">
        <div className="stat-icon amber"><i className="bi bi-cash-stack"></i></div>
        <div>
          <small>Total Pending Processing Dues</small>
          <strong>{loading || error ? '—' : money(pendingDues)}</strong>
        </div>
        <i className="bi bi-exclamation-circle-fill dues-flag"></i>
      </div>

      <div className="admin-table-wrap recent-wrap">
        <div className="recent-head">
          <h4><i className="bi bi-chat-square-text"></i> Employee Correction Requests</h4>
          <small>Oldest requests appear first</small>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Requested At</th><th>Application</th><th>Requested By</th>
              <th>Correction Description</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">Loading requests…</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">Requests could not be loaded.</td></tr>
            ) : editRequests.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-4 text-muted">No employee correction requests yet.</td></tr>
            ) : editRequests.map((application) => {
              const status = application.editRequestStatus;
              const isPending = status === 'PENDING';
              return (
                <tr key={`edit-request-${application.ref}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateTimeLabel(application.editRequestedAt)}</td>
                  <td>
                    <div className="applicant-cell">
                      <strong>{application.name}</strong>
                      <small>{application.ref}</small>
                    </div>
                  </td>
                  <td>{application.editRequestedByName || application.submittedByName || 'Employee'}</td>
                  <td style={{ minWidth: 240, whiteSpace: 'pre-wrap' }}>
                    {application.editRequestNotes || 'No description provided.'}
                    {status === 'REJECTED' && application.editRequestRejectionReason && (
                      <small style={{ display: 'block', marginTop: 6, color: '#b91c1c' }}>
                        Rejection reason: {application.editRequestRejectionReason}
                      </small>
                    )}
                  </td>
                  <td>
                    <span className={`badge-pay ${status === 'REJECTED' ? 'pending' : status === 'APPROVED' || status === 'COMPLETED' ? 'paid' : 'partial'}`}>
                      {requestStatusLabel(status)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isPending ? (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => {
                          setReviewError('');
                          setRejectionReason('');
                          setRequestReview(application);
                        }}
                      >
                        Review
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="icon-btn view"
                        title="View application"
                        aria-label={`View application ${application.ref}`}
                        onClick={() => navigate(`/admin/application/${encodeURIComponent(application.ref)}`, { state: { application } })}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {requestReview && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!reviewing) setRequestReview(null);
          }}
        >
          <div
            className="modal-card"
            style={{ maxWidth: 540 }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-edit-request-title"
          >
            <div className="modal-head">
              <div className="add-user-icon" aria-hidden="true">
                <i className="bi bi-chat-square-text"></i>
              </div>
              <div>
                <h4 id="dashboard-edit-request-title">Review Correction Request</h4>
                <small>{requestReview.name} · Ref: {requestReview.ref}</small>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setRequestReview(null)}
                aria-label="Close"
                disabled={reviewing}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              {reviewError && <div className="track-result track-error" role="alert">{reviewError}</div>}
              <p><strong>Requested by:</strong> {requestReview.editRequestedByName || 'Employee'}</p>
              <p><strong>Requested at:</strong> {dateTimeLabel(requestReview.editRequestedAt)}</p>
              <div className="field-block full">
                <span className="input-label">Correction description</span>
                <div className="track-result" style={{ whiteSpace: 'pre-wrap' }}>
                  {requestReview.editRequestNotes || 'No description provided.'}
                </div>
              </div>
              {canReviewRequest && (
                <label className="field-block full" style={{ marginTop: 14 }}>
                  <span className="input-label">Rejection reason (required to reject)</span>
                  <textarea
                    className="auth-input"
                    rows={4}
                    maxLength={2000}
                    value={rejectionReason}
                    onChange={(event) => {
                      setRejectionReason(event.target.value);
                      setReviewError('');
                    }}
                    placeholder="Enter why this correction request is being rejected"
                    aria-label="Rejection reason for correction request"
                    disabled={reviewing}
                    style={{ resize: 'vertical' }}
                  />
                </label>
              )}
              {!canReviewRequest && (
                <div className="track-result" role="status" style={{ marginTop: 12 }}>
                  This request is no longer pending review.
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setRequestReview(null)}
                disabled={reviewing}
              >
                Close
              </button>
              {canReviewRequest && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => reviewEditRequest('REJECT')}
                    disabled={reviewing || !rejectionReason.trim()}
                  >
                    {reviewing ? 'Saving...' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    className="btn add-user-btn modal-submit"
                    onClick={() => reviewEditRequest('APPROVE')}
                    disabled={reviewing}
                  >
                    {reviewing ? 'Saving...' : 'Approve'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
