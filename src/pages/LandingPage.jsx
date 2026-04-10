import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import TeaserSection from '../components/TeaserSection';
import SneakPeek from '../components/SneakPeek';
import Footer from '../components/Footer';
import { services } from '../data/services';
import { otherServices } from '../data/otherServices';
import { galleryData } from '../data/gallery';

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Nail Services Section */}
      <TeaserSection 
        id="services"
        title="DISCOVER THE ARTISTRY"
        data={services}
        footerLink="/services"
        footerText="Explore more services"
      />

      {/* Other Beauty Services Section */}
      <TeaserSection 
        id="beauty"
        title="BEYOND THE NAILS"
        data={otherServices}
        footerLink="/services#beauty"
        footerText="View more beauty services"
      />

      {/* Gallery Sneak Peek */}
      <SneakPeek data={galleryData} />

      <Footer />
    </div>
  );
}

export default LandingPage;
