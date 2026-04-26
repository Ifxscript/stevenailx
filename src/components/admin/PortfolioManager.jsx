import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToImgBB } from '../../lib/imgbb';
import { useMobile } from '../../hooks/useMobile';
import {
  Plus, Trash2, Loader2, UploadCloud, Save,
  Edit3, Check, X, ChevronRight, ChevronDown,
  Search, Image as ImageIcon, Layout
} from 'lucide-react';

import { StudioDropdown } from './StudioDropdown';
import HubActionPill from './HubActionPill';
import AdminMediaTile from './AdminMediaTile';
import AdminUploadLayout from './AdminUploadLayout';
import AdminMobileLayoutWithDropdown from './AdminMobileLayoutWithDropdown';
import AdminAddButton from './AdminAddButton';
import AdminSectionDescription from './AdminSectionDescription';

const InlineCategoryDropdown = ({ value, options, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      <button 
        className="aul-field" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span style={{ textTransform: 'capitalize' }}>{localValue || placeholder}</span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9e9690' }} />
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: '#FFFBF7',
          borderRadius: '14px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          border: '1px solid #F0EFEA',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {options.map((opt, i) => {
            const isSelected = localValue?.toLowerCase() === opt.toLowerCase();
            return (
              <button
                key={opt}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocalValue(opt);
                  onSelect(opt);
                  setIsOpen(false);
                }}
                type="button"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: isSelected ? 'rgba(139, 29, 65, 0.05)' : 'transparent',
                  color: isSelected ? '#8B1D41' : '#4a1a26',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.95rem',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid #F0EFEA' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{opt}</span>
                {isSelected && <Check size={16} color="#8B1D41" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

function PortfolioManager() {
  const isMobile = useMobile();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['nails', 'hair', 'lashes', 'art']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState({ type: 'category', id: 'all' });


  // Modal & Tag States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
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
        setItems(data.items || []);
        setCategories(data.categories || ['nails', 'hair', 'lashes', 'art']);
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
        'gallery.categories': categories
      });
      alert("✅ Portfolio updated successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save changes. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    const cleanTag = newTagName.trim().toLowerCase();
    if (categories.includes(cleanTag)) {
      alert("This tag already exists.");
      return;
    }

    setCategories(prev => [...prev, cleanTag]);
    setNewTagName("");
    setIsAddingTag(false);
  };

  const confirmAddPhoto = (closePopupFn) => {
    if (!draftPhoto.image) return;

    if (isEditing) {
      setItems(prev => {
        const newItems = [...prev];
        newItems[editingIndex] = { ...draftPhoto };
        return newItems;
      });
    } else {
      setItems(prev => [...prev, { ...draftPhoto, id: Date.now() }]);
    }

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
          initialImage={item.image}
          onUploadSuccess={(url) => setDraftPhoto(prev => ({ ...prev, image: url }))}
          onSave={() => confirmAddPhoto(closePopup)}
          onDiscard={() => {
            closePopup();
            setDraftPhoto({ title: "", category: "nails", image: "" });
            setIsEditing(false);
            setEditingIndex(null);
          }}
          saveLabel="Save Changes"
          isSaving={saving}
        >
            <InlineCategoryDropdown
              value={item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
              options={categories.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
              onSelect={(cat) => {
                setDraftPhoto(prev => ({ ...prev, category: cat.toLowerCase() }));
                const inputEl = document.getElementById('hidden-category-input');
                if (inputEl) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                  nativeInputValueSetter.call(inputEl, cat.toLowerCase());
                  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              placeholder="Select Tag"
            />
            <input type="text" name="category" id="hidden-category-input" style={{ display: 'none' }} defaultValue={item.category || 'nails'} />
        </AdminUploadLayout>,
        "Edit Portfolio Item"
      );
    } else {
      setIsModalOpen(true);
    }
  };



  const handleDraftUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingDraft(true);
    try {
      const url = await uploadToImgBB(file);
      setDraftPhoto(prev => ({ ...prev, image: url }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploadingDraft(false);
    }
  };


  const filteredItems = activeSection.id === 'all'
    ? items.map((item, index) => ({ ...item, globalIndex: index }))
    : items.map((item, index) => ({ ...item, globalIndex: index })).filter(item => item.category === activeSection.id);

  const portfolioEditorCanvas = (
    <div className="hub-form-grid">
      {isMobile ? (
        <>
          <AdminSectionDescription text="Curate your professional gallery and cloud-hosted artwork." />
          <div style={{ marginBottom: '16px' }}>
            <AdminAddButton 
              label="Add New Work"
              onClick={() => {
                openPopup(
                  <AdminUploadLayout
                    initialImage={null}
                    onUploadSuccess={(url) => setDraftPhoto(prev => ({ ...prev, image: url }))}
                    onSave={() => confirmAddPhoto(closePopup)}
                    onDiscard={() => {
                      closePopup();
                      setDraftPhoto({ title: "", category: "nails", image: "" });
                    }}
                    saveLabel="Add to Portfolio"
                    isSaving={saving}
                  >
                      <InlineCategoryDropdown
                        value={draftPhoto.category.charAt(0).toUpperCase() + draftPhoto.category.slice(1)}
                        options={categories.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
                        onSelect={(cat) => {
                          setDraftPhoto({ ...draftPhoto, category: cat.toLowerCase() });
                          const inputEl = document.getElementById('hidden-category-input');
                          if (inputEl) {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                            nativeInputValueSetter.call(inputEl, cat.toLowerCase());
                            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                          }
                        }}
                        placeholder="Select Tag"
                      />
                      <input type="text" name="category" id="hidden-category-input" style={{ display: 'none' }} defaultValue={draftPhoto.category || 'nails'} />
                  </AdminUploadLayout>,
                  "Add to Portfolio"
                );
              }}
              style={{ borderRadius: '12px' }}
            />
          </div>
          <div className="amt-2col-grid">
            {filteredItems.map((item) => (
              <AdminMediaTile
                key={item.globalIndex}
                image={item.image}
                subtitle={item.category}
                onEdit={() => handleEditPhoto(item, item.globalIndex)}
                onDelete={() => handleDeletePhoto(item.globalIndex)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ textTransform: 'capitalize' }}>{activeSection.id} Portfolio</h2>
            <p>Curate your professional gallery and cloud-hosted artwork.</p>
          </div>
          <AdminAddButton 
            label="Add New Work"
            onClick={() => {
              setIsEditing(false);
              setDraftPhoto({ title: "", category: "nails", image: "" });
              setIsModalOpen(true);
            }}
            style={{ borderRadius: '12px' }}
          />
        </div>
      )}

      {!isMobile && (
        <div className="hub-field-grid-desktop">
          {filteredItems.map((item) => (
            <div key={item.globalIndex} className="hub-field-card hub-hover-group" style={{ padding: '0', overflow: 'hidden', border: '1.5px solid #F0EFEA' }}>
              <div className="item-preview" style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#f5f5f5' }}>
                <img src={item.image} alt="Work" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="reveal-on-hover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(74, 26, 38, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', backdropFilter: 'blur(2px)', zIndex: 90 }}>
                  <button onClick={(e) => { e.stopPropagation(); handleEditPhoto(item, item.globalIndex); }} style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a1a26', cursor: 'pointer', zIndex: 99, position: 'relative' }}><Edit3 size={18} /></button>

                  <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(item.globalIndex); }} style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e53935', cursor: 'pointer', zIndex: 99, position: 'relative' }}><Trash2 size={18} /></button>
                </div>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#4a1a26' }}>{item.title || 'Untitled'}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8E8484', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.category}</span>
                  </div>
                  <ChevronRight size={16} color="#E0DCD0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const portfolioSections = [
    {
      id: 'all',
      label: 'All Portfolio',
      icon: <Layout size={20} />,
      component: portfolioEditorCanvas
    },
    {
      id: 'categories',
      label: 'Gallery Tags',
      icon: <ImageIcon size={20} />,
      onAdd: () => setIsAddingTag(true),
      children: categories.map(cat => ({
        id: cat.toLowerCase(),
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        component: portfolioEditorCanvas
      }))
    }
  ];

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

      {/* ── Desktop Layout ── */}
      {!isMobile && (
        <div className="hub-main-layout">
          {/* ── Sidebar ── */}
          <aside className="hub-sidebar" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8E8484', textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: '12px', marginBottom: '4px' }}>Gallery Categories</span>
              <StudioDropdown
                label="Portfolio Filter"
                value={activeSection.id === 'all' ? 'All' : activeSection.id.charAt(0).toUpperCase() + activeSection.id.slice(1)}
                options={['All', ...categories.map(c => c.charAt(0).toUpperCase() + c.slice(1))]}
                icon={Layout}
                onSelect={(cat) => setActiveSection({ type: 'category', id: cat.toLowerCase() })}
                onAdd={() => setIsAddingTag(!isAddingTag)}
                mode="accordion"
              />

              {isAddingTag && (
                <div style={{ padding: '12px', background: '#fff', borderRadius: '16px', marginTop: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #F0EFEA' }}>
                  <input
                    className="hub-input"
                    placeholder="New tag name..."
                    autoFocus
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="action-btn save" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }} onClick={handleAddTag}>Add</button>
                    <button className="action-btn discard" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }} onClick={() => setIsAddingTag(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Editor Canvas ── */}
          <main className="hub-editor-card">
            {portfolioEditorCanvas}
          </main>
        </div>
      )}

      {/* ── Mobile Layout ── */}
      <AdminMobileLayoutWithDropdown
        sections={portfolioSections}
        activeSectionId={activeSection.id}
        onSectionChange={(id) => {
          if (id === 'all') setActiveSection({ type: 'category', id: 'all' });
          else if (id && id !== 'categories') setActiveSection({ type: 'category', id });
        }}
        onSave={saveGallery}
        onDiscard={fetchGallery}
        isSaving={saving}
        hasChanges={true}
      />

      {/* ── Studio Upload Modal ── */}
      {isModalOpen && !isMobile && (
        <div className="teaser-modal-overlay">
          <div className="teaser-modal-content" style={{ maxWidth: '900px', padding: '40px' }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4a1a26', margin: 0 }}>{isEditing ? 'Edit Project' : 'Add New Work'}</h2>
                <p style={{ color: '#8E8484', marginTop: '4px', fontWeight: 500 }}>{isEditing ? 'Update your portfolio details and cloud-hosted artwork.' : 'Upload your latest artwork to your live gallery.'}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#F9F7F2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4a1a26' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="teaser-modal-grid">
              {/* Left: Square Symmetry Preview */}
              <div className="teaser-image-section">
                {draftPhoto.image ? (
                  <div style={{ width: '100%', aspectRatio: '1/1', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                    <img src={draftPhoto.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <label style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700, color: '#4a1a26', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <input type="file" className="hidden" onChange={handleDraftUpload} accept="image/*" />
                      <UploadCloud size={14} />
                      <span>{isEditing ? 'Exchange Image' : 'Change Image'}</span>
                    </label>
                  </div>
                ) : (
                  <label className="teaser-upload-placeholder" style={{ aspectRatio: '1/1' }}>
                    <input type="file" className="hidden" onChange={handleDraftUpload} accept="image/*" />
                    {isUploadingDraft ? <Loader2 className="animate-spin" size={32} /> : <UploadCloud size={32} />}
                    <span style={{ marginTop: '12px', fontWeight: 600 }}>Select Work</span>
                  </label>
                )}
              </div>

              {/* Right: High-Density Details */}
              <div className="teaser-form-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <input
                    className="hub-input"
                    placeholder="Work Title (e.g. Artistic French...)"
                    value={draftPhoto.title}
                    onChange={(e) => setDraftPhoto(prev => ({ ...prev, title: e.target.value }))}
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="input-field">
                      <label className="field-label"><span>Gallery Tag</span></label>
                      <StudioDropdown
                        value={draftPhoto.category.charAt(0).toUpperCase() + draftPhoto.category.slice(1)}
                        options={categories.map(c => c.charAt(0).toUpperCase() + c.slice(1))}
                        onSelect={(cat) => setDraftPhoto({ ...draftPhoto, category: cat.toLowerCase() })}
                        placeholder="Select Tag"
                        mode="menu"
                        allowSearch={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Command Pill */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                  <div className="hub-action-pill" style={{ background: '#4a1a26', padding: '6px' }}>
                    <button className="action-pill-btn" onClick={() => setIsModalOpen(false)} style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                      <X size={20} color="#fff" />
                    </button>
                    <button className="action-pill-btn" onClick={confirmAddPhoto} disabled={uploading}>
                      {uploading ? <Loader2 className="animate-spin" size={20} color="#fff" /> : <Save size={20} color="#fff" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Hub Action Bar ── */}
      <HubActionPill
        onSave={saveGallery}
        onDiscard={fetchGallery}
        isSaving={saving}
        hasChanges={true}
        saveLabel="Save Changes"
      />

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
