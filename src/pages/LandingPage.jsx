import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SectionTabs from '../components/SectionTabs';
import Hero from '../components/Hero';
import TeaserSection from '../components/TeaserSection';
import SneakPeek from '../components/SneakPeek';
import TeamSection from '../components/TeamSection';
import ReviewsSection from '../components/ReviewsSection';
import AboutSection from '../components/AboutSection';
import Footer from '../components/Footer';
import MobileStickyBar from '../components/MobileStickyBar';
import ServiceCatalogModal from '../components/ServiceCatalogModal';
import PortfolioModal from '../components/PortfolioModal';
import { useLandingPage } from '../context/LandingPageContext';
import { nailServices, salonServices } from '../data/servicesCatalog';

const LandingPage = () => {
  const { services, gallery } = useLandingPage();
  const [isNailCatalogOpen, setIsNailCatalogOpen] = useState(false);
  const [isSalonCatalogOpen, setIsSalonCatalogOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const location = useLocation();
  
  // Handle Gallery Modal from other pages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('gallery') === 'open') {
      setIsPortfolioOpen(true);
      // Clean up the URL without refreshing
      window.history.replaceState({}, '', location.pathname + location.hash);
    }
  }, [location]);

  // Handle Hash Scrolling for cross-page navigation
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to allow the page to settle
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Safety guard for loading state
  if (!services || !gallery) return null;

  return (
    <div className="landing-page">
      <Navbar 
        onOpenPortfolio={() => setIsPortfolioOpen(true)}
      />
      <SectionTabs />
      
      <section id="home">
        <Hero />
      </section>

      <TeaserSection 
        id="services"
        title={services.title}
        data={services.items}
        onSeeMore={() => setIsNailCatalogOpen(true)}
      />

      <TeaserSection 
        id="beauty"
        title={services.subtitle}
        data={services.otherItems}
        onSeeMore={() => setIsSalonCatalogOpen(true)}
      />

      <section id="portfolio">
        <SneakPeek 
          data={gallery.items} 
          title={gallery.title} 
          exploreLabel={gallery.exploreLabel} 
          onExplore={() => setIsPortfolioOpen(true)}
        />
      </section>

      <section id="reviews">
        <ReviewsSection />
      </section>

      <section id="about">
        <AboutSection />
      </section>

      <TeamSection />

      <MobileStickyBar />

      <Footer />

      <ServiceCatalogModal 
        isOpen={isNailCatalogOpen} 
        onClose={() => setIsNailCatalogOpen(false)} 
        catalog={nailServices}
      />

      <ServiceCatalogModal 
        isOpen={isSalonCatalogOpen} 
        onClose={() => setIsSalonCatalogOpen(false)} 
        catalog={salonServices}
      />

      <PortfolioModal 
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        images={gallery.items}
      />
    </div>
  );
};

export default LandingPage;
