import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from './Card';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

const titleVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1, 
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.215, 0.61, 0.355, 1]
    }
  })
};

function TeaserSection({ id, title, data, footerLink, footerText, onSeeMore, type = 'service' }) {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  useHorizontalScroll(sectionRef, gridRef);

  return (
    <section id={id} className={`services-teaser ${id}-teaser`} ref={sectionRef}>
      <motion.div 
        className="services-teaser-caption"
        variants={titleVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <p className="section-heading">{title}</p>
      </motion.div>

      <div className="services-cards-grid" ref={gridRef}>
        {data.map((item, index) => (
          <Card 
            key={item.id} 
            {...item} 
            index={index} 
            variants={cardVariants} 
            type={type} 
          />
        ))}
      </div>

      {(footerLink || onSeeMore) && (
        <motion.div 
          className="section-footer"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {onSeeMore ? (
            <button onClick={onSeeMore} className="btn-explore">
              {footerText || 'see more >'}
            </button>
          ) : (
            <Link to={footerLink} className="btn-explore">
              {footerText || 'see more >'}
            </Link>
          )}
        </motion.div>
      )}
    </section>
  );
}

export default TeaserSection;
