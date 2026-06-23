import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { useLandingPage } from '../context/LandingPageContext';
import { ArrowRight } from 'lucide-react';
import './SocialsPage.css';

function SocialsPage() {
  const { brand, socials } = useLandingPage();

  return (
    <div className="socials-page">
      <BackButton />

      <main className="socials-container">

        <section className="profile-section">
          <div className="profile-image">
            <img src={brand.logoImage} alt={brand.name} />
          </div>
          <h1>{brand.name}</h1>
          <p className="tagline">{brand.tagline}</p>
          <div className="bio-container">
            <p className="bio">{brand.bio}</p>
          </div>
        </section>

        <section className="editorial-links">
          {socials.map((social) => {
            let href = (social.href || '').trim();
            if (href && href !== '#' && !href.startsWith('http') && !href.startsWith('/')) {
              href = 'https://' + href;
            }
            const isExternal = href.startsWith('http');
            const isValid = href && href !== '#';
            return (
              <a
                key={social.id}
                href={isValid ? href : undefined}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : ''}
                className={`editorial-link-item${!isValid ? ' link-inactive' : ''}`}
                onClick={!isValid ? (e) => e.preventDefault() : undefined}
              >
                <div className="link-text-block">
                  <span className="link-label">{social.label}</span>
                  <span className="link-description">{social.description}</span>
                </div>
                <div className="link-arrow">
                  <ArrowRight size={28} strokeWidth={1} />
                </div>
              </a>
            );
          })}
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default SocialsPage;
