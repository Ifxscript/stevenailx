import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, ArrowLeft, ShieldCheck, ChevronDown } from 'lucide-react';
import './ReviewsModal.css';

// Helper for avatar colors (shared or duplicated from ReviewsSection)
const getAvatarColor = (name) => {
  const colors = ['#E8EAF6', '#F3E5F5', '#EDE7F6', '#E3F2FD', '#E1F5FE', '#E0F7FA', '#F1F8E9', '#FFF3E0', '#FBE9E7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const ReviewsModal = ({ isOpen, onClose, reviews, averageRating, totalReviews }) => {
  const [selectedRating, setSelectedRating] = useState(null); // null = All
  const [sortBy, setSortBy] = useState('latest');

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Tier counts for the sidebar
  const ratingTiers = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++; });
    return counts;
  }, [reviews]);

  // Filtered and Sorted list
  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    
    // Filter
    if (selectedRating !== null) {
      result = result.filter(r => r.rating === selectedRating);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

    return result;
  }, [reviews, selectedRating, sortBy]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).replace(',', ' at');
  };

  return (
    <motion.div 
      className="catalog-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="catalog-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div 
        className="catalog-sheet reviews-modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="sheet-handle" onClick={onClose} />
        {/* Header */}
        <header className="modal-header">
          <button className="modal-back-btn" onClick={onClose}>
            <ArrowLeft size={24} />
          </button>
          
          <h2 className="modal-title">Reviews</h2>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <div className="modal-body">
          <div className="modal-container">
            {/* Left Column: Review List */}
            <div className="modal-list-column">
              <div className="list-controls">
                <span className="results-count">{filteredReviews.length} reviews</span>
                <div className="sort-wrapper">
                  <span className="sort-label">Sort by</span>
                  <div className="sort-select-container">
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="sort-select"
                    >
                      <option value="latest">Latest</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                    <ChevronDown size={16} className="select-arrow" />
                  </div>
                </div>
              </div>

              <div className="modal-reviews-list">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <div key={review.id} className="modal-review-item">
                      <div className="review-user">
                        <div className="review-avatar" style={{ backgroundColor: getAvatarColor(review.name) }}>
                          {review.name.charAt(0)}
                        </div>
                        <div className="review-meta">
                          <h4 className="review-name">{review.name}</h4>
                          <span className="review-date">{formatDate(review.date)}</span>
                        </div>
                      </div>
                      <div className="review-stars-individual">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < review.rating ? "#FFB800" : "none"} color={i < review.rating ? "#FFB800" : "#E0E0E0"} />
                        ))}
                      </div>
                      <p className="modal-review-text">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="no-results">No reviews found for this rating.</div>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Summary */}
            <div className="modal-sidebar-column">
              <div className="sticky-sidebar">
                <div className="sidebar-rating-summary">
                  <div className="sidebar-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={24} fill={i < Math.round(averageRating) ? "#FFB800" : "none"} color={i < Math.round(averageRating) ? "#FFB800" : "#E0E0E0"} />
                    ))}
                  </div>
                  <div className="sidebar-score">
                    <span className="sidebar-num">{averageRating}</span>
                    <span className="sidebar-count">({totalReviews})</span>
                  </div>
                </div>

                <div className="filter-section">
                  <h3 className="filter-title">Filter by</h3>
                  <div className="rating-tiers">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button 
                        key={star} 
                        className={`tier-item ${selectedRating === star ? 'active' : ''}`}
                        onClick={() => setSelectedRating(selectedRating === star ? null : star)}
                      >
                        <div className="tier-checkbox">
                          {selectedRating === star && <div className="checked-inner" />}
                        </div>
                        <span className="tier-star-num">{star}</span>
                        <div className="tier-progress-bg">
                          <div 
                            className="tier-progress-fill" 
                            style={{ width: `${(ratingTiers[star] / totalReviews) * 100}%` }}
                          />
                        </div>
                        <span className="tier-count-num text-right">{ratingTiers[star]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trust-card">
                  <div className="trust-header">
                    <h3 className="trust-title">Reviews you can trust</h3>
                    <ShieldCheck size={24} className="trust-icon" />
                  </div>
                  <p className="trust-text">
                    All our ratings are from genuine customers, following verified visits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReviewsModal;
