import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { uploadToImgBB } from '../lib/imgbb';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import TipTapEditor from '../components/blog/TipTapEditor';
import { 
  Loader2, Plus, ArrowLeft, Trash2, Edit3, Eye, 
  FileText, Send, Save, ImagePlus, LogOut, ChevronDown
} from 'lucide-react';
import logoImg from '../assets/IMG_8009-removebg-preview.png';
import ManageCategoriesModal from '../components/blog/ManageCategoriesModal';
import './BlogEditorPage.css';

const DEFAULT_CATEGORIES = ['Nail Art', 'Tutorials', 'Studio Updates', 'Beauty Tips', 'Behind the Scenes'];

function BlogEditorPage() {
  const { currentUser, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Categories state
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  // Editor state
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [editingPost, setEditingPost] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef(null);

  // Fetch this user's posts
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'blogs'),
      where('authorId', '==', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(list);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser]);

  // Fetch dynamic categories
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_content', 'blog_settings'), (snap) => {
      if (snap.exists() && snap.data().categories) {
        const fetchedCats = snap.data().categories;
        setCategories(fetchedCats.length > 0 ? fetchedCats : DEFAULT_CATEGORIES);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    });

    return () => unsub();
  }, []);

  // Ensure 'category' is valid when 'categories' change
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  const resetEditor = () => {
    setEditingPost(null);
    setTitle('');
    setCategory(categories[0] || '');
    setCoverImage('');
    setContent('');
  };

  const openNewPost = () => {
    resetEditor();
    setView('editor');
  };

  const openEditPost = (post) => {
    setEditingPost(post);
    setTitle(post.title);
    setCategory(post.category || categories[0] || '');
    setCoverImage(post.coverImage || '');
    setContent(post.content || '');
    setView('editor');
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadToImgBB(file);
      setCoverImage(url);
    } catch (err) {
      console.error('Cover upload failed:', err);
      alert('Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const savePost = async (status) => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }

    setSaving(true);
    try {
      const postData = {
        title: title.trim(),
        category,
        coverImage,
        content,
        status,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        updatedAt: serverTimestamp(),
      };

      if (editingPost) {
        await updateDoc(doc(db, 'blogs', editingPost.id), postData);
      } else {
        postData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'blogs'), postData);
      }

      setView('list');
      resetEditor();
    } catch (err) {
      console.error('Error saving post:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      await deleteDoc(doc(db, 'blogs', postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="be-page">
      <ManageCategoriesModal 
        isOpen={isManageCategoriesOpen} 
        onClose={() => setIsManageCategoriesOpen(false)} 
        categories={categories} 
      />

      {/* Header */}
      <header className="be-header">
        <div className="be-header__left">
          <img src={logoImg} alt="" className="be-header__logo" />
          <div>
            <span className="be-header__brand">STEVENAILX</span>
            <span className="be-header__label">Blog Editor</span>
          </div>
        </div>
        <div className="be-header__right">
          <span className="be-header__user">{currentUser?.displayName || currentUser?.email}</span>
          <button className="be-header__logout" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="be-main">
        {view === 'list' ? (
          /* ═══════ POST LIST VIEW ═══════ */
          <div className="be-list">
            <div className="be-list__header">
              <div>
                <h1 className="be-list__title">Your Posts</h1>
                <p className="be-list__subtitle">{posts.length} {posts.length === 1 ? 'article' : 'articles'}</p>
              </div>
              <button className="be-btn be-btn--primary" onClick={openNewPost}>
                <Plus size={18} />
                <span>New Post</span>
              </button>
            </div>

            {loading ? (
              <div className="be-list__loading">
                <Loader2 className="animate-spin" size={32} color="#8B3A4A" />
              </div>
            ) : posts.length === 0 ? (
              <div className="be-list__empty">
                <FileText size={48} strokeWidth={1} />
                <h3>No posts yet</h3>
                <p>Create your first blog post for the studio.</p>
                <button className="be-btn be-btn--primary" onClick={openNewPost}>
                  <Plus size={18} />
                  <span>Write Your First Post</span>
                </button>
              </div>
            ) : (
              <div className="be-list__grid">
                {posts.map(post => (
                  <div key={post.id} className="be-post-card">
                    <div className="be-post-card__image">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} />
                      ) : (
                        <div className="be-post-card__placeholder"><FileText size={24} /></div>
                      )}
                      <span className={`be-post-card__status ${post.status}`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="be-post-card__body">
                      <h3 className="be-post-card__title">{post.title}</h3>
                      <div className="be-post-card__meta">
                        <span>{post.category}</span>
                        <span>·</span>
                        <span>{formatDate(post.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="be-post-card__actions">
                      <button className="be-icon-btn" onClick={() => openEditPost(post)} title="Edit">
                        <Edit3 size={16} />
                      </button>
                      {post.status === 'published' && (
                        <button className="be-icon-btn" onClick={() => window.open(`/blog/${post.id}`, '_blank')} title="View">
                          <Eye size={16} />
                        </button>
                      )}
                      <button className="be-icon-btn be-icon-btn--danger" onClick={() => deletePost(post.id)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ═══════ EDITOR VIEW ═══════ */
          <div className="be-editor">
            <div className="be-editor__top-bar">
              <button className="be-editor__back" onClick={() => { setView('list'); resetEditor(); }}>
                <ArrowLeft size={18} />
                <span>Back to Posts</span>
              </button>
              <div className="be-editor__actions">
                <button 
                  className="be-btn be-btn--secondary" 
                  onClick={() => savePost('draft')} 
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save as Draft</span>
                </button>
                <button 
                  className="be-btn be-btn--primary" 
                  onClick={() => savePost('published')} 
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Publish</span>
                </button>
              </div>
            </div>

            <div className="be-editor__form">
              {/* Cover Image */}
              <div className="be-editor__cover-wrap">
                {coverImage ? (
                  <div className="be-editor__cover-preview">
                    <img src={coverImage} alt="Cover" />
                    <button className="be-editor__cover-change" onClick={() => coverInputRef.current?.click()}>
                      Change Cover
                    </button>
                  </div>
                ) : (
                  <button className="be-editor__cover-upload" onClick={() => coverInputRef.current?.click()} disabled={uploadingCover}>
                    {uploadingCover ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <ImagePlus size={28} />
                        <span>Add Cover Image</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Title */}
              <input
                type="text"
                className="be-editor__title-input"
                placeholder="Post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="be-editor__category-wrap">
                  <select 
                    className="be-editor__category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="be-editor__category-icon" />
                </div>
                <button 
                  className="be-btn be-btn--secondary" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  onClick={() => setIsManageCategoriesOpen(true)}
                >
                  Manage Categories
                </button>
              </div>

              {/* Rich Text Editor */}
              <TipTapEditor content={content} onUpdate={setContent} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default BlogEditorPage;
