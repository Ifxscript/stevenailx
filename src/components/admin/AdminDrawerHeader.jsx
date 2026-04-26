import React from 'react';
import { X } from 'lucide-react';
import './AdminDrawerHeader.css';

/**
 * AdminDrawerHeader Component
 * 
 * A premium, glassmorphism header for mobile drawers.
 * 
 * @param {string} title - The title displayed at the center.
 * @param {function} onClose - Callback function when the X button is clicked.
 * @param {string} variant - 'light' (default) or 'dark'.
 */
const AdminDrawerHeader = ({ 
  title, 
  onClose, 
  variant = 'light',
  className = "" 
}) => {
  return (
    <div className={`admin-drawer-header-root variant-${variant} ${className}`}>
      {/* CENTERED TITLE */}
      <h2 className="admin-drawer-header-title">
        {title}
      </h2>

      {/* RIGHT-ALIGNED CLOSE BUTTON */}
      <button 
        className="admin-drawer-header-close" 
        onClick={onClose}
        aria-label="Close Drawer"
      >
        <X size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default AdminDrawerHeader;
