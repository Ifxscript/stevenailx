import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ServicesTeaser from '../components/ServicesTeaser';

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <div id="home">
        <Hero />
      </div>
      <ServicesTeaser />
    </div>
  );
}

export default LandingPage;
