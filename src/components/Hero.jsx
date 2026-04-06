import { motion } from 'framer-motion';
import landingImg from '../assets/landing.png';

const WHATSAPP_NUMBER = '2347034872747';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.`;

// Animation variants for the cinematic reveal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.215, 0.61, 0.355, 1]
    }
  }
};

const imageVariants = {
  hidden: { opacity: 0, scale: 1.05, x: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 2.2,
      ease: [0.215, 0.61, 0.355, 1]
    }
  }
};

function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-circle"></div>
      <motion.div 
        className="hero-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        <div className="hero-text">
          <motion.h1 variants={itemVariants}>Stressed, blessed & nail obsessed</motion.h1>
          <motion.p variants={itemVariants}>Premium nail artistry crafted to perfection. Your hands, our masterpiece.</motion.p>
          
          <motion.div className="hero-buttons" variants={itemVariants}>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary">Book Appointment</a>
            <a href="#services" className="btn-secondary">Discover Services</a>
          </motion.div>
        </div>

        <motion.div className="hero-image-wrapper" variants={imageVariants}>
          <img src={landingImg} alt="SteveNailX nail art" className="hero-image" />
        </motion.div>

      </motion.div>
    </section>
  );
}

export default Hero;
