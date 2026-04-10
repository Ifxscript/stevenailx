import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import './Navbar.css';
import logo from '../assets/IMG_8009-removebg-preview.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Socials', href: '/socials' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <motion.nav 
        className={`navbar ${scrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`} 
        id="navbar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="navbar-logo" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }}>
          <div className="navbar-logo-monogram" style={{ '--logo-url': `url(${logo})` }}></div>
          <span className="navbar-logo-name">STEVE NAIL X</span>
        </div>

        {/* Desktop Links */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a className="navbar-link" href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* Desktop Book Now */}
        <a className="navbar-book-btn navbar-book-btn-desktop" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
          Book Now
        </a>

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
              {/* Close button inside drawer */}
              <button 
                className="drawer-close-btn" 
                onClick={toggleMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>

              <h2 className="drawer-header">Menu</h2>
              
              <div className="drawer-sections">
                {/* Box 1: Grouped Navigation Links */}
                <div className="drawer-card">
                  <div className="card-links">
                    {navLinks.map((link) => (
                      <a 
                        key={link.label} 
                        href={link.href} 
                        className="card-link-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="link-label">{link.label}</span>
                        <ChevronRight size={20} className="link-arrow" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Box 2: Separate Book Now Action */}
                <div className="drawer-card book-card">
                  <a 
                    href={WHATSAPP_LINK} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="card-link-item action-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="link-label">Book an Appointment</span>
                    <ChevronRight size={20} className="link-arrow" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
