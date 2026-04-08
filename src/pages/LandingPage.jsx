import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  const servicesSectionRef = useRef(null);
  const servicesGridRef = useRef(null);

  useEffect(() => {
    const sectionEl = servicesSectionRef.current;
    const gridEl = servicesGridRef.current;
    if (!sectionEl || !gridEl) return undefined;

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const getMaxScrollLeft = () => Math.max(0, gridEl.scrollWidth - gridEl.clientWidth);

    const isSectionActive = () => {
      const rect = sectionEl.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.8 && rect.bottom >= window.innerHeight * 0.2;
    };

    const canConsumeDelta = (delta) => {
      const maxScroll = getMaxScrollLeft();
      if (maxScroll <= 0) return false;
      if (delta > 0) return gridEl.scrollLeft < maxScroll - 1;
      if (delta < 0) return gridEl.scrollLeft > 1;
      return false;
    };

    const routeScrollToGrid = (delta) => {
      if (!isMobile() || !isSectionActive() || !canConsumeDelta(delta)) return false;
      gridEl.scrollLeft += delta;
      return true;
    };

    const handleWheel = (event) => {
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (routeScrollToGrid(dominantDelta)) {
        event.preventDefault();
      }
    };

    let lastTouchX = 0;
    let lastTouchY = 0;

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    };

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      const moveX = touch.clientX - lastTouchX;
      const moveY = touch.clientY - lastTouchY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;

      const dominantDelta = Math.abs(moveX) > Math.abs(moveY) ? -moveX : -moveY;
      if (routeScrollToGrid(dominantDelta)) {
        event.preventDefault();
      }
    };

    sectionEl.addEventListener('wheel', handleWheel, { passive: false });
    sectionEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    sectionEl.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      sectionEl.removeEventListener('wheel', handleWheel);
      sectionEl.removeEventListener('touchstart', handleTouchStart);
      sectionEl.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home">
        <Hero />
      </section>

      {/* Services Section */}
      <section id="services" className="services-teaser" ref={servicesSectionRef}>
        <motion.div 
          className="services-teaser-caption"
          variants={titleVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p>DISCOVER THE ARTISTRY</p>
        </motion.div>

        <div className="services-cards-grid" ref={servicesGridRef}>
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
