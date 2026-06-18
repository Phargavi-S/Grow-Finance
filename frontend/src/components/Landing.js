import React from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from './Common/PublicNavbar';
import AnimatedCounter from './Common/AnimatedCounter';
import {
  FiBarChart2, FiBox, FiUsers, FiFileText,
  FiRepeat, FiTruck, FiShoppingCart
} from 'react-icons/fi';

const features = [
  { icon: <FiBarChart2 />, title: 'Dashboard', desc: 'Real-time financial overview with revenue, invoices, and payment KPIs.' },
  { icon: <FiBox />, title: 'Items', desc: 'Manage products and services with pricing, tax rules, and inventory details.' },
  { icon: <FiUsers />, title: 'Customers', desc: 'Centralized customer profiles, contact details, and relationship history.' },
  { icon: <FiFileText />, title: 'Invoices', desc: 'Create professional invoices, track status, and export to PDF.' },
  { icon: <FiRepeat />, title: 'Recurring Invoices', desc: 'Automated billing cycles for subscriptions and repeat clients.' },
  { icon: <FiTruck />, title: 'Vendors', desc: 'Maintain vendor records with contact info and purchase history.' },
  { icon: <FiShoppingCart />, title: 'Purchase Orders', desc: 'Create and track purchase orders from draft through billing.' }
];

const benefits = [
  { title: 'Secure Sessions', desc: 'Enterprise-grade authentication with encrypted sessions and protected routes.' },
  { title: 'Invoice Management', desc: 'Generate, send, and track invoices with full payment status visibility.' },
  { title: 'Customer & Vendor Hub', desc: 'Manage all business contacts and procurement relationships in one place.' },
  { title: 'Recurring Billing', desc: 'Set up automated invoice schedules for predictable revenue streams.' },
  { title: 'Purchase Tracking', desc: 'Monitor purchase orders and vendor transactions end to end.' },
  { title: 'Live Dashboard', desc: 'Monitor revenue, invoices, and key metrics with real-time data.' }
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="gf-landing">
      <PublicNavbar transparent />

      <section className="gf-hero">
        <div className="gf-hero-glow" />
        <div className="gf-hero-grid" />
        <div className="gf-hero-content">
          <div className="gf-hero-badge">Finance SaaS Platform</div>
          <h1 className="gf-hero-title">GROW FINANCE</h1>
          <p className="gf-hero-subtitle">Smart Financial Management for Modern Businesses</p>
          <p className="gf-hero-desc">
            Manage invoices, customers, vendors, items, recurring billing, and purchase orders
            from one centralized, professional platform.
          </p>
          <div className="gf-hero-actions">
            <button className="gf-btn-primary gf-btn-lg" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="gf-btn-outline gf-btn-lg" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="gf-section">
        <div className="gf-container">
          <div className="gf-section-header">
            <h2>Everything You Need</h2>
            <p>Financial tools built for growing businesses — all available today</p>
          </div>
          <div className="gf-features-grid">
            {features.map((f) => (
              <div key={f.title} className="gf-feature-card">
                <div className="gf-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="gf-section gf-section-dark">
        <div className="gf-container">
          <div className="gf-section-header">
            <h2>Why GROW FINANCE</h2>
            <p>Built for professionals who demand precision and clarity</p>
          </div>
          <div className="gf-benefits-grid">
            {benefits.map((b) => (
              <div key={b.title} className="gf-benefit-card">
                <div className="gf-benefit-check">✓</div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="gf-section">
        <div className="gf-container">
          <div className="gf-section-header">
            <h2>Trusted by Businesses</h2>
            <p>Numbers that speak for themselves</p>
          </div>
          <div className="gf-stats-grid">
            <AnimatedCounter end={12500} suffix="+" label="Invoices Processed" />
            <AnimatedCounter end={3200} suffix="+" label="Active Businesses" />
            <AnimatedCounter end={98} suffix="%" label="Customer Satisfaction" />
            <AnimatedCounter end={45} suffix="M+" label="Transactions Tracked" />
          </div>
        </div>
      </section>

      <footer id="footer" className="gf-footer">
        <div className="gf-container">
          <div className="gf-footer-grid">
            <div className="gf-footer-brand">
              <h3>GROW FINANCE</h3>
              <p>Smart financial management for modern businesses. Simplify billing, grow faster.</p>
            </div>
            <div>
              <h4>About</h4>
              <ul>
                <li><a href="#features">Our Platform</a></li>
                <li><a href="#benefits">Why Choose Us</a></li>
                <li><a href="#stats">Statistics</a></li>
              </ul>
            </div>
            <div>
              <h4>Features</h4>
              <ul>
                <li><a href="#features">Invoicing</a></li>
                <li><a href="#features">Customers</a></li>
                <li><a href="#features">Purchase Orders</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li>support@growfinance.com</li>
                <li>+1 (800) 555-0199</li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><button type="button" className="gf-footer-link">Privacy Policy</button></li>
                <li><button type="button" className="gf-footer-link">Terms of Service</button></li>
              </ul>
            </div>
          </div>
          <div className="gf-footer-bottom">
            <p>© 2026 GROW FINANCE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
