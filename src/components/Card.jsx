import { motion } from 'framer-motion';
import './Card.css';

function Card({ 
  title, 
  description, 
  image, 
  index, 
  variants, 
  type = 'service' 
}) {
  const isService = type === 'service';

  return (
    <motion.div 
      className={`card ${type}-card`}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      custom={index}
    >
      <div className="card-link-wrapper" style={{ cursor: 'default' }}>
        <div className="card-image">
          <img src={image} alt={title || 'Gallery item'} />
        </div>
        
        {isService && (title || description) && (
          <div className="card-content">
            {title && <h3 className="card-title">{title}</h3>}
            {description && <p className="card-description">{description}</p>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Card;
