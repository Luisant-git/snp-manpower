import { STATS } from '../data/site.js';

export default function StatsStrip() {
  return (
    <div className="stats-strip">
      <div className="container">
        <div className="stats-grid">
          {STATS.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div className={`stat-icon ${stat.tone}`}>
                <i className={`bi ${stat.icon}`}></i>
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
