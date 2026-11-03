import { Link } from 'react-router-dom';

export default function CtaBanner() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="cta-banner">
          <div>
            <h3>Hiring Manpower for Your Unit?</h3>
            <p>
              Our recruitment desk can shortlist verified, dossier-complete candidates within 48
              hours of your requirement brief.
            </p>
          </div>
          <Link to="/login" className="btn btn-teal btn-lg">
            <i className="bi bi-people-fill"></i> Partner With Us
          </Link>
        </div>
      </div>
    </section>
  );
}
