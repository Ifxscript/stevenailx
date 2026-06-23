import { Link } from 'react-router-dom';
import Card from './Card';

function TeaserSection({ id, title, data, footerLink, footerText, onSeeMore, type = 'service' }) {
  return (
    <section id={id} className={`services-teaser ${id}-teaser`}>
      <div className="services-teaser-caption">
        <p className="section-heading">{title}</p>
      </div>

      <div className="services-cards-grid">
        {(data || []).map((item) => (
          <Card key={item.id} {...item} type={type} />
        ))}
      </div>

      {(footerLink || onSeeMore) && (
        <div className="section-footer">
          {onSeeMore ? (
            <button onClick={onSeeMore} className="btn-explore">
              {footerText || 'see more >'}
            </button>
          ) : (
            <Link to={footerLink} className="btn-explore">
              {footerText || 'see more >'}
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

export default TeaserSection;
