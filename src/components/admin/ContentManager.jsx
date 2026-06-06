import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadToImgBB } from '../../lib/imgbb';
import { useMobile } from '../../hooks/useMobile';
import {
  Save, Loader2, Home, Info, Clock, RefreshCcw,
  Image as ImageIcon, Plus, Trash2, ChevronDown, ChevronRight,
  MapPin, Globe, Link as LinkIcon, UploadCloud, Layout, Trash, X,
  AlertTriangle, CheckCircle2
} from 'lucide-react';
import HubActionPill from './HubActionPill';
import AdminMediaTile from './AdminMediaTile';
import AdminUploadLayout from './AdminUploadLayout';
import AdminAddButton from './AdminAddButton';

function SlideForm({ initialItems, onConfirm, closePopup, isMobile, isEditing }) {
  return (
    <div className={isMobile ? "" : "teaser-modal-content"} style={isMobile ? {} : { maxWidth: '600px', padding: '0', background: 'transparent', boxShadow: 'none' }}>
      <AdminUploadLayout 
        initialItems={initialItems}
        itemConfigs={[
          { name: 'heading', placeholder: 'Slide Heading', type: 'text', defaultValue: initialItems[0]?.heading },
          { name: 'subheading', placeholder: 'Support text...', type: 'textarea', defaultValue: initialItems[0]?.subheading }
        ]}
        onSaveItems={onConfirm}
        onDiscard={closePopup}
        saveLabel={isEditing ? "Update Slide" : "Add Slide"}
      />
    </div>
  );
}

// ── Layer 3: Footer Link Form ──
function FooterLinkForm({ onConfirm, closePopup }) {
  const [newLink, setNewLink] = useState({ label: '', href: '' });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', margin: 0 }}>Add Navigation Link</h2>
        <p style={{ color: '#8E8484', marginTop: '4px', fontWeight: 500 }}>Link to an internal page or external site.</p>
      </div>
      <div className="aul-details-section">
        <input className="aul-field" placeholder="Link Label (e.g. Follow on Instagram)" value={newLink.label} onChange={e => setNewLink({...newLink, label: e.target.value})} />
        <input className="aul-field" placeholder="Target URL (e.g. instagram.com/...)" value={newLink.href} onChange={e => setNewLink({...newLink, href: e.target.value})} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="action-btn discard" onClick={closePopup}>Cancel</button>
        <button className="action-btn save" onClick={() => onConfirm(newLink)} disabled={!newLink.label || !newLink.href}>Add Link</button>
      </div>
    </div>
  );
}

// ── Layer 3: Delete Confirmation ──
function DeleteConfirm({ title, message, onConfirm, closePopup }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <AlertTriangle size={32} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: '#8E8484', marginBottom: '24px', fontSize: '0.95rem' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="action-btn discard" style={{ flex: 1 }} onClick={closePopup}>Keep</button>
        <button className="action-btn save" style={{ flex: 1, backgroundColor: '#991B1B' }} onClick={() => { onConfirm(); closePopup(); }}>Yes, Delete</button>
      </div>
    </div>
  );
}

// ── Section Components ──
function HeroSection({ isMobile, data, updateField, updateSlide, uploadingSlide, handleSlideImageUpload, openPopup, closePopup, onAddSlide, onDeleteSlide, setDraftSlide, isUploadingDraft }) {
  return (
    <div className="hub-form-grid">
      {isMobile ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontWeight: 700, color: '#4a1a26', fontSize: '0.9rem' }}>Auto-Rotation</div>
              <label className="hub-switch">
                <input type="checkbox" checked={data.hero?.rotation?.enabled || false} onChange={(e) => updateField('hero', 'rotation', { enabled: e.target.checked })} />
                <span className="hub-slider"></span>
              </label>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <AdminAddButton label="Add Slide" onClick={() => onAddSlide({ openPopup, closePopup })} style={{ padding: '8px 16px', fontSize: '0.8rem' }} />
          </div>
        </>
      ) : (
        <div className="hub-field-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontWeight: 700, color: '#4a1a26' }}>Auto-Rotation</div>
              <label className="hub-switch">
                <input type="checkbox" checked={data.hero?.rotation?.enabled || false} onChange={(e) => updateField('hero', 'rotation', { enabled: e.target.checked })} />
                <span className="hub-slider"></span>
              </label>
            </div>
            <AdminAddButton label="Add Slide" onClick={() => onAddSlide({ openPopup, closePopup })} style={{ padding: '8px 16px', fontSize: '0.8rem' }} />
          </div>
        </div>
      )}
      <div className={isMobile ? "amt-2col-grid" : "hub-field-grid-desktop"}>

        {(data.hero?.slides || []).map((slide, idx) => (
          isMobile ? (
            <AdminMediaTile 
              key={slide.id}
              image={slide.src}
              title={slide.heading}      
              subtitle={slide.subheading}
              status="live"
              onEdit={() => {
                openPopup(<SlideForm 
                  isMobile={isMobile}
                  initialItems={[slide]} 
                  isEditing={true}
                  onConfirm={(items) => {
                    updateSlide(idx, 'heading', items[0].heading);
                    updateSlide(idx, 'subheading', items[0].subheading);
                    if (items[0].image) updateSlide(idx, 'src', items[0].image);
                    closePopup();
                  }}
                  closePopup={closePopup} 
                />);
              }}
              onDelete={() => onDeleteSlide(slide, { openPopup, closePopup })}
            />
          ) : (
            <div key={slide.id} className="slide-card-hub hub-hover-group">
              <div className="slide-image-preview-hub">
                {slide.src ? <img src={slide.src} alt="" /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><ImageIcon size={32} /></div>}
                <label className="upload-pill">
                  {uploadingSlide === idx ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                  <span>{slide.src ? 'Replace' : 'Upload'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSlideImageUpload(e, idx)} />
                </label>
                <button type="button" onClick={() => onDeleteSlide(slide, { openPopup, closePopup })} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e53935', cursor: 'pointer', zIndex: 10 }}><Trash2 size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input className="hub-input" style={{ fontSize: '1.2rem', fontWeight: 700 }} value={slide.heading || ''} placeholder="Slide Heading" onChange={(e) => updateSlide(idx, 'heading', e.target.value)} />
                <textarea className="hub-textarea" value={slide.subheading || ''} placeholder="Hero subheading text..." onChange={(e) => updateSlide(idx, 'subheading', e.target.value)} rows={2} />
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function FooterSection({ data, updateField, updateFooterLink, addFooterLink, deleteFooterLink, openPopup, closePopup }) {
  return (
    <div className="hub-form-grid">
      <div className="hub-field-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="input-field">
            <label className="field-label"><span>Copyright</span></label>
            <input className="hub-input" value={data?.footer?.copyright || ''} onChange={(e) => updateField('footer', 'copyright', e.target.value)} />
          </div>
          <div className="input-field">
            <label className="field-label"><span>Language</span></label>
            <input className="hub-input" value={data?.footer?.language || ''} onChange={(e) => updateField('footer', 'language', e.target.value)} />
          </div>
        </div>
      </div>
      {(data?.footer?.navColumns || [])
        .filter(col => !['navigation', 'legal'].includes(col.title?.toLowerCase()))
        .map((col, colIdx) => (
        <div key={colIdx} className="hub-field-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontWeight: 800, color: '#4a1a26' }}>{col.title}</h4>
            <AdminAddButton label="Link" onClick={() => openPopup(<FooterLinkForm closePopup={closePopup} onConfirm={(link) => { addFooterLink(colIdx, link); closePopup(); }} />)} style={{ padding: '6px 14px', fontSize: '0.75rem' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {col.links.map((link, linkIdx) => (
              <div key={linkIdx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', backgroundColor: '#f9f7f2', borderRadius: '12px' }}>
                <input className="hub-input" style={{ border: 'none', background: 'transparent', flex: 1 }} value={link.label || ''} onChange={(e) => updateFooterLink(colIdx, linkIdx, 'label', e.target.value)} />
                <input className="hub-input" style={{ border: 'none', background: 'transparent', flex: 1.5, opacity: link.isStatic ? 0.4 : 1 }} value={link.href || ''} readOnly={link.isStatic} onChange={(e) => updateFooterLink(colIdx, linkIdx, 'href', e.target.value)} />
                <button onClick={() => openPopup(<DeleteConfirm title="Delete Link?" message={`Remove "${link.label}" from footer?`} onConfirm={() => deleteFooterLink(colIdx, linkIdx)} closePopup={closePopup} />)} style={{ border: 'none', background: 'transparent', color: '#e53935', cursor: 'pointer', padding: '4px' }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentManager() {
  const isMobile = useMobile();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState(null);
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);
  const [draftSlide, setDraftSlide] = useState({ heading: "", subheading: "", src: "" });
  const [popup, setPopup] = useState({ isOpen: false, content: null });

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        if (rawData.hero?.slides) {
          rawData.hero.slides = rawData.hero.slides.map((s, i) => ({
            ...s, id: s.id || `slide-${Date.now()}-${i}`
          }));
        }
        setData(rawData);
      }
    } catch (err) {
      console.error("Error fetching content:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section, field, value) => {
    setData(prev => ({
      ...prev, [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'site_content', 'landing_page'), data);
      alert("✅ Site content updated successfully!");
    } catch {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const updateSlide = (index, field, value) => {
    setData(prev => {
      const slides = [...(prev.hero?.slides || [])];
      slides[index] = { ...slides[index], [field]: value };
      return { ...prev, hero: { ...prev.hero, slides } };
    });
  };

  const handleSlideImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingSlide(index);
    try {
      const url = await uploadToImgBB(file);
      updateSlide(index, 'src', url);
    } catch {
      alert("Image upload failed.");
    } finally {
      setUploadingSlide(null);
    }
  };

  const handleDraftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingDraft(true);
    try {
      const url = await uploadToImgBB(file);
      setDraftSlide(prev => ({ ...prev, src: url }));
    } catch {
      alert("Upload failed.");
    } finally {
      setIsUploadingDraft(false);
    }
  };

  const confirmAddSlide = (items, closePopup) => {
    setData(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        slides: [...(prev.hero?.slides || []), ...items.map(i => ({ ...i, src: i.image }))]
      }
    }));
    closePopup();
  };

  const deleteSlide = (slideId) => {
    setData(prev => ({
      ...prev,
      hero: { ...prev.hero, slides: prev.hero.slides.filter(s => s.id !== slideId) }
    }));
  };

  const updateHour = (index, field, value) => {
    setData(prev => {
      const hours = [...(prev.about?.hours || [])];
      hours[index] = { ...hours[index], [field]: value };
      return { ...prev, about: { ...prev.about, hours } };
    });
  };

  const updateFooterLink = (colIdx, linkIdx, field, value) => {
    setData(prev => {
      const cols = [...(prev.footer?.navColumns || [])];
      const links = [...cols[colIdx].links];
      links[linkIdx] = { ...links[linkIdx], [field]: value };
      cols[colIdx] = { ...cols[colIdx], links };
      return { ...prev, footer: { ...prev.footer, navColumns: cols } };
    });
  };

  const addFooterLink = (colIdx, link) => {
    setData(prev => {
      const cols = [...(prev.footer?.navColumns || [])];
      cols[colIdx] = { ...cols[colIdx], links: [...cols[colIdx].links, link] };
      return { ...prev, footer: { ...prev.footer, navColumns: cols } };
    });
  };

  const deleteFooterLink = (colIdx, linkIdx) => {
    setData(prev => {
      const cols = [...(prev.footer?.navColumns || [])];
      cols[colIdx] = { ...cols[colIdx], links: cols[colIdx].links.filter((_, i) => i !== linkIdx) };
      return { ...prev, footer: { ...prev.footer, navColumns: cols } };
    });
  };

  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#8E8484', fontWeight: 600 }}>Loading Site Content...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Hero Slider */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#4a1a26' }}>Hero Slider</h3>
        <p style={{ fontSize: '0.9rem', color: '#8E8484', marginBottom: '24px' }}>Manage landing page visual sliders and auto-rotation.</p>
        <HeroSection 
          isMobile={isMobile}
          data={data} 
          updateField={updateField} 
          updateSlide={updateSlide} 
          uploadingSlide={uploadingSlide} 
          handleSlideImageUpload={handleSlideImageUpload}
          setDraftSlide={setDraftSlide}
          isUploadingDraft={isUploadingDraft}
          openPopup={openPopup}
          closePopup={closePopup}
          onAddSlide={(props) => {
            openPopup(<SlideForm {...props} isMobile={isMobile} initialItems={[]} isEditing={false} onConfirm={(items) => confirmAddSlide(items, closePopup)} />);
          }}
          onDeleteSlide={(slide, props) => {
            openPopup(<DeleteConfirm title="Delete Slide?" message={`Remove the slide "${slide.heading}" permanently?`} onConfirm={() => deleteSlide(slide.id)} closePopup={closePopup} />);
          }}
        />
      </div>

      {/* Brand & Story */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#4a1a26' }}>Brand & Story</h3>
        <p style={{ fontSize: '0.9rem', color: '#8E8484', marginBottom: '24px' }}>Define your studio identity and brand messaging.</p>
        <div className="hub-form-grid">
          <div className="hub-field-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div className="input-field">
                <label className="field-label"><span>Brand Name</span></label>
                <input className="hub-input" value={data?.brand?.name || ''} onChange={(e) => updateField('brand', 'name', e.target.value)} />
              </div>
              <div className="input-field">
                <label className="field-label"><span>Logo Text</span></label>
                <input className="hub-input" value={data?.brand?.logo || ''} onChange={(e) => updateField('brand', 'logo', e.target.value)} />
              </div>
            </div>
            <div className="input-field" style={{ marginBottom: '24px' }}>
              <label className="field-label"><span>Tagline</span></label>
              <input className="hub-input" value={data?.brand?.tagline || ''} onChange={(e) => updateField('brand', 'tagline', e.target.value)} />
            </div>
            <div className="input-field">
              <label className="field-label"><span>Studio Bio</span></label>
              <textarea className="hub-textarea" value={data?.brand?.bio || ''} onChange={(e) => updateField('brand', 'bio', e.target.value)} rows={6} />
            </div>
          </div>
        </div>
      </div>

      {/* About & Hours */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#4a1a26' }}>About & Hours</h3>
        <p style={{ fontSize: '0.9rem', color: '#8E8484', marginBottom: '24px' }}>Update location, description, and operating hours.</p>
        <div className="hub-form-grid">
          <div className="hub-field-card" style={{ marginBottom: '24px' }}>
            <div className="input-field" style={{ marginBottom: '24px' }}>
              <label className="field-label"><span>About Description</span></label>
              <textarea className="hub-textarea" value={data?.about?.description || ''} onChange={(e) => updateField('about', 'description', e.target.value)} rows={4} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="input-field">
                <label className="field-label"><span>Address</span></label>
                <input className="hub-input" value={data?.about?.address || ''} onChange={(e) => updateField('about', 'address', e.target.value)} />
              </div>
              <div className="input-field">
                <label className="field-label"><span>Maps URL</span></label>
                <input className="hub-input" value={data?.about?.directionsUrl || ''} onChange={(e) => updateField('about', 'directionsUrl', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="hub-field-card">
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: '#4a1a26' }}>Opening Hours</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(data?.about?.hours || []).map((day, idx) => (
                <div key={idx} className="hour-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ fontWeight: 700, minWidth: '100px' }}>{day.name}</span>
                  <input className="hub-input" style={{ border: 'none', background: 'transparent' }} value={day.hours || ''} onChange={(e) => updateHour(idx, 'hours', e.target.value)} />
                  <label className="toggle-row" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="hub-switch">
                      <input type="checkbox" checked={day.isOpen} onChange={(e) => updateHour(idx, 'isOpen', e.target.checked)} />
                      <span className="hub-slider"></span>
                    </label>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{day.isOpen ? 'Open' : 'Closed'}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Links */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#4a1a26' }}>Footer & Links</h3>
        <p style={{ fontSize: '0.9rem', color: '#8E8484', marginBottom: '24px' }}>Manage site footer navigation and external links.</p>
        <FooterSection 
          data={data} 
          updateField={updateField} 
          updateFooterLink={updateFooterLink} 
          addFooterLink={addFooterLink} 
          deleteFooterLink={deleteFooterLink} 
          openPopup={openPopup}
          closePopup={closePopup}
        />
      </div>

      {/* Popup Modal */}
      {popup.isOpen && (
        <div className={`hub-popup-overlay ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
          <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
            {popup.content}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentManager;
