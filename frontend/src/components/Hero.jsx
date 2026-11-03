import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, TRUST_POINTS } from '../data/site.js';
import TrackCard from './TrackCard.jsx';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <span className="hero-badge">
              <i className="bi bi-patch-check-fill"></i> Trusted Manpower &amp; Recruitment Agency
            </span>
            <h1 className="hero-title">
              Accelerate Your Career with <span className="grad">{BRAND.fullName}</span>
            </h1>
            <p className="hero-lead">
              Direct job interviews, verified candidate profiles and enterprise manpower placement
              across industrial, manufacturing, corporate and logistics sectors.
            </p>

            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">
                <i className="bi bi-pencil-square"></i> Fill Manpower Registration Form
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <i className="bi bi-whatsapp text-success"></i> Candidate Login
              </Link>
            </div>

            <div className="hero-trust">
              {TRUST_POINTS.map((point) => (
                <span key={point}>
                  <i className="bi bi-check-circle-fill"></i> {point}
                </span>
              ))}
            </div>
          </div>

          <TrackCard />
        </div>
      </div>
    </section>
  );
}
