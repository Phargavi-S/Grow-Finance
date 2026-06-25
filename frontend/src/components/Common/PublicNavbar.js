import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

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
        <div onClick={() => setMenuOpen(false)}>
          <Logo size="sm" variant="light" linkTo="/" />
        </div>

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
