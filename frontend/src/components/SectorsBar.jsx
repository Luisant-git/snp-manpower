import { Link } from 'react-router-dom';
import { SECTORS } from '../data/site.js';

export default function SectorsBar() {
  return (
    <div className="sectors-bar">
      <div className="container sectors-inner">
        <span className="section-eyebrow">
          <i className="bi bi-diagram-3-fill"></i> Industries We Serve
        </span>
        <h2 className="section-title" style={{ color: '#fff' }}>
          Manpower Across Every Major Sector
        </h2>
        <div className="sectors-list" style={{ marginTop: 24 }}>
          {SECTORS.map((sector) => (
            <span className="sector-chip" key={sector.label}>
              <i className={`bi ${sector.icon}`}></i> {sector.label}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <Link to="/register" className="btn btn-teal">
            <i className="bi bi-person-plus-fill"></i> Register Your Dossier
          </Link>
        </div>
      </div>
    </div>
  );
}
