import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToImgBB } from '../../lib/imgbb';
import { useMobile } from '../../hooks/useMobile';
import {
  Plus, Trash2, Loader2, Edit3, Layout
} from 'lucide-react';

// import { StudioDropdown } from './StudioDropdown';
import HubActionPill from './HubActionPill';
import AdminMediaTile from './AdminMediaTile';
import AdminUploadLayout from './AdminUploadLayout';
import AdminAddButton from './AdminAddButton';

function PortfolioManager() {
  const isMobile = useMobile();

  const [items, setItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [originalCategories, setOriginalCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal & Tag States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [draftPhoto, setDraftPhoto] = useState({
    title: "",
    category: "nails",
    image: ""
  });

  // Local popup state for mobile (this component manages its own layout, not AdminMobileLayout)
  const [popup, setPopup] = useState({ isOpen: false, content: null });
  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  useEffect(() => { fetchGallery(); }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'site_content', 'landing_page');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().gallery || {};
        const fetchedItems = data.items || [];
        const rawCats = data.categories || ['nails', 'hair', 'lashes', 'art'];
        const fetchedCats = rawCats.map(cat => ({ 
          id: cat.toLowerCase(), 
          label: cat.charAt(0).toUpperCase() + cat.slice(1) 
        }));

        setItems(fetchedItems);
        setOriginalItems(JSON.parse(JSON.stringify(fetchedItems)));
        setCategories(fetchedCats);
        setOriginalCategories(JSON.parse(JSON.stringify(fetchedCats)));
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveGallery = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_content', 'landing_page');
      await updateDoc(docRef, {
        'gallery.items': items,
        'gallery.categories': categories.filter(c => c.label.trim()).map(c => c.label.toLowerCase())
      });
      setOriginalItems(JSON.parse(JSON.stringify(items)));
      setOriginalCategories(JSON.parse(JSON.stringify(categories)));
      alert("✅ Portfolio updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save changes. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAll = () => {
    setItems(JSON.parse(JSON.stringify(originalItems)));
    setCategories(JSON.parse(JSON.stringify(originalCategories)));
  };

  const addCategoryTag = () => {
    setCategories(prev => [
      ...prev, 
      { 
        id: `new-${Date.now()}`, 
        label: isMobile ? "" : "New Tag", 
        isNew: isMobile 
      }
    ]);
  };

  const updateTagName = (id, newName) => {
    setCategories(prev => prev.map(c => {
      if (c.id === id) {
        const oldLabel = c.label.toLowerCase();
        const newLabel = newName.toLowerCase();
        // Sync items if name changed
        if (oldLabel && oldLabel !== newLabel) {
          setItems(itemsPrev => itemsPrev.map(item => 
            item.category === oldLabel ? { ...item, category: newLabel } : item
          ));
        }
        return { ...c, label: newName, isNew: false };
      }
      return c;
    }));
  };

  const deleteCategoryTag = (id, label) => {
    if (!window.confirm(`Delete "${label}" category and all its photos?`)) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    setItems(prev => prev.filter(item => item.category !== label.toLowerCase()));
  };

  const confirmAddPhoto = (items, closePopupFn) => {
    setItems(prev => {
      const newItems = [...prev];
      if (isEditing) {
        newItems[editingIndex] = items[0];
      } else {
        newItems.push(...items);
      }
      return newItems;
    });

    if (closePopupFn) closePopupFn();
    setIsModalOpen(false);
    setDraftPhoto({ title: "", category: "nails", image: "" });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDeletePhoto = (index) => {
    if (!window.confirm("Remove this photo from your gallery? (Requires saving changes to persist)")) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditPhoto = (item, index) => {
    setIsEditing(true);
    setEditingIndex(index);
    setDraftPhoto({ ...item });

    if (isMobile) {
      openPopup(
        <AdminUploadLayout
          initialItems={[item]}
          itemConfigs={[
            { name: 'title', placeholder: 'Work Title', type: 'text', defaultValue: item.title },
            { name: 'category', placeholder: 'Select Tag', type: 'select', options: categories.map(c => ({ label: c.label, value: c.label.toLowerCase() })), defaultValue: item.category }
          ]}
          onSaveItems={(items) => confirmAddPhoto(items, closePopup)}
          onDiscard={() => {
            closePopup();
            setDraftPhoto({ title: "", category: "nails", image: "" });
            setIsEditing(false);
            setEditingIndex(null);
          }}
          saveLabel="Save Changes"
        />,
        "Edit Portfolio Item"
      );
    } else {
      setIsModalOpen(true);
    }
  };



  const handleDraftUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploadingDraft(true);
    try {
      if (files.length === 1) {
        const url = await uploadToImgBB(files[0]);
        setDraftPhoto(prev => ({ ...prev, image: url }));
      } else {
        const newPhotos = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const url = await uploadToImgBB(file);
          let name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          name = name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          newPhotos.push({
            id: Date.now() + i,
            image: url,
            title: name,
            category: draftPhoto.category || "nails"
          });
        }
        setItems(prev => [...prev, ...newPhotos]);
        setIsModalOpen(false);
        setDraftPhoto({ title: "", category: "nails", image: "" });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload one or more images.");
    } finally {
      setIsUploadingDraft(false);
    }
  };


  const galleryEditorCanvas = (
    <div style={{ display: 'grid', gap: '32px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#4a1a26' }}>Full Portfolio Gallery</h2>
            <p style={{ color: '#8E8484', margin: '8px 0 0' }}>Manage gallery tags and portfolio items in one scrollable page.</p>
          </div>
          <AdminAddButton 
            label="Add New Work"
            onClick={() => {
              setIsEditing(false);
              setDraftPhoto({ title: '', category: draftPhoto.category || 'nails', image: '' });
              setIsModalOpen(true);
            }}
            style={{ borderRadius: '12px' }}
          />
        </div>
      </div>

      <section style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '16px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={20} /> Full Portfolio Gallery
          </h2>
          <button
            onClick={addCategoryTag}
            className="action-btn save"
            style={{ padding: '10px 18px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Add Tag
          </button>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          {categories.map((cat) => (
            <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', padding: '16px', borderRadius: '12px', background: '#f9f9f9' }}>
              <div>
                <input
                  type="text"
                  value={cat.label}
                  onChange={(e) => updateTagName(cat.id, e.target.value)}
                  placeholder="Category label"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e8e8e8', fontSize: '0.95rem', color: '#4a1a26' }}
                />
              </div>
              <button
                onClick={() => deleteCategoryTag(cat.id, cat.label)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e8998e', background: 'transparent', color: '#e8998e', cursor: 'pointer', fontWeight: 700 }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#4a1a26' }}>Portfolio Items</h3>
            <p style={{ margin: '8px 0 0', color: '#8E8484' }}>All portfolio work is visible here. Edit or delete items directly.</p>
          </div>
          <span style={{ fontSize: '0.95rem', color: '#8E8484' }}>{items.length} item{items.length === 1 ? '' : 's'}</span>
        </div>
        <div className={isMobile ? 'amt-2col-grid' : 'hub-field-grid-desktop'}>
          {items.map((item, index) => (
            <div key={index} className={isMobile ? '' : 'hub-field-card hub-hover-group'} style={{ padding: 0, overflow: 'hidden', border: '1.5px solid #F0EFEA', borderRadius: '16px', background: '#fff' }}>
              <div className="item-preview" style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#f5f5f5' }}>
                <img src={item.image} alt={item.title || 'Work'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="reveal-on-hover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(74, 26, 38, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backdropFilter: 'blur(2px)', zIndex: 90 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleEditPhoto(item, index); }} style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a1a26', cursor: 'pointer', zIndex: 99, position: 'relative' }}><Edit3 size={18} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(index); }} style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e53935', cursor: 'pointer', zIndex: 99, position: 'relative' }}><Trash2 size={18} /></button>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#4a1a26' }}>{item.title || 'Untitled'}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8E8484', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const hasChanges = JSON.stringify(items) !== JSON.stringify(originalItems) || 
                     JSON.stringify(categories) !== JSON.stringify(originalCategories);

  if (loading) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="manager-container">
      {/* ── Status Header ── */}
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Live Gallery</span>
          <div className="status-value">{items.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Photos</span></div>
          <div className="status-badge">Display</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Diversity</span>
          <div className="status-value">{new Set(items.map(i => i.category)).size} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Tags</span></div>
          <div className="status-badge">Portfolio</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Cloud Sync</span>
          <div className="status-value">Active</div>
          <div className="status-badge">Success</div>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {hasChanges && (
          <div style={{ marginBottom: '24px' }}>
            <HubActionPill
              onSave={saveGallery}
              onDiscard={handleDiscardAll}
              isSaving={saving}
              saveLabel="Save Changes"
            />
          </div>
        )}
        {galleryEditorCanvas}
      </div>

      {/* ── Studio Upload Modal ── */}
      {isModalOpen && !isMobile && (
        <div className="teaser-modal-overlay">
          <div className="teaser-modal-content" style={{ maxWidth: '600px', padding: '0', background: 'transparent', boxShadow: 'none' }}>
            <AdminUploadLayout
                initialItems={isEditing ? [draftPhoto] : []}
                itemConfigs={[
                  { name: 'title', placeholder: 'Work Title', type: 'text', defaultValue: draftPhoto.title },
                  { name: 'category', placeholder: 'Select Tag', type: 'select', options: categories.map(c => ({ label: c.label, value: c.label.toLowerCase() })), defaultValue: draftPhoto.category }
                ]}
                onSaveItems={(items) => confirmAddPhoto(items)}
                onDiscard={() => setIsModalOpen(false)}
                saveLabel={isEditing ? "Update Project" : "Add to Portfolio"}
             />
          </div>
        </div>
      )}

      {/* ── Fixed Hub Action Bar (Desktop only, if changes exist) ── */}
      {hasChanges && !isMobile && (
        <HubActionPill
          onSave={saveGallery}
          onDiscard={handleDiscardAll}
          isSaving={saving}
          saveLabel="Save Changes"
        />
      )}

      {/* ── Mobile Popup Overlay ── */}
      <div className={`hub-popup-overlay ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
        <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
          {popup.content}
        </div>
      </div>
    </div>
  );
}

export default PortfolioManager;
