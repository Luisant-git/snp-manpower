import { FEATURES } from '../data/site.js';

const TONE_CLASS = {
  green: 'green',
  blue: 'blue',
  purple: 'purple',
  amber: 'amber',
};

export default function FeatureGrid() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">
            <i className="bi bi-stars"></i> Why Choose SNP
          </span>
          <h2 className="section-title">Built for Candidates &amp; Recruiters Alike</h2>
          <p className="section-sub">
            One portal for registration, verification, tracking and placement — with WhatsApp at
            the centre of every step.
          </p>
        </div>
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className={`feature-icon stat-icon ${TONE_CLASS[feature.tone] || 'blue'}`}>
                <i className={`bi ${feature.icon}`}></i>
              </div>
              <h4>{feature.title}</h4>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
