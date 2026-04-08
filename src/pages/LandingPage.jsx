import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import '../components/ServiceCard.css';
import ServiceCard from '../components/ServiceCard';
import { services } from '../data/services';

// Animation Variants

const titleVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" }
  }
};

function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Services Section */}
      <section className="services-teaser">
        <motion.div 
          className="services-teaser-caption"
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p>DISCOVER THE ARTISTRY</p>
        </motion.div>

        <div className="services-cards-grid">
          {services.map((service, index) => (
            <ServiceCard key={service.id} {...service} index={index} />
          ))}
        </div>

        <motion.div 
          className="services-teaser-footer"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          viewport={{ once: true }}
        >
          <Link to="/services" className="explore-more-btn">
            Explore more services
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

export default LandingPage;
