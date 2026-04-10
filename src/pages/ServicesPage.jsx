import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import Card from '../components/Card';
import { useLandingPage } from '../context/LandingPageContext';
import { motion } from 'framer-motion';
import './ServicesPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

function ServicesPage() {
  const { services } = useLandingPage();

  return (
    <div className="services-page">
      <BackButton />
      
      {/* Page Header */}
      <header className="services-page-header">
        <motion.div 
          className="header-content"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1>OUR SERVICES</h1>
          <p className="subtitle">Meticulous artistry for your hands and beyond.</p>
        </motion.div>
      </header>

      <main className="services-page-content">
        
        {/* Section: Nail Artistry */}
        <section className="service-category-section">
          <motion.div 
            className="category-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="category-title">{services.title}</h2>
            <p className="category-desc">Our signature collections, from classic elegance to bespoke hand-painted masterpieces.</p>
          </motion.div>

          <motion.div 
            className="services-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.items.map((service, index) => (
              <Card 
                key={service.id} 
                {...service} 
                index={index}
                variants={fadeUp}
              />
            ))}
          </motion.div>
        </section>

        {/* Section: Beyond the Nails */}
        <section className="service-category-section">
          <motion.div 
            className="category-info"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="category-title">{services.subtitle}</h2>
            <p className="category-desc">Elevating your daily look with professional makeup, skin-care, and hair installations.</p>
          </motion.div>

          <motion.div 
            className="services-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.otherItems.map((service, index) => (
              <Card 
                key={service.id} 
                {...service} 
                index={index}
                variants={fadeUp}
              />
            ))}
          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default ServicesPage;
