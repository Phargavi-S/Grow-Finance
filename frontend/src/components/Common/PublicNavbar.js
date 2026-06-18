import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PublicNavbar = ({ transparent = false }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`gf-navbar ${transparent ? 'gf-navbar-transparent' : ''}`}>
      <div className="gf-navbar-inner">
        <Link to="/" className="gf-navbar-brand" onClick={() => setMenuOpen(false)}>
          <span className="gf-brand-icon">◆</span>
          GROW FINANCE
        </Link>

        <button
          className="gf-navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`gf-navbar-links ${menuOpen ? 'open' : ''}`}>
          <button type="button" onClick={() => scrollTo('features')}>Features</button>
          <button type="button" onClick={() => scrollTo('benefits')}>Benefits</button>
          <button type="button" onClick={() => scrollTo('stats')}>Statistics</button>
          <button type="button" onClick={() => scrollTo('footer')}>Contact</button>
          <button type="button" className="gf-btn-ghost" onClick={() => navigate('/login')}>
            Login
          </button>
          <button type="button" className="gf-btn-accent" onClick={() => navigate('/signup')}>
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
