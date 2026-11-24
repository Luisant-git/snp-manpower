import { useEffect, useState } from 'react';
import { getSession } from '../data/session.js';

export default function NoticeBar() {
  const [session, setCurrentSession] = useState(getSession);

  useEffect(() => {
    const refreshSession = () => setCurrentSession(getSession());
    window.addEventListener('snp-session-change', refreshSession);
    return () => window.removeEventListener('snp-session-change', refreshSession);
  }, []);

  const isJobSeeker = String(session?.role || '').toUpperCase() === 'APPLICANT';

  return (
    <div className="notice-bar">
      <i className="bi bi-megaphone-fill"></i>{' '}
      {isJobSeeker ? (
        <>
          <strong>My Applications:</strong> Track your registrations, check your details,
          and follow your placement applications from one place.
        </>
      ) : (
        <>
          <strong>Application Management:</strong> Review registrations, verify candidate details,
          and manage placement applications from one place.
        </>
      )}
    </div>
  );
}
