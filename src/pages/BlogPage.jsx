import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BlogCard from '../components/blog/BlogCard';
import { Loader2 } from 'lucide-react';
import './BlogPage.css';

function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState(['All', 'Nail Art', 'Tutorials', 'Studio Updates', 'Beauty Tips', 'Behind the Scenes']);

  useEffect(() => {
    const q = query(
      collection(db, 'blogs'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'blog_settings'), (snap) => {
      if (snap.exists() && snap.data().categories) {
        const fetchedCats = snap.data().categories;
        if (fetchedCats.length > 0) {
          setCategories(['All', ...fetchedCats]);
        }
      }
    });

    return () => unsub();
  }, []);

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="blog-page">
      <Navbar />

      <div className="blog-page__hero">
        <div className="blog-page__hero-inner">
          <h1 className="blog-page__title">Studio Journal</h1>
          <p className="blog-page__subtitle">Tips, trends, and behind-the-scenes from SteveNailX</p>
        </div>
      </div>

      <div className="blog-page__container">
        {/* Category Filter */}
        <div className="blog-page__filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`blog-filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="blog-page__loading">
            <Loader2 className="animate-spin" size={36} color="#8B3A4A" />
            <p>Loading posts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="blog-page__empty">
            <p>No posts yet in this category. Check back soon!</p>
          </div>
        ) : (
          <div className="blog-page__grid">
            {filtered.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default BlogPage;
