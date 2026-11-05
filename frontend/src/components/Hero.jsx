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
              <i className="bi bi-patch-check-fill"></i> Driver Registration &amp; Placement
            </span>
            <h1 className="hero-title">
              Register as a Driver. Find Your Next Opportunity with{' '}
              <span className="grad">{BRAND.fullName}</span>
            </h1>
            <p className="hero-lead">
              Share your driving licence, experience and preferred role through a simple registration.
              We help connect verified driver profiles with suitable transport, logistics and fleet openings.
            </p>

            <div className="hero-ctas">
              <Link to="/register" className="btn btn-primary btn-lg">
                <i className="bi bi-pencil-square"></i> Register as a Driver
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <i className="bi bi-whatsapp text-success"></i> Driver Login
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
