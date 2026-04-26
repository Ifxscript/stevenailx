import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const ReviewSubmissionModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const { currentUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      const reviewData = {
        name: currentUser.displayName || 'Verified Client',
        rating,
        comment,
        date: new Date().toISOString(),
        userId: currentUser.uid,
        bookingId: booking.id || booking.docId,
        status: 'pending', // Requires admin approval
        isVerified: true,
        isLegacy: false,
        createdAt: new Date().toISOString()
      };

      // Save to reviews collection
      // We use setDoc with a composite ID to prevent duplicate reviews for the same booking
      await setDoc(doc(db, 'reviews', `rev_${booking.docId || booking.id}`), reviewData);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to submit review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="catalog-overlay" style={{ zIndex: 2000 }}>
      <motion.div 
        className="catalog-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      <motion.div 
        className="catalog-sheet review-submit-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="sheet-handle" onClick={onClose} />
        
        <header className="modal-header">
          <h2 className="modal-title">Share your experience</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="review-submit-container">
            <p className="submit-intro">
              How was your service for <strong>{booking.services?.map(s => s.name).join(', ')}</strong>?
            </p>

            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-select-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    size={36} 
                    fill={star <= rating ? "#FFB800" : "none"} 
                    color={star <= rating ? "#FFB800" : "#E0E0E0"} 
                  />
                </button>
              ))}
            </div>

            <div className="comment-field">
              <label>Your Review</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others what you loved about your visit..."
                rows={4}
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-review-btn" 
              disabled={submitting || !comment.trim()}
            >
              {submitting ? (
                <><Loader2 className="animate-spin" size={20} /> Submitting...</>
              ) : (
                <><Send size={18} /> Submit Review</>
              )}
            </button>
            <p className="submit-note">Your review will be verified and approved by Steve before appearing on the site.</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReviewSubmissionModal;
