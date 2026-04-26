import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Loader2, Star, Trash2, Plus, CheckCircle2, XCircle, Save, RefreshCcw, ShieldCheck, LayoutList, CalendarCheck, MessageSquare, ChevronRight, Clock } from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import HubActionPill from './HubActionPill';
import AdminAddButton from './AdminAddButton';
import AdminSectionDescription from './AdminSectionDescription';
import { useMobile } from '../../hooks/useMobile';

// ── Sub-Component for the Review List ──
function ReviewList({ list, activeSectionId, isMobile, onAdd, onToggleStatus, onDelete, ...props }) {
  return (
    <div className="hub-form-grid">
      {isMobile ? (
        <>
          <div style={{ marginBottom: '12px' }}>
            <AdminSectionDescription text="Curate your best client stories and approve new verified feedback." />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <AdminAddButton label="Add Legacy" onClick={() => onAdd(props)} />
          </div>
        </>
      ) : (
        <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ textTransform: 'capitalize' }}>{activeSectionId} Testimonials</h2>
            <p>Curate your best client stories and approve new verified feedback.</p>
          </div>
          <AdminAddButton label="Add Legacy" onClick={() => onAdd(props)} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
        {list.map((review) => (
          <div key={review.id} className="hub-field-card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 auto', minWidth: '200px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f9f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a1a26', fontWeight: 800, flexShrink: 0 }}>{review.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                     <h4 style={{ fontWeight: 800, color: '#4a1a26', margin: 0 }}>{review.name}</h4>
                     {review.status !== 'approved' ? (
                       <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#F9F0D9', color: '#7A693F', fontSize: '0.65rem', fontWeight: 800 }}>PENDING</span>
                     ) : (
                       review.isLegacy ? (
                         <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#F9F0D9', color: '#7A693F', fontSize: '0.65rem', fontWeight: 800 }}>LEGACY</span>
                       ) : (
                         <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#E1E8DE', color: '#4F5E49', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={10} /> VERIFIED</span>
                       )
                     )}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
                     {[1, 2, 3, 4, 5].map(n => (
                       <Star key={n} size={12} fill={n <= review.rating ? '#f59e0b' : 'none'} color={n <= review.rating ? '#f59e0b' : '#ddd'} />
                     ))}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {review.status !== 'approved' && (
                  <button 
                    onClick={() => onToggleStatus(review)}
                    style={{ border: 'none', background: '#E1E8DE', color: '#4F5E49', padding: '6px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                )}
                <button 
                  onClick={() => onDelete(review.id)} 
                  style={{ border: 'none', background: 'rgba(229, 57, 53, 0.05)', color: '#e53935', padding: '6px', borderRadius: '99px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p style={{ color: '#4a1a26', lineHeight: '1.6', fontSize: '0.95rem', margin: '0 0 12px 0' }}>"{review.comment}"</p>
            <div style={{ fontSize: '0.8rem', color: '#8E8484', fontWeight: 600 }}>{review.date ? new Date(review.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</div>
          </div>
        ))}
        {list.length === 0 && <div style={{ textAlign: 'center', padding: '60px', opacity: 0.2 }}><MessageSquare size={48} /></div>}
      </div>
    </div>
  );
}

// ── Sub-Component for the Review Form ──
function ReviewForm({ newReview, setNewReview, onSave, closePopup, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4a1a26', margin: 0 }}>Add Legacy Review</h2>
        <p style={{ color: '#8E8484', marginTop: '4px', fontWeight: 500 }}>Manually record feedback from other platforms.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="input-field">
          <label className="field-label"><span>Client name</span></label>
          <input className="hub-input" value={newReview.name} onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))} placeholder="Victoria G." />
        </div>
        <div className="input-field">
          <label className="field-label"><span>Rating</span></label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setNewReview(prev => ({ ...prev, rating: n }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Star size={20} fill={n <= newReview.rating ? '#f59e0b' : 'none'} color={n <= newReview.rating ? '#f59e0b' : '#ccc'} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="input-field">
        <label className="field-label"><span>Review Content</span></label>
        <textarea className="hub-textarea" value={newReview.comment} onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))} rows={4} placeholder="Best mani ever!" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button className="action-btn discard" onClick={closePopup}>Cancel</button>
        <button className="action-btn save" onClick={onSave} disabled={saving}>{saving ? <Loader2 className="animate-spin" size={14} /> : 'Save Review'}</button>
      </div>
    </div>
  );
}

function ReviewsManager() {
  const isMobile = useMobile();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('all');
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '', status: 'approved' });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'reviews'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setReviews(items);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching reviews:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (review) => {
    try {
      const newStatus = review.status === 'approved' ? 'pending' : 'approved';
      await updateDoc(doc(db, 'reviews', review.id), { status: newStatus });
    } catch {
      alert("Failed to update status.");
    }
  };

  const deleteReview = async (reviewId) => {
    if (!window.confirm("Delete this review permanently?")) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch {
      alert("Failed to delete review.");
    }
  };

  const addReview = async (closePopup) => {
    if (!newReview.name || !newReview.comment) return alert("Name and comment are required.");
    setSaving(true);
    try {
      const id = `manual_${Date.now()}`;
      await setDoc(doc(db, 'reviews', id), {
        ...newReview,
        id,
        date: new Date().toISOString(),
        isLegacy: true,
        isVerified: false
      });
      setNewReview({ name: '', rating: 5, comment: '', status: 'approved' });
      closePopup();
    } catch {
      alert("Failed to add review.");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { 
      id: 'all', 
      label: 'All Testimonials', 
      description: 'Unified view of all client feedback.',
      icon: <LayoutList size={20} />,
      status: `${reviews.length} Total`,
      component: (
        <ReviewList 
          list={reviews} 
          activeSectionId="All" 
          isMobile={isMobile}
          onToggleStatus={toggleStatus} 
          onDelete={deleteReview}
          onAdd={(props) => {
            props.openPopup(<ReviewForm {...props} newReview={newReview} setNewReview={setNewReview} onSave={() => addReview(props.closePopup)} saving={saving} />);
          }}
        />
      )
    },
    { 
      id: 'approved', 
      label: 'Approved', 
      description: 'Feedback currently visible on the live site.',
      icon: <CalendarCheck size={20} />,
      status: 'Live',
      component: (
        <ReviewList 
          list={reviews.filter(r => r.status === 'approved')} 
          activeSectionId="Approved" 
          isMobile={isMobile}
          onToggleStatus={toggleStatus} 
          onDelete={deleteReview}
          onAdd={(props) => {
            props.openPopup(<ReviewForm {...props} newReview={newReview} setNewReview={setNewReview} onSave={() => addReview(props.closePopup)} saving={saving} />);
          }}
        />
      )
    },
    { 
      id: 'pending', 
      label: 'Pending Approval', 
      description: 'New feedback waiting for your review.',
      icon: <Clock size={20} />,
      status: 'Queue',
      component: (
        <ReviewList 
          list={reviews.filter(r => r.status !== 'approved')} 
          activeSectionId="Pending" 
          isMobile={isMobile}
          onToggleStatus={toggleStatus} 
          onDelete={deleteReview}
          onAdd={(props) => {
            props.openPopup(<ReviewForm {...props} newReview={newReview} setNewReview={setNewReview} onSave={() => addReview(props.closePopup)} saving={saving} />);
          }}
        />
      )
    },
    ...[5, 4, 3, 2, 1].map(star => ({
      id: star.toString(),
      label: `${star} Star Reviews`,
      description: `Filtering reviews with exactly ${star} stars.`,
      icon: <Star size={20} />,
      status: 'Filter',
      component: (
        <ReviewList 
          list={reviews.filter(r => r.rating === star)} 
          activeSectionId={`${star} Star`} 
          isMobile={isMobile}
          onToggleStatus={toggleStatus} 
          onDelete={deleteReview}
          onAdd={(props) => {
            props.openPopup(<ReviewForm {...props} newReview={newReview} setNewReview={setNewReview} onSave={() => addReview(props.closePopup)} saving={saving} />);
          }}
        />
      )
    }))
  ];

  const avgRating = reviews.filter(r => r.status === 'approved').length > 0
    ? (reviews.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.filter(r => r.status === 'approved').length).toFixed(1)
    : '0.0';

  if (loading && reviews.length === 0) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Testimonials...</p>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Client Feedback</span>
          <div className="status-value">{reviews.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Reviews</span></div>
          <div className="status-badge">Total</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Star Average</span>
          <div className="status-value">⭐ {avgRating}</div>
          <div className="status-badge">Rating</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Approval Rate</span>
          <div className="status-value">{Math.round((reviews.filter(r => r.status === 'approved').length / reviews.length) * 100 || 0)}%</div>
          <div className="status-badge">Live</div>
        </div>
      </div>

      <AdminMobileLayout 
        title="Reviews"
        description="Curate your best client stories and approve new verified feedback."
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
        onSave={() => {}}
        onDiscard={() => {}}
        isSaving={false}
        hasChanges={true}
      />
    </div>
  );
}

export default ReviewsManager;
