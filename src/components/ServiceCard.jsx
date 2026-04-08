import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './ServiceCard.css';
import { motion } from 'framer-motion';
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

export default ServiceCard;
