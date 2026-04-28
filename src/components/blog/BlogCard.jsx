import { useNavigate } from 'react-router-dom';
import './BlogCard.css';

function BlogCard({ post, compact = false }) {
  const navigate = useNavigate();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <article 
      className={`blog-card ${compact ? 'blog-card--compact' : ''}`}
      onClick={() => navigate(`/blog/${post.id}`)}
    >
      <div className="blog-card__image-wrap">
        {post.coverImage ? (
          <img src={post.coverImage} alt={post.title} className="blog-card__image" loading="lazy" />
        ) : (
          <div className="blog-card__image-placeholder">
            <span>✦</span>
          </div>
        )}
        {post.category && (
          <span className="blog-card__category">{post.category}</span>
        )}
      </div>
      <div className="blog-card__body">
        <h3 className="blog-card__title">{post.title}</h3>
        <div className="blog-card__meta">
          <span className="blog-card__author">{post.authorName}</span>
          <span className="blog-card__dot">·</span>
          <time className="blog-card__date">{formatDate(post.createdAt)}</time>
        </div>
      </div>
    </article>
  );
}

export default BlogCard;
