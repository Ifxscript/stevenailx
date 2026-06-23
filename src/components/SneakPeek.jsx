import { Link } from 'react-router-dom';
import './SneakPeek.css';

const MAX_IMAGES = 5;

function SneakPeek({ data, title, exploreLabel, onExplore }) {
  const images = (data || []).slice(0, MAX_IMAGES);
  const count = images.length;

  if (count === 0) return null;

  const heroImage = images[0];
  const sideImages = images.slice(1);
  const sideCount = sideImages.length;

  return (
    <section className="sneak-peek" id="gallery">
      {title && (
        <div className="sneak-peek-header">
          <p className="section-heading">{title}</p>
        </div>
      )}

      <div className="sneak-peek-collage">
        <div className="collage-hero">
          <img src={heroImage.image} alt={heroImage.title} loading="lazy" />
        </div>

        {sideCount > 0 && (
          <div className={`collage-side side-${sideCount}`}>
            {sideImages.map((item, i) => (
              <div
                key={item.id}
                className={`collage-cell side-cell-${i}`}
                onClick={onExplore}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.image} alt={item.title} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-footer">
        <button onClick={onExplore} className="btn-explore">
          see more &gt;
        </button>
      </div>
    </section>
  );
}

export default SneakPeek;
