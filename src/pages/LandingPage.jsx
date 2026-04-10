import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TeaserSection from '../components/TeaserSection';
import SneakPeek from '../components/SneakPeek';
import TeamSection from '../components/TeamSection';
import ReviewsSection from '../components/ReviewsSection';
import AboutSection from '../components/AboutSection';
import Footer from '../components/Footer';
import { useLandingPage } from '../context/LandingPageContext';

const LandingPage = () => {
  const { services, gallery } = useLandingPage();

  return (
    <div className="landing-page">
      <Navbar />
      
      <section id="home">
        <Hero />
      </section>

      <TeaserSection 
        id="services"
        title={services.title}
        data={services.items}
        footerLink="/services"
        footerText="Explore more services"
      />

      <TeaserSection 
        id="beauty"
        title={services.subtitle}
        data={services.otherItems}
        footerLink="/services#beauty"
        footerText="View more beauty services"
      />

      <SneakPeek data={gallery.items} title={gallery.title} exploreLabel={gallery.exploreLabel} />

      <TeamSection />

      <ReviewsSection />

      <AboutSection />

      <Footer />
    </div>
  );
};

export default LandingPage;
