import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, Settings, Image as ImageIcon, ListOrdered, LogOut, 
  Home, ChevronRight, X, Star, Users, MessageSquare, CalendarCheck, Clock, User
} from 'lucide-react';
import logoImg from '../../assets/IMG_8009-removebg-preview.png';
import './AdminSidebar.css';

function AdminSidebar({ isOpen, onClose, currentUser, onLogout }) {
  const location = useLocation();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentUser?.photoURL]);

  const navItems = [
    { label: 'Overview', path: '/admin', icon: <BarChart3 size={20} /> },
    { label: 'Site Content', path: '/admin/content', icon: <Home size={20} /> },
    { label: 'Services & Prices', path: '/admin/services', icon: <ListOrdered size={20} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <CalendarCheck size={20} /> },
    { label: 'Portfolio', path: '/admin/portfolio', icon: <ImageIcon size={20} /> },
    { label: 'Reviews', path: '/admin/reviews', icon: <MessageSquare size={20} /> },
    { label: 'Users', path: '/admin/users', icon: <User size={20} /> },
    { label: 'Team', path: '/admin/team', icon: <Users size={20} /> },
    { label: 'Availability', path: '/admin/availability', icon: <Clock size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-group">
          <img src={logoImg} alt="" className="brand-logo-img-small" />
          <span className="brand-text">STEVENAILX</span>
        </div>
        <button className="close-sidebar-btn" onClick={onClose}><X size={24} /></button>
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
