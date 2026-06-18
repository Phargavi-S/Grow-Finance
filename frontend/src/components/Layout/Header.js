import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const Header = ({ onLogout, user: propUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || { fullName: 'Administrator', name: 'Administrator' });

  useEffect(() => {
    if (!propUser) {
      const fetchUser = async () => {
        try {
          const response = await axios.get('/auth/me', { withCredentials: true });
          if (response.data.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      };
      fetchUser();
    }
  }, [propUser]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout', {}, { withCredentials: true });
      localStorage.removeItem('remembered_email');
      if (onLogout) onLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayName = user.fullName || user.name || 'Administrator';

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-brand-mark">GF</div>
        <div>
          <div className="header-title">Welcome back, {displayName}</div>
          <div className="header-date">{currentDate}</div>
        </div>
      </div>
      <div className="header-right">
        <div className="user-profile">
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-role">GROW FINANCE</span>
          </div>
          <div className="user-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;