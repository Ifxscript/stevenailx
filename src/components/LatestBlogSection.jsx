import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import BlogCard from './blog/BlogCard';
import { ArrowRight } from 'lucide-react';
import './LatestBlogSection.css';

function LatestBlogSection() {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'blogs'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // Hide entirely if no published posts
  if (posts.length === 0) return null;

  return (
    <section className="latest-blog" id="blog-latest">
      <div className="latest-blog__container">
        <h2 className="section-heading">Latest from the Studio</h2>

        <div className="latest-blog__grid">
          {posts.map(post => (
            <BlogCard key={post.id} post={post} compact />
          ))}
        </div>

        <div className="section-footer">
          <button className="btn-explore" onClick={() => navigate('/blog')}>
            View All Posts <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default LatestBlogSection;
