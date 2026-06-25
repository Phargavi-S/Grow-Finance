import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiBox, FiUsers, FiFileText, FiShoppingCart, FiTruck,
  FiChevronDown, FiChevronRight, FiRepeat
} from 'react-icons/fi';
import Logo from '../Common/Logo';

const Sidebar = () => {
  const menuSections = [
    {
      title: 'Main Menu',
      items: [
        { path: '/dashboard', name: 'Dashboard', icon: <FiHome /> },
        { path: '/items', name: 'Items', icon: <FiBox /> },
        {
          name: 'Sales',
          icon: <FiShoppingCart />,
          subitems: [
            { path: '/customers', name: 'Customers', icon: <FiUsers /> },
            { path: '/invoices', name: 'Invoices', icon: <FiFileText /> },
            { path: '/recurring', name: 'Recurring Invoices', icon: <FiRepeat /> }
          ]
        },
        {
          name: 'Purchase',
          icon: <FiTruck />,
          subitems: [
            { path: '/purchase-orders', name: 'Purchase Orders', icon: <FiShoppingCart /> },
            { path: '/vendors', name: 'Vendors', icon: <FiTruck /> }
          ]
        }
      ]
    }
  ];

  const [expandedSections, setExpandedSections] = useState(() => {
    const init = {};
    menuSections.forEach(s => { init[s.title] = true; });
    return init;
  });

  const [expandedItems, setExpandedItems] = useState(() => {
    try {
      const raw = window.localStorage.getItem('sidebar_expandedItems');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    const init = {};
    menuSections.forEach(s => s.items.forEach(i => { if (i.subitems) init[i.name] = false; }));
    return init;
  });

  const toggleSection = (title) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleItem = (name) => {
    setExpandedItems(prev => {
      const next = { ...prev, [name]: !prev[name] };
      try { window.localStorage.setItem('sidebar_expandedItems', JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Logo size="sidebar" variant="sidebar" linkTo={null} className="sidebar-logo-component" />
      </div>

      <nav className="sidebar-nav">
        {menuSections.map((section, idx) => (
          <div key={idx} className="sidebar-nav-section">
            <button
              type="button"
              className="sidebar-nav-title"
              onClick={() => toggleSection(section.title)}
            >
              <span>{section.title}</span>
              {expandedSections[section.title] ? <FiChevronDown /> : <FiChevronRight />}
            </button>

            {expandedSections[section.title] && (
              <div className="sidebar-nav-items">
                {section.items.map(item => {
                  if (item.subitems) {
                    const isOpen = !!expandedItems[item.name];
                    return (
                      <div key={item.name} className="sidebar-nav-group">
                        <button
                          type="button"
                          className={`sidebar-nav-item sidebar-nav-toggle ${isOpen ? 'open' : ''}`}
                          onClick={() => toggleItem(item.name)}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          <span className="nav-label">{item.name}</span>
                          <span className="nav-chevron">
                            {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="sidebar-subitems">
                            {item.subitems.map(sub => (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                className={({ isActive }) =>
                                  `sidebar-nav-item sidebar-subitem ${isActive ? 'active' : ''}`
                                }
                              >
                                <span className="nav-icon">{sub.icon}</span>
                                <span className="nav-label">{sub.name}</span>
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-brand">GROW FINANCE</span>
        <span>© 2026 Arshan UG</span>
      </div>
    </aside>
  );
};

export default Sidebar;
