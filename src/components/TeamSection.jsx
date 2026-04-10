import { motion } from 'framer-motion';
import { useLandingPage } from '../context/LandingPageContext';
import { Star } from 'lucide-react';
import './TeamSection.css';

function TeamSection() {
  const { team, reviews } = useLandingPage();
  
  // Combine context reviews with any submitted ones from localStorage
  const localReviews = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
  const allReviews = [...reviews.items, ...localReviews].filter(r => r.status === 'approved');

  const getAverageRating = (memberId) => {
    const memberReviews = allReviews.filter(r => r.memberId === memberId);
    if (memberReviews.length === 0) return '5.0';
    const sum = memberReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / memberReviews.length).toFixed(1);
  };

  return (
    <section className="team-section" id="team">
      <div className="team-container">
        <header className="team-header">
          <h2 className="team-title">{team.title}</h2>
        </header>

        <div className="team-row">
          {team.members.map((member, index) => (
            <motion.div 
              key={member.id} 
              className="team-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <div className="team-avatar-container">
                <div className="team-avatar-wrapper">
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="team-avatar" />
                  ) : (
                    <div className="team-avatar-placeholder">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Rating Badge */}
                <div className="team-rating-badge">
                  <Star size={14} fill="#FFB800" color="#FFB800" className="badge-star" />
                  <span className="badge-score">{getAverageRating(member.id)}</span>
                </div>
              </div>

              <div className="team-info">
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TeamSection;
