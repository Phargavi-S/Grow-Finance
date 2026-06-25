import React from 'react';

const KPICard = ({ icon, title, value, subtitle, accent }) => (
  <div className={`kpi-card ${accent ? `kpi-card--${accent}` : ''}`}>
    <div className="kpi-card-header">
      <span className="kpi-card-icon">{icon}</span>
      <span className="kpi-card-title">{title}</span>
    </div>
    <div className="kpi-card-value">{value}</div>
    {subtitle && <div className="kpi-card-subtitle">{subtitle}</div>}
  </div>
);

export default KPICard;
