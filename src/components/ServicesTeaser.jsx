import { Link } from 'react-router-dom';
import './ServicesTeaser.css';
import classicImg from '../assets/service-classic.png';
import artImg from '../assets/service-art.png';
import gelImg from '../assets/service-gel.png';

const services = [
  {
    id: 1,
    title: 'Classic Manicure',
    description: 'Essential care for your hands with cleaning, filing, and polish in the color of your choice.',
    image: classicImg,
    link: '/services#classic'
  },
  {
    id: 2,
    title: 'Custom Nail Art',
    description: 'Unique designs that reflect your style — from minimalist to bold and creative looks.',
    image: artImg,
    link: '/services#art'
  },
  {
    id: 3,
    title: 'Gel Polish Nails',
    description: 'Long-lasting shine with a professional, resistant finish made for your everyday style.',
    image: gelImg,
    link: '/services#gel'
  }
];

function ServicesTeaser() {
  return (
    <section className="services-teaser">
      <div className="services-teaser-caption">
        <p>DISCOVER OUR CRAFT</p>
      </div>

      <div className="services-cards-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-card-image">
              <img src={service.image} alt={service.title} />
            </div>
            <div className="service-card-content">
              <h3 className="service-card-title">{service.title}</h3>
              <p className="service-card-desc">{service.description}</p>
              <Link to={service.link} className="service-card-btn">
                Book it now!
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="services-teaser-footer">
        <Link to="/services" className="explore-more-btn">
          Explore more services
        </Link>
      </div>
    </section>
  );
}

export default ServicesTeaser;
