import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.jpeg';

const Logo = ({
  size = 'md',
  showText = true,
  variant = 'default',
  linkTo = '/',
  className = ''
}) => {
  const sizeClass = `gf-logo--${size}`;
  const variantClass = `gf-logo--${variant}`;

  const content = (
    <div className={`gf-logo ${sizeClass} ${variantClass} ${className}`.trim()}>
      <img src={logoImg} alt="GROW FINANCE" className="gf-logo-img" />
      {showText && (
        <div className="gf-logo-text">
          <span className="gf-logo-grow">GROW</span>
          <span className="gf-logo-finance">FINANCE</span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="gf-logo-link" aria-label="GROW FINANCE Home">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
