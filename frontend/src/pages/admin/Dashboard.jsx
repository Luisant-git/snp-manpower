import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrationApi } from '../../api/registrationApi.js';
import { userApi } from '../../api/userApi.js';

const CARD_INFO = [
  { label: 'Total Applications', icon: 'bi-file-earmark-person-fill', tone: 'blue' },
  { label: 'Paid / Verified Fees', icon: 'bi-cash-coin', tone: 'green' },
  { label: 'Pending Payments', icon: 'bi-hourglass-split', tone: 'amber' },
  { label: 'Registered Candidates', icon: 'bi-people-fill', tone: 'purple' },
];

function money(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function dateLabel(date) {
  return date
    ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([registrationApi.listAll(), userApi.list()])
      .then(([rows, users]) => {
        setApplications(rows);
        setUserCount(users.filter((user) => user.role === 'APPLICANT').length);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
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
  const recent = applications.slice(0, 5);

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
          <h4><i className="bi bi-clock-history"></i> Recent Manpower Applications</h4>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference No</th><th>Applicant</th><th>Candidate Mobile</th>
              <th>Filled By (Staff)</th><th>Applied Designation</th>
              <th>Payment Status</th><th>Pending Fee</th><th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="text-center py-4 text-muted">Loading applications…</td></tr>
            ) : error ? (
              <tr><td colSpan="9" className="text-center py-4 text-muted">Applications could not be loaded.</td></tr>
            ) : recent.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4 text-muted">No applications have been submitted.</td></tr>
            ) : recent.map((application) => {
              const details = application.details || {};
              const payment = application.paymentStatus?.toLowerCase() || 'pending';
              const paymentLabel = payment[0].toUpperCase() + payment.slice(1);
              return (
                <tr key={application.ref}>
                  <td><strong style={{ color: 'var(--navy)', letterSpacing: '.3px' }}>{application.ref}</strong></td>
                  <td><div className="applicant-cell"><strong>{application.name}</strong><small>{details.gender || '—'}{details.age ? ` | Age: ${details.age}` : ''}</small></div></td>
                  <td className="mono-cell">+91 {application.mobile}</td>
                  <td><div className="applicant-cell"><strong>{application.submittedByName || '—'}</strong><small>{application.submittedByMobile || ''}</small></div></td>
                  <td>{application.designation || '—'}</td>
                  <td>{paymentLabel}</td>
                  <td>{money(application.feesPending)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateLabel(application.createdAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="icon-btn" title="View application" onClick={() => navigate(`/admin/application/${encodeURIComponent(application.ref)}`, { state: { application } })}>
                      <i className="bi bi-eye"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
