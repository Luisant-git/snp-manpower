import { PROCESS_STEPS } from '../data/site.js';

export default function ProcessSection() {
  return (
    <section className="section" id="process">
      <div className="container">
        <div className="section-head">
          <span className="section-eyebrow">
            <i className="bi bi-signpost-split-fill"></i> How It Works
          </span>
          <h2 className="section-title">From Registration to Placement in 4 Steps</h2>
          <p className="section-sub">
            A transparent, trackable journey — every stage is visible against your reference code.
          </p>
        </div>
        <div className="process-grid">
          {PROCESS_STEPS.map((step) => (
            <div className="process-card" key={step.step}>
              <div className="process-step">{step.step}</div>
              <h4>{step.title}</h4>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
