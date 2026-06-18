import React from 'react';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import RecurringList from './RecurringList';

const RecurringPage = ({ onLogout, user }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header onLogout={onLogout} user={user} />
        <div className="content-area">
          <div className="page-header">
            <h1 className="page-title">Recurring Invoices</h1>
          </div>
          <RecurringList />
        </div>
      </div>
    </div>
  );
};

export default RecurringPage;
