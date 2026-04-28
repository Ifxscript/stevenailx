import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Loader2, ArrowLeft, Calendar, User } from 'lucide-react';
import './BlogPostPage.css';

function BlogPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const snap = await getDoc(doc(db, 'blogs', id));
        if (snap.exists() && snap.data().status === 'published') {
          setPost({ id: snap.id, ...snap.data() });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="blog-post-page">
        <Navbar />
        <div className="blog-post__loading">
          <Loader2 className="animate-spin" size={36} color="#8B3A4A" />
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="blog-post-page">
        <Navbar />
        <div className="blog-post__not-found">
          <h2>Article not found</h2>
          <p>This post may have been removed or doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate('/blog')}>Back to Blog</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="blog-post-page">
      <Navbar />

      {/* Cover Image */}
      {post.coverImage && (
        <div className="blog-post__cover">
          <img src={post.coverImage} alt={post.title} />
        </div>
      )}

      <article className="blog-post__article">
        {/* Back link */}
        <button className="blog-post__back" onClick={() => navigate('/blog')}>
          <ArrowLeft size={18} />
          <span>All Posts</span>
        </button>

        {/* Category */}
        {post.category && (
          <span className="blog-post__category">{post.category}</span>
        )}

        {/* Title */}
        <h1 className="blog-post__title">{post.title}</h1>

        {/* Author & Date */}
        <div className="blog-post__meta">
          <div className="blog-post__meta-item">
            <User size={16} />
            <span>{post.authorName}</span>
          </div>
          <div className="blog-post__meta-item">
            <Calendar size={16} />
            <time>{formatDate(post.createdAt)}</time>
          </div>
        </div>

        {/* Divider */}
        <div className="blog-post__divider" />

        {/* Rich Content Body */}
        <div 
          className="blog-post__content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <Footer />
    </div>
  );
}

export default BlogPostPage;
