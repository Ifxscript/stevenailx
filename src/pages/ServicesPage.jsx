import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import Card from '../components/Card';
import { useLandingPage } from '../context/LandingPageContext';
import './ServicesPage.css';

function ServicesPage() {
  const { services } = useLandingPage();

  return (
    <div className="services-page">
      <BackButton />

      <header className="services-page-header">
        <div className="header-content">
          <h1>OUR SERVICES</h1>
          <p className="subtitle">Meticulous artistry for your hands and beyond.</p>
        </div>
      </header>

      <main className="services-page-content">

        <section className="service-category-section">
          <div className="category-info">
            <h2 className="category-title">{services.title}</h2>
            <p className="category-desc">Our signature collections, from classic elegance to bespoke hand-painted masterpieces.</p>
          </div>
          <div className="services-grid">
            {services.items.map((service) => (
              <Card key={service.id} {...service} />
            ))}
          </div>
        </section>

        <section className="service-category-section">
          <div className="category-info">
            <h2 className="category-title">{services.subtitle}</h2>
            <p className="category-desc">Elevating your daily look with professional makeup, skin-care, and hair installations.</p>
          </div>
          <div className="services-grid">
            {services.otherItems.map((service) => (
              <Card key={service.id} {...service} />
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default ServicesPage;
