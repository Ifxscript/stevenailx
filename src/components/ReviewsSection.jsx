import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck } from 'lucide-react';
import { useLandingPage } from '../context/LandingPageContext';
import ReviewsModal from './ReviewsModal';
import './ReviewsSection.css';

// Helper to get a soft color based on name
const getAvatarColor = (name) => {
  const colors = ['#E8EAF6', '#F3E5F5', '#EDE7F6', '#E3F2FD', '#E1F5FE', '#E0F7FA', '#F1F8E9', '#FFF3E0', '#FBE9E7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ReviewCard = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = review.comment.length > 120;
  const displayedComment = isLong && !isExpanded 
    ? review.comment.substring(0, 110) + '...' 
    : review.comment;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <motion.div 
      className="review-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="review-user">
        <div className="review-avatar" style={{ backgroundColor: getAvatarColor(review.name) }}>
          {review.name.charAt(0)}
        </div>
        <div className="review-meta">
          <div className="review-name-group">
            <h4 className="review-name">{review.name}</h4>
            {review.isVerified && (
              <span className="verified-badge" title="Verified Client">
                <ShieldCheck size={12} />
              </span>
            )}
          </div>
          <span className="review-date">{formatDate(review.date)}</span>
        </div>
      </div>
      
      <div className="review-stars-individual">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} fill={i < review.rating ? "#FFB800" : "none"} color={i < review.rating ? "#FFB800" : "#E0E0E0"} />
        ))}
      </div>

      <div className="review-content">
        <p className="review-comment">
          {displayedComment}
          {isLong && (
            <button className="read-more-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? ' Read less' : ' Read more'}
            </button>
          )}
        </p>
      </div>
    </motion.div>
  );
};

function ReviewsSection() {
  const { reviews } = useLandingPage();
  const [allReviews, setAllReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    // Only approved reviews appear on the landing page
    const approved = (reviews?.items || []).filter(r => r.status === 'approved');
    setAllReviews(approved);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reviews?.items]);

  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0 
    ? (allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';

  // Apply limits for the landing page grid
  const isMobile = windowWidth <= 768;
  const displayCount = isMobile ? 2 : 5;
  const displayedReviews = allReviews.slice(0, displayCount);

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-container">
        <header className="reviews-header">
          <h2 className="reviews-title section-heading">{reviews.title}</h2>
          
          <div className="overall-rating">
            <div className="overall-stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={32} fill={i < Math.round(averageRating) ? "#FFB800" : "none"} color={i < Math.round(averageRating) ? "#FFB800" : "#E0E0E0"} />
              ))}
            </div>
            <div className="overall-score">
              <span className="score-num">{averageRating}</span>
              <span className="score-count">({totalReviews})</span>
            </div>
          </div>
        </header>

        <div className="reviews-grid">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        <div className="section-footer">
          <button className="btn-explore" onClick={() => setIsModalOpen(true)}>
            see more &gt;
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ReviewsModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            reviews={allReviews}
            averageRating={averageRating}
            totalReviews={totalReviews}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

export default ReviewsSection;
