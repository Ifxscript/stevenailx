import React from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import { footerData } from '../data/footer';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-main">
          {/* Brand & Pill Section */}
          <div className="footer-brand">
            <span className="footer-logo-text">{footerData.brand.logo}</span>
            <p className="footer-about-text">{footerData.brand.about}</p>
            <a href={footerData.brand.pill.href} className="app-pill">
              <span>{footerData.brand.pill.text}</span>
            </a>
          </div>

          {/* Columns Section */}
          <div className="footer-columns">
            {footerData.columns.map((column, idx) => (
              <div key={idx} className="footer-column">
                <h3>{column.title}</h3>
                <ul>
                  {column.links.map((link, lIdx) => (
                    <li key={lIdx}>
                      {link.isStatic ? (
                        <div className="static-text">
                          {link.label}
                        </div>
                      ) : (
                        <a 
                          href={link.href} 
                          target={link.hasArrow ? "_blank" : "_self"} 
                          rel={link.hasArrow ? "noopener noreferrer" : ""}
                        >
                          {link.hasArrow && <ArrowUpRight className="shadcn-icon" strokeWidth={2.5} />}
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-lang">
            <Globe className="shadcn-icon" />
            <span>{footerData.bottom.language}</span>
          </div>
          <p>{footerData.bottom.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
