import React from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import { useLandingPage } from '../context/LandingPageContext';
import './Footer.css';

const Footer = () => {
  const { footer } = useLandingPage();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-main">
          {/* Brand section removed as per requirement - now managed via context if needed */}

          {/* Columns Section */}
          <div className="footer-columns">
            {(footer?.navColumns || []).map((column, idx) => (
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
            <span>{footer.language}</span>
          </div>
          <p>© {new Date().getFullYear()} {footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
