import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import './AdminHeader.css';

const AdminHeader = ({ onMenuClick, currentLabel, currentUser }) => {
  return (
    <header className="admin-header-claude">
      <div className="header-left">
        <button onClick={onMenuClick} className="header-icon-btn">
          <Menu size={20} />
        </button>
      </div>

      <div className="header-center">
        <div className="context-pill">
          <span className="pill-parent">Admin</span>
          <ChevronRight size={12} className="pill-separator" />
          <span className="pill-current">{currentLabel}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-avatar-claude">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="" />
          ) : (
            currentUser?.email?.charAt(0).toUpperCase()
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
