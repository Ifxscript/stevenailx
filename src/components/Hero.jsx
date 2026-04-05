import landingImg from '../assets/landing.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-circle"></div>
      <div className="hero-container">
        
        <div className="hero-text">
          <h1>Stressed, blessed & nail obsessed</h1>
          <p>Premium nail artistry crafted to perfection. Your hands, our masterpiece.</p>
          
          <div className="hero-buttons">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary">Book Appointment</a>
            <a href="#services" className="btn-secondary">Discover Services</a>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <img src={landingImg} alt="SteveNailX nail art" className="hero-image" />
        </div>

      </div>
    </section>
  );
}

export default Hero;
