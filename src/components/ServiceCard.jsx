import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './ServiceCard.css';

function ServiceCard({ title, description, image, link }) {
  return (
    <div className="service-card">
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
    </div>
  );
}

export default ServiceCard;
