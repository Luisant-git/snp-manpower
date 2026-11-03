import { CARDS, DUES, RECENT } from '../../data/dashboard.js';

/* Payment status → badge class */
const payClass = { Paid: 'pay-paid', Pending: 'pay-pending', Partial: 'pay-partial' };

export default function Dashboard() {
  return (
    <>
      {/* ---------- Stat cards ---------- */}
      <div className="stats-grid">
        {CARDS.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className={`stat-icon ${c.tone}`}>
              <i className={`bi ${c.icon}`}></i>
            </div>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Total pending processing dues ---------- */}
      <div className="dues-card">
        <div className="stat-icon amber">
          <i className="bi bi-cash-stack"></i>
        </div>
        <div>
          <small>Total Pending Processing Dues</small>
          <strong>{DUES.value}</strong>
        </div>
        <i className="bi bi-exclamation-circle-fill dues-flag"></i>
      </div>

      {/* ---------- Recent manpower applications ---------- */}
      <div className="admin-table-wrap recent-wrap">
        <div className="recent-head">
          <h4>
            <i className="bi bi-clock-history"></i> Recent Manpower Applications
          </h4>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference No</th>
              <th>Applicant</th>
              <th>Candidate Mobile</th>
              <th>Filled By (Staff)</th>
              <th>Applied Designation</th>
              <th>Payment Status</th>
              <th>Pending Fee</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {RECENT.map((r) => (
              <tr key={r.ref}>
                <td>
                  <strong style={{ color: 'var(--navy)', letterSpacing: '.3px' }}>{r.ref}</strong>
                </td>
                <td>
                  <div className="applicant-cell">
                    <strong>{r.name}</strong>
                    <small>{r.meta}</small>
                  </div>
                </td>
                <td className="mono-cell">{r.mobile}</td>
                <td>
                  <div className="applicant-cell">
                    <strong>{r.filledBy}</strong>
                    {r.filledByMobile && <small>{r.filledByMobile}</small>}
                  </div>
                </td>
                <td>{r.designation}</td>
                <td>
                  <span className={`badge-pay ${payClass[r.payment] || ''}`}>{r.payment}</span>
                </td>
                <td>
                  <span className={`chip-fee ${r.pendingFee === 'Cleared' ? 'cleared' : 'due'}`}>
                    {r.pendingFee}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="icon-btn" title="View application">
                    <i className="bi bi-eye"></i>
                  </button>{' '}
                  <button className="icon-btn" title="Print dossier">
                    <i className="bi bi-printer"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
