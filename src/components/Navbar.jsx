import { useState, useEffect } from 'react';
import { Home, Scissors, Image, Phone, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import './Navbar.css';
import logo from '../assets/IMG_8009-removebg-preview.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Gallery', href: '/gallery' },
];

const bottomNavItems = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Services', href: '#services', icon: Scissors },
  { label: 'Gallery', href: '/gallery', icon: Image },
  { label: 'Socials', href: '/socials', icon: ArrowUpRight },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      
      // Auto-shrink on navigation scroll
      if (window.scrollY > 10) {
        setIsNavCollapsed(true);
      }
      
      const sections = ['home', 'about', 'services'];
      for (const section of sections.reverse()) {
        const el = document.getElementById(section);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* ===== Desktop + Mobile Top Navbar ===== */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="navbar-logo-monogram" style={{ '--logo-url': `url(${logo})` }}></div>
          <span className="navbar-logo-name">STEVE NAIL X</span>
        </div>

        {/* Desktop Links */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                className="navbar-link"
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Book Now */}
        <a
          className="navbar-book-btn navbar-book-btn-desktop"
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book Now
        </a>

        {/* Mobile Booking Button (top-right) */}
        <a
          className="navbar-mobile-book"
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Book an appointment"
        >
          <Phone size={18} strokeWidth={2} />
        </a>
      </nav>

      {/* ===== Mobile Bottom Nav ===== */}
      <div className={`mobile-nav-container ${isNavCollapsed ? 'nav-is-collapsed' : ''}`}>
        {/* Collapse Toggle Bubble */}
        <div 
          className="nav-collapse-bubble" 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        >
          {isNavCollapsed ? (
            <ChevronRight size={24} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={24} strokeWidth={2.5} />
          )}
        </div>

        <nav className={`bottom-nav ${isNavCollapsed ? 'collapsed' : ''}`} aria-label="Mobile navigation">
          {bottomNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeSection === item.href.replace('#', '');

            return (
              <a
                key={item.label}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                href={item.href}
                onClick={(e) => item.href.startsWith('#') && handleNavClick(e, item.href)}
              >
                <IconComponent 
                  size={22} 
                  strokeWidth={isActive ? 2 : 1.8}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                <span className="bottom-nav-label">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
}

export default Navbar;
