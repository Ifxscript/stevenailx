import './Card.css';

function Card({ title, description, image, type = 'service' }) {
  const isService = type === 'service';

  return (
    <div className={`card ${type}-card`}>
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
    </div>
  );
}

export default Card;
