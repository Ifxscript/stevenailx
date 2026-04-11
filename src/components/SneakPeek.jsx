import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './SneakPeek.css';

const MAX_IMAGES = 10;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 1.03 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }
  }
};

function SneakPeek({ data, title, exploreLabel }) {
  const images = (data || []).slice(0, MAX_IMAGES);
  const count = images.length;

  if (count === 0) return null;

  const heroImage = images[0];
  const sideImages = images.slice(1);
  const sideCount = sideImages.length;

  return (
    <section className="sneak-peek" id="gallery">
      {/* Header with dynamic title */}
      {title && (
        <div className="sneak-peek-header">
          <p className="section-heading">{title}</p>
        </div>
      )}

      {/* ---- Universal Editorial Collage (Previously Desktop Only) ---- */}
      <motion.div
        className="sneak-peek-collage"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div className="collage-hero" variants={itemVariants}>
          <img src={heroImage.image} alt={heroImage.title} loading="lazy" />
        </motion.div>

        {sideCount > 0 && (
          <div className={`collage-side side-${sideCount}`}>
            {sideImages.map((item, i) => (
              <motion.div
                key={item.id}
                className={`collage-cell side-cell-${i}`}
                variants={itemVariants}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ---- Explore More Button ---- */}
      <div className="section-footer">
        <Link to="/gallery" className="btn-explore">
          see more &gt;
        </Link>
      </div>
    </section>
  );
}

export default SneakPeek;
