import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import '../components/ServiceCard.css';

// Client Images
import imgArt from '../assets/05b546f7-da33-42aa-9970-24db3d722a5e.JPG';
import imgGel from '../assets/9795e025-569d-46f9-81f7-e4646112d16e.JPG';
import imgClassic from '../assets/4805424a-ba58-4ab1-9f67-3e603aea138b.JPG';

const services = [
  {
    id: 1,
    title: 'Classic Luxe',
    description: 'Timeless elegance with meticulous care, shaping, and a flawless polished finish.',
    image: imgClassic,
    link: '/services#classic'
  },
  {
    id: 2,
    title: 'Custom Nail Art',
    description: 'A masterpiece on every finger—completely bespoke designs that reflect your style.',
    image: imgArt,
    link: '/services#art'
  },
  {
    id: 3,
    title: 'Elite Gel Series',
    description: 'Ultimate durability with a high-fashion edge and incredible, long-lasting shine.',
    image: imgGel,
    link: '/services#gel'
  }
];

// Animation Variants
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, 
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1] // Custom cubic-bezier for a cinematic "pop"
    }
  })
};

const titleVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" }
  }
};

// ServiceCard local component with Motion
function ServiceCard({ title, description, image, link, index }) {
  return (
    <motion.div 
      className="service-card"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      custom={index}
    >
      <div className="service-card-image">
        <img src={image} alt={title} />
        <Link to={link || '/services'} className="service-card-explore">
          <span className="explore-text">Explore</span>
          <div className="explore-icon">
            <ArrowUpRight size={18} />
          </div>
        </Link>
      </div>
      <div className="service-card-content">
        <h3 className="service-card-title">{title}</h3>
        <p className="service-card-desc">{description}</p>
      </div>
    </motion.div>
  );
}

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
