import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, Settings, Image as ImageIcon, ListOrdered, LogOut, 
  Home, ChevronRight, X, Star, Users, MessageSquare, CalendarCheck, Clock, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobile } from '../../hooks/useMobile';
import logoImg from '../../assets/IMG_8009-removebg-preview.png';
import './AdminSidebar.css';

function AdminSidebar({ isOpen, onClose, currentUser, onLogout }) {
  const location = useLocation();
  const isMobile = useMobile();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentUser?.photoURL]);

  const navItems = [
    { label: 'Overview', path: '/admin', icon: <BarChart3 size={18} /> },
    { label: 'Site Content', path: '/admin/content', icon: <Home size={18} /> },
    { label: 'Services & Prices', path: '/admin/services', icon: <ListOrdered size={18} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <CalendarCheck size={18} /> },
    { label: 'Portfolio', path: '/admin/portfolio', icon: <ImageIcon size={18} /> },
    { label: 'Reviews', path: '/admin/reviews', icon: <MessageSquare size={18} /> },
    { label: 'Users', path: '/admin/users', icon: <User size={18} /> },
    { label: 'Team', path: '/admin/team', icon: <Users size={18} /> },
    { label: 'Availability', path: '/admin/availability', icon: <Clock size={18} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  // Mobile Full-Screen Drawer (matches main site)
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="admin-mobile-drawer-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="admin-drawer-content">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button 
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brown)', padding: '8px' }}
                  aria-label="Close menu"
                >
                  <X size={28} />
                </button>
              </div>
              
              <div className="admin-drawer-flat-list">
                {/* User Avatar & Name at top */}
                <div className="admin-drawer-user-row">
                  <div className="admin-drawer-flat-avatar-wrap">
                    {currentUser?.photoURL && !imgError ? (
                      <img src={currentUser.photoURL} alt="" className="admin-drawer-flat-avatar" onError={() => setImgError(true)} />
                    ) : (
                      <div className="admin-drawer-flat-avatar-placeholder">
                        {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="admin-drawer-flat-name">{currentUser?.displayName || "Anekwe Ifeanyi"}</span>
                </div>

                <div className="admin-drawer-flat-divider" />

                {/* Navigation Links */}
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`admin-drawer-flat-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: location.pathname === item.path ? 'var(--color-burgundy)' : '#888' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="admin-drawer-flat-arrow" />
                  </Link>
                ))}

                <div className="admin-drawer-flat-divider" />

                <button 
                  className="admin-drawer-flat-link admin-drawer-flat-logout"
                  onClick={onLogout}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#ff5252' }}><LogOut size={18} /></span>
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop Burgundy Sidebar
  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-group">
          <img src={logoImg} alt="" className="brand-logo-img-small" />
          <span className="brand-text">STEVENAILX</span>
        </div>
      </div>

      <div className="sidebar-user-highlight">
        <div className="user-avatar-large">
          {currentUser?.photoURL && !imgError ? (
            <img src={currentUser.photoURL} alt="" onError={() => setImgError(true)} />
          ) : (
            <span>{currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="user-welcome">
          <span className="welcome-label">WELCOME BACK,</span>
          <span className="user-displayName">{currentUser?.displayName || "Anekwe Ifeanyi"}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={onClose}
          >
            <div className="nav-link-indicator" />
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {location.pathname === item.path && <ChevronRight size={14} className="active-chevron" />}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn-v2" onClick={onLogout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
