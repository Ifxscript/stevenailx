import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useLandingPage } from '../context/LandingPageContext';
import './Navbar.css';
import logo from '../assets/IMG_8009-removebg-preview.png';

function Navbar() {
  const { brand, footer } = useLandingPage();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Extract navigation links from footer data to ensure consistency
  const navLinks = footer.navColumns.find(c => c.title === "Navigation")?.links || [];
  // Extract WhatsApp link from socials
  const whatsappLink = footer.navColumns.find(c => c.title === "Socials")?.links.find(l => l.label === "WhatsApp")?.href || "#";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 5);
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
          <span className="navbar-logo-name">{brand.logo}</span>
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
        <a className="navbar-book-btn navbar-book-btn-desktop" href={whatsappLink} target="_blank" rel="noopener noreferrer">
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
              <button 
                className="drawer-close-btn" 
                onClick={toggleMenu}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>

              <h2 className="drawer-header">Menu</h2>
              
              <div className="drawer-sections">
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

                <div className="drawer-card book-card">
                  <a 
                    href={whatsappLink} 
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
