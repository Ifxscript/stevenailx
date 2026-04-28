import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { Menu, X, ChevronRight, User } from 'lucide-react';
import { useLandingPage } from '../context/LandingPageContext';
import UserDashboardModal from './UserDashboardModal';
import UserAvatar from './UserAvatar';
import './Navbar.css';
import logo from '../assets/IMG_8009-removebg-preview.png';

function Navbar({ onOpenPortfolio }) {
  const { brand, footer } = useLandingPage();
  const { currentUser, isAdmin, isMarketer, loginAsClient, logout, isDashboardOpen, setIsDashboardOpen, openDashboard } = useAuth();
  const { openBookingDrawer } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
    
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  // Extract navigation links from footer data to ensure consistency
  const navLinks = footer?.navColumns?.find(c => c.title === "Navigation")?.links || [];
  // Extract WhatsApp link from socials
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 5);

      if (window.innerWidth <= 768) {
        const heroSection = document.getElementById('home');
        const footerSection = document.querySelector('footer');
        
        if (heroSection) {
          const heroRect = heroSection.getBoundingClientRect();
          const footerRect = footerSection?.getBoundingClientRect();
          
          const pastHero = heroRect.bottom <= 80;
          const reachedFooter = footerRect ? footerRect.top <= (window.innerHeight - 50) : false;
          
          setIsNavHidden(pastHero && !reachedFooter);
        }
      } else {
        setIsNavHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLinkClick = (e, link) => {
    const isHomePage = location.pathname === '/';
    const isAnchor = link.href.startsWith('#');

    if (link.label === "Gallery") {
      e.preventDefault();
      if (onOpenPortfolio) {
        onOpenPortfolio();
      } else {
        // We're on another page, navigate to home with query param
        navigate('/?gallery=open');
      }
      setIsMenuOpen(false);
      return;
    }

    if (!isHomePage && isAnchor) {
      e.preventDefault();
      navigate('/' + link.href);
      setIsMenuOpen(false);
    } else {
      setIsMenuOpen(false);
    }
  };

  const handleAccountClick = async () => {
    if (currentUser) {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
        openDashboard('upcoming');
      } else {
        // Handled directly inside the mobile drawer mapping
      }
    } else {
      try {
        await loginAsClient();
        setIsMenuOpen(false);
      } catch (error) {
        console.error("Login failed:", error);
      }
    }
  };

  return (
    <>
      <motion.nav 
        className={`navbar ${scrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''} ${isNavHidden ? 'nav-hidden' : ''}`} 
        id="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <div 
          className="navbar-logo" 
          onClick={() => { 
            if (location.pathname !== '/') {
              navigate('/');
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }
            setIsMenuOpen(false); 
          }}
        >
          <div className="navbar-logo-monogram" style={{ '--logo-url': `url(${logo})` }}></div>
          <span className="navbar-logo-name">{brand.logo}</span>
        </div>

        {/* Desktop Links */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a 
                className="navbar-link" 
                href={location.pathname === '/' ? link.href : '/' + link.href}
                onClick={(e) => handleLinkClick(e, link)}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a 
              className="navbar-link" 
              href="/blog"
              onClick={(e) => { setIsMenuOpen(false); }}
            >
              Blog
            </a>
          </li>
          {(isAdmin || isMarketer) && (
            <li>
              <a 
                className="navbar-link" 
                href="/blog-editor"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { setIsMenuOpen(false); }}
              >
                Blog Editor
              </a>
            </li>
          )}
        </ul>

        {/* Desktop Actions */}
        <div className="navbar-actions-desktop">
          <button 
            className="navbar-account-btn" 
            onClick={handleAccountClick} 
            aria-label={currentUser ? "My Bookings" : "Sign in"}
          >
            <User size={20} />
          </button>
          
          <button 
            className="navbar-book-btn navbar-book-btn-desktop" 
            onClick={openBookingDrawer}
          >
            Book Now
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="navbar-mobile-toggle" 
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <Menu size={28} />
        </button>
      </motion.nav>

      {/* ===== Full-Screen Mobile Drawer ===== */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="mobile-drawer-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="drawer-content">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button 
                  onClick={toggleMenu}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-brown)', padding: '8px' }}
                  aria-label="Close menu"
                >
                  <X size={28} />
                </button>
              </div>
              
              <div className="drawer-flat-list">
                {/* User Avatar & Name at top */}
                {currentUser && (
                  <div className="drawer-user-row">
                    <UserAvatar user={currentUser} className="drawer-flat-avatar" />
                    <span className="drawer-flat-name">{currentUser.displayName || 'Client'}</span>
                  </div>
                )}

                {/* Navigation Links */}
                {navLinks.map((link) => (
                  <a 
                    key={link.label} 
                    href={location.pathname === '/' ? link.href : '/' + link.href}
                    className="drawer-flat-link"
                    onClick={(e) => handleLinkClick(e, link)}
                  >
                    <span>{link.label}</span>
                    <ChevronRight size={18} className="drawer-flat-arrow" />
                  </a>
                ))}
                <a 
                  href="/blog" 
                  className="drawer-flat-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Blog</span>
                  <ChevronRight size={18} className="drawer-flat-arrow" />
                </a>

                {/* Sign In for logged out users */}
                {!currentUser && (
                  <button 
                    className="drawer-flat-link"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', fontSize: 'inherit' }}
                    onClick={handleAccountClick}
                  >
                    <span>Sign In / Account</span>
                    <ChevronRight size={18} className="drawer-flat-arrow" />
                  </button>
                )}

                {/* Divider + Account links if logged in */}
                {currentUser && (
                  <>
                    <div className="drawer-flat-divider" />
                    <button 
                      className="drawer-flat-link"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', fontSize: 'inherit' }}
                      onClick={() => { setIsMenuOpen(false); openDashboard('settings'); }}
                    >
                      <span>Profile Settings</span>
                      <ChevronRight size={18} className="drawer-flat-arrow" />
                    </button>
                    <button 
                      className="drawer-flat-link"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: 'inherit', fontSize: 'inherit' }}
                      onClick={() => { setIsMenuOpen(false); openDashboard('appointments'); }}
                    >
                      <span>My Appointments</span>
                      <ChevronRight size={18} className="drawer-flat-arrow" />
                    </button>

                    {/* Admin Portal — only shown to admins */}
                    {isAdmin && (
                      <a 
                        href="/admin" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="drawer-flat-link"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Admin Portal</span>
                        <ChevronRight size={18} className="drawer-flat-arrow" />
                      </a>
                    )}

                    {/* Blog Editor Portal */}
                    {(isAdmin || isMarketer) && (
                      <a 
                        href="/blog-editor" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="drawer-flat-link"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Blog Editor</span>
                        <ChevronRight size={18} className="drawer-flat-arrow" />
                      </a>
                    )}
                  </>
                )}

                {/* Book Appointment for logged out users */}
                {!currentUser && (
                  <button 
                    className="drawer-flat-link drawer-flat-cta"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                    onClick={() => { setIsMenuOpen(false); openBookingDrawer(); }}
                  >
                    <span>Book an Appointment</span>
                    <ChevronRight size={18} className="drawer-flat-arrow" />
                  </button>
                )}

                {/* Logout at the bottom */}
                {currentUser && (
                  <>
                    <div className="drawer-flat-divider" />
                    <button 
                      className="drawer-flat-link drawer-flat-logout"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                    >
                      <span>Log Out</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserDashboardModal 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />
    </>
  );
}

export default Navbar;
