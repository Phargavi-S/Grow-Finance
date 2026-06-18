import React, { useState } from 'react';

const Intro = ({ onEnter }) => {
  const [closing, setClosing] = useState(false);

  const handleEnter = () => {
    setClosing(true);
    // allow CSS closing animation to play
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  return (
    <div className={`intro-overlay ${closing ? 'closing' : ''}`}>
      <div className="intro-card" role="dialog" aria-label="Welcome">
        <div className="intro-top">
          <h2>GROW FINANCE</h2>
          <p className="intro-sub">Create invoices, manage customers, automate PDFs & emails</p>
        </div>

        <ul className="intro-list">
          <li>Customer management</li>
          <li>Invoice generation & PDF</li>
          <li>Automated email delivery</li>
          <li>Dashboard & status tracking</li>
        </ul>

        <div className="intro-actions">
          <button className="enter-btn" onClick={handleEnter}>Enter App</button>
        </div>

        <div className="credits">Built by PHARGAVI AND VIGNESH</div>
      </div>
    </div>
  );
};

export default Intro;
