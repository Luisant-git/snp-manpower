import { Link } from 'react-router-dom';

export default function CtaBanner() {
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <div className="cta-banner">
          <div>
            <h3>Ready to Start Your Driving Career?</h3>
            <p>
              Register your driving experience and licence details to be considered for suitable
              transport, logistics and fleet opportunities.
            </p>
          </div>
          <Link to="/register" className="btn btn-teal btn-lg">
            <i className="bi bi-truck"></i> Register as a Driver
          </Link>
        </div>
      </div>
    </section>
  );
}
