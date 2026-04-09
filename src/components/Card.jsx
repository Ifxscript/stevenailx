import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Card.css';

function Card({ 
  title, 
  description, 
  image, 
  link, 
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
      <Link to={link || '#'} className="card-link-wrapper">
        <div className="card-image">
          <img src={image} alt={title || 'Gallery item'} />
        </div>
        
        {isService && (title || description) && (
          <div className="card-content">
            {title && <h3 className="card-title">{title}</h3>}
            {description && <p className="card-description">{description}</p>}
          </div>
        )}
      </Link>
    </motion.div>
  );
}

export default Card;
