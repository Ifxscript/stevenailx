import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { uploadToImgBB } from '../../lib/imgbb';
import {
  Save, Plus, Trash2, Loader2,
  ChevronRight, ChevronDown, UploadCloud,
  Image as ImageIcon, Sparkles,
  Scissors, Layout, Trash, X, Check
} from 'lucide-react';

import '../../styles/AdminHub.css';

import { NavPill, StudioDropdown } from './StudioDropdown';
import HubActionPill from './HubActionPill';
import AdminMediaTile from './AdminMediaTile';
import AdminUploadLayout from './AdminUploadLayout';
import AdminMobileLayoutWithDropdown from './AdminMobileLayoutWithDropdown';
import AdminAddButton from './AdminAddButton';
import AdminDeleteSectionButton from './AdminDeleteSectionButton';
import AdminSectionDescription from './AdminSectionDescription';
import { useMobile } from '../../hooks/useMobile';

function ServicesManager() {
  const isMobile = useMobile();
  const [catalog, setCatalog] = useState(null);
  const [originalCatalog, setOriginalCatalog] = useState(null);
  const [teaserItems, setTeaserItems] = useState([]);
  const [originalTeaserItems, setOriginalTeaserItems] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [originalOtherItems, setOriginalOtherItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingTeaser, setUploadingTeaser] = useState(null);
  const [activeSection, setActiveSection] = useState({ type: 'teasers' });
  const [expandedSectors, setExpandedSectors] = useState({ 'nails-root': true });
  const [isTeaserModalOpen, setIsTeaserModalOpen] = useState(false);
  const [isUploadingTeaserDraft, setIsUploadingTeaserDraft] = useState(false);
  const [teaserListType, setTeaserListType] = useState('main'); // 'main' or 'other'
  const [draftTeaser, setDraftTeaser] = useState({
    title: "",
    description: "",
    image: ""
  });

  // Local popup state for mobile (this component manages its own sidebar layout)
  const [popup, setPopup] = useState({ isOpen: false, content: null });
  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "services"));
      const catData = {};
      querySnapshot.forEach(d => {
        const docData = d.data();
        if (docData.services) {
          docData.services = docData.services.map((s, si) => ({
            ...s,
            id: s.id || `sector-${si}-${Date.now()}`,
            sections: (s.sections || []).map((sec, seci) => ({
              ...sec,
              id: sec.id || `group-${seci}-${Date.now()}`
            }))
          }));
        }
        catData[d.id] = docData;
      });
      setCatalog(catData);
      setOriginalCatalog(JSON.parse(JSON.stringify(catData)));

      const pageSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
      if (pageSnap.exists()) {
        const pageData = pageSnap.data();
        const tItems = pageData.services?.items || [];
        const oItems = pageData.services?.otherItems || [];
        setTeaserItems(tItems);
        setOriginalTeaserItems([...tItems]);
        setOtherItems(oItems);
        setOriginalOtherItems([...oItems]);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Teaser Card CRUD ──
  const updateTeaser = (list, setList, index, field, value) => {
    setList(prev => {
      const items = [...prev];
      items[index] = { ...items[index], [field]: value };
      return items;
    });
  };

  const openTeaserModal = (listType) => {
    setTeaserListType(listType);
    const emptyTeaser = {
      title: "",
      description: "",
      image: ""
    };
    setDraftTeaser(emptyTeaser);

    if (isMobile) {
      openPopup(
        <AdminUploadLayout
          initialImage={null}
          onUploadSuccess={(url) => setDraftTeaser(prev => ({ ...prev, image: url }))}
          onSave={() => {
            const newItem = { ...emptyTeaser, image: draftTeaser.image, title: draftTeaser.title, description: draftTeaser.description, id: Date.now() };
            if (listType === 'main') setTeaserItems(prev => [...prev, newItem]);
            else setOtherItems(prev => [...prev, newItem]);
            closePopup();
          }}
          onDiscard={closePopup}
          saveLabel="Add Teaser"
          isSaving={saving}
        >
          <input
            className="aul-field"
            placeholder="Service Title (e.g. Master Manicures)"
            value={draftTeaser.title}
            onChange={(e) => setDraftTeaser(prev => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="aul-field"
            style={{ height: '120px' }}
            placeholder="Brief Description..."
            value={draftTeaser.description}
            onChange={(e) => setDraftTeaser(prev => ({ ...prev, description: e.target.value }))}
          />
        </AdminUploadLayout>,
        "Add Teaser Card"
      );
    } else {
      setIsTeaserModalOpen(true);
    }
  };

  const confirmAddTeaser = () => {
    const newItem = { ...draftTeaser, id: Date.now() };
    if (teaserListType === 'main') {
      setTeaserItems(prev => [...prev, newItem]);
    } else {
      setOtherItems(prev => [...prev, newItem]);
    }
    setIsTeaserModalOpen(false);
  };

  const handleTeaserDraftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingTeaserDraft(true);
    try {
      const url = await uploadToImgBB(file);
      setDraftTeaser(prev => ({ ...prev, image: url }));
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploadingTeaserDraft(false);
    }
  };

  const deleteTeaser = (list, setList, index) => {
    setList(prev => prev.filter((_, i) => i !== index));
  };

  const handleTeaserImageUpload = async (e, list, setList, index) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingTeaser(`${list === teaserItems ? 'main' : 'other'}-${index}`);
    try {
      const url = await uploadToImgBB(file);
      updateTeaser(list, setList, index, 'image', url);
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingTeaser(null);
    }
  };



  const isTabActive = (type, catId, sIdx, secIdx = null) => {
    if (type === 'teasers') return activeSection.type === 'teasers';
    if (type === 'category') return activeSection.type === 'category' && activeSection.catId === catId;
    const isSector = activeSection.type === 'sector' && activeSection.catId === catId && activeSection.sIdx === sIdx;
    if (secIdx !== null) return isSector && activeSection.secIdx === secIdx;
    return isSector && (activeSection.secIdx === null || activeSection.secIdx === undefined);
  };



  // ── Catalog Price List CRUD ──
  const handleUpdateItem = (categoryId, serviceIdx, sectionIdx, itemId, field, value) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      const category = { ...newCatalog[categoryId] };
      const services = [...category.services];
      const service = { ...services[serviceIdx] };
      const sections = [...service.sections];
      const section = { ...sections[sectionIdx] };
      const items = [...section.items];
      const itemIdx = items.findIndex(i => i.id === itemId);
      if (itemIdx !== -1) {
        items[itemIdx] = { ...items[itemIdx], [field]: value };
        section.items = items;
        sections[sectionIdx] = section;
        service.sections = sections;
        services[serviceIdx] = service;
        category.services = services;
        newCatalog[categoryId] = category;
      }
      return newCatalog;
    });
  };

  const handleDeleteItem = (categoryId, serviceIdx, sectionIdx, itemId) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      const category = { ...newCatalog[categoryId] };
      const services = [...category.services];
      const service = { ...services[serviceIdx] };
      const sections = [...service.sections];
      const section = { ...sections[sectionIdx] };
      section.items = section.items.filter(i => i.id !== itemId);
      sections[sectionIdx] = section;
      service.sections = sections;
      services[serviceIdx] = service;
      category.services = services;
      newCatalog[categoryId] = category;
      return newCatalog;
    });
  };

  const handleAddItem = (categoryId, serviceIdx, sectionIdx) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      const category = { ...newCatalog[categoryId] };
      const services = [...category.services];
      const service = { ...services[serviceIdx] };
      const sections = [...service.sections];
      const section = { ...sections[sectionIdx] };
      section.items = [...section.items, { id: Date.now(), name: "New Service", price: "0" }];
      sections[sectionIdx] = section;
      service.sections = sections;
      services[serviceIdx] = service;
      category.services = services;
      newCatalog[categoryId] = category;
      return newCatalog;
    });
  };

  // ── Structural CRUD (Categories & Sections) ──

  const addCategory = (catId) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      const category = { ...newCatalog[catId] };
      const services = [...(category.services || [])];
      services.push({
        category: isMobile ? "" : "New Sector",
        isNew: isMobile,
        sections: [{ title: "General", items: [] }]
      });
      category.services = services;
      newCatalog[catId] = category;
      return newCatalog;
    });
  };

  const updateCategoryName = (catId, sIdx, name) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      if (!newCatalog[catId]?.services[sIdx]) return prev;
      newCatalog[catId].services[sIdx].category = name;
      if (newCatalog[catId].services[sIdx].isNew) {
        delete newCatalog[catId].services[sIdx].isNew;
      }
      return { ...newCatalog };
    });
  };

  const deleteCategory = (catId, sIdx) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      newCatalog[catId].services = newCatalog[catId].services.filter((_, i) => i !== sIdx);
      return { ...newCatalog };
    });
    setActiveSection({ type: 'teasers' });
  };

  const updateSectionTitle = (catId, sIdx, secIdx, title) => {
    setCatalog(prev => {
      if (!prev[catId]?.services[sIdx]?.sections[secIdx]) return prev;
      const newCatalog = { ...prev };
      newCatalog[catId].services[sIdx].sections[secIdx].title = title;
      if (newCatalog[catId].services[sIdx].sections[secIdx].isNew) {
        delete newCatalog[catId].services[sIdx].sections[secIdx].isNew;
      }
      return { ...newCatalog };
    });
  };

  const addSection = (catId, sIdx) => {
    setCatalog(prev => {
      const newCatalog = { ...prev };
      const category = { ...newCatalog[catId] };
      const services = [...(category.services || [])];
      const service = { ...services[sIdx] };
      const sections = [...(service.sections || [])];
      sections.push({ title: isMobile ? "" : "New Group", isNew: isMobile, items: [] });
      service.sections = sections;
      services[sIdx] = service;
      category.services = services;
      newCatalog[catId] = category;
      return newCatalog;
    });
  };

  const deleteSection = (catId, sIdx, secIdx) => {
    try {
      setCatalog(prev => {
        if (!prev[catId]?.services[sIdx]) return prev;
        const newCatalog = { ...prev };
        const category = { ...newCatalog[catId] };
        const services = [...category.services];
        const service = { ...services[sIdx] };
        const sections = (service.sections || []).filter((_, i) => i !== secIdx);

        service.sections = sections;
        services[sIdx] = service;
        category.services = services;
        newCatalog[catId] = category;
        return newCatalog;
      });
      setActiveSection(prev => ({ ...prev, secIdx: null }));
    } catch (err) {
      console.error("Delete section failed:", err);
    }
  };



  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const catId in catalog) {
        if (JSON.stringify(catalog[catId]) !== JSON.stringify(originalCatalog[catId])) {
          await setDoc(doc(db, "services", catId), catalog[catId]);
        }
      }
      if (JSON.stringify(teaserItems) !== JSON.stringify(originalTeaserItems) || 
          JSON.stringify(otherItems) !== JSON.stringify(originalOtherItems)) {
        await updateDoc(doc(db, 'site_content', 'landing_page'), {
          'services.items': teaserItems,
          'services.otherItems': otherItems
        });
      }
      setOriginalCatalog(JSON.parse(JSON.stringify(catalog)));
      setOriginalTeaserItems([...teaserItems]);
      setOriginalOtherItems([...otherItems]);
      alert("✅ All changes saved!");
    } catch (err) {
      console.error("Save all failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAll = () => {
    setCatalog(JSON.parse(JSON.stringify(originalCatalog)));
    setTeaserItems([...originalTeaserItems]);
    setOtherItems([...originalOtherItems]);
  };

  if (loading || !catalog) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Services Hub...</p>
      </div>
    );
  }

  const nailServiceCount = catalog.nails?.services?.reduce((acc, cat) => acc + (cat.sections || []).reduce((sAcc, sec) => sAcc + (sec.items || []).length, 0), 0) || 0;
  const salonServiceCount = catalog.salon?.services?.reduce((acc, cat) => acc + (cat.sections || []).reduce((sAcc, sec) => sAcc + (sec.items || []).length, 0), 0) || 0;


  const getActiveSectionId = () => {
    if (activeSection.type === 'teasers') return 'teasers';
    if (activeSection.type === 'category') return activeSection.catId;
    if (activeSection.type === 'sector') {
      if (activeSection.secIdx !== null && activeSection.secIdx !== undefined) {
        return `${activeSection.catId}-${activeSection.sIdx}-${activeSection.secIdx}`;
      }
      return `${activeSection.catId}-${activeSection.sIdx}`;
    }
    return null;
  };

  const handleMobileSectionChange = (id) => {
    if (!id) return;
    if (id === 'teasers') setActiveSection({ type: 'teasers' });
    else if (id === 'nails') setActiveSection({ type: 'category', catId: 'nails' });
    else if (id.startsWith('nails-')) {
      const parts = id.split('-');
      setActiveSection({ type: 'sector', catId: 'nails', sIdx: parseInt(parts[1]) });
    }
    else if (id === 'salon') setActiveSection({ type: 'category', catId: 'salon' });
    else if (id.startsWith('salon-')) {
      const parts = id.split('-');
      if (parts.length === 2) {
        setActiveSection({ type: 'sector', catId: 'salon', sIdx: parseInt(parts[1]) });
      } else if (parts.length === 3) {
        setActiveSection({ type: 'sector', catId: 'salon', sIdx: parseInt(parts[1]), secIdx: parseInt(parts[2]) });
      }
    }
  };

  const editorCanvas = (
    <>
      {activeSection.type === 'teasers' && (
        <div className="hub-form-grid">
          {isMobile ? (
            <AdminSectionDescription text="Manage the visual cards shown in the 'Trending' and 'Services' sections on the landing page." />
          ) : (
            <div className="editor-header">
              <h2>Homepage Teasers</h2>
              <p>Manage the visual cards shown in the 'Trending' and 'Services' sections on the landing page.</p>
            </div>
          )}
          {[
            { list: teaserItems, set: setTeaserItems, title: "Main Trending Cards", sub: "Displayed at the top of the services section" },
            { list: otherItems, set: setOtherItems, title: "Other Services", sub: "Secondary options shown below main cards" }
          ].map((group, gIdx) => (
            <div key={gIdx} className="hub-section-group">
              {isMobile ? (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>{group.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#8E8484', margin: '0 0 16px 0' }}>{group.sub}</p>
                  <AdminAddButton label="Add Card" onClick={() => openTeaserModal(group.list === teaserItems ? 'main' : 'other')} style={{ padding: '8px 16px', fontSize: '0.8rem' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div><h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{group.title}</h3><p style={{ fontSize: '0.85rem', color: '#8E8484' }}>{group.sub}</p></div>
                  <AdminAddButton label="Add Card" onClick={() => openTeaserModal(group.list === teaserItems ? 'main' : 'other')} style={{ padding: '8px 16px', fontSize: '0.8rem' }} />
                </div>
              )}
              <div className={isMobile ? "amt-2col-grid" : ""} style={!isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } : {}}>
                {group.list.map((item, idx) => (
                  isMobile ? (
                    <AdminMediaTile
                      key={item.id || idx}
                      image={item.image}
                      title={item.title}
                      description={item.description}
                      status="live"
                      onEdit={() => {
                        if (isMobile) {
                          setTeaserListType(group.list === teaserItems ? 'main' : 'other');
                          setDraftTeaser(item);
                          openPopup(
                            <AdminUploadLayout
                              initialImage={item.image}
                              onUploadSuccess={(url) => setDraftTeaser(prev => ({ ...prev, image: url }))}
                              onSave={() => {
                                updateTeaser(group.list, group.set, idx, 'title', draftTeaser.title);
                                updateTeaser(group.list, group.set, idx, 'description', draftTeaser.description);
                                updateTeaser(group.list, group.set, idx, 'image', draftTeaser.image);
                                closePopup();
                              }}
                              onDiscard={closePopup}
                              saveLabel="Save Changes"
                            >
                              <input
                                className="aul-field"
                                placeholder="Service Title"
                                value={draftTeaser.title}
                                onChange={(e) => setDraftTeaser(prev => ({ ...prev, title: e.target.value }))}
                              />
                              <textarea
                                className="aul-field"
                                style={{ height: '120px' }}
                                placeholder="Description..."
                                value={draftTeaser.description}
                                onChange={(e) => setDraftTeaser(prev => ({ ...prev, description: e.target.value }))}
                              />
                            </AdminUploadLayout>,
                            "Edit Teaser"
                          );
                        } else {
                          setTeaserListType(group.list === teaserItems ? 'main' : 'other');
                          setDraftTeaser(item);
                          setIsTeaserModalOpen(true);
                        }
                      }}
                      onDelete={() => deleteTeaser(group.list, group.set, idx)}
                    />
                  ) : (
                    <div key={item.id || idx} className="slide-card-hub">
                      <div className="slide-image-preview-hub">
                        {item.image ? <img src={item.image} alt="" /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}><ImageIcon size={32} /></div>}
                        <label className="upload-pill">{uploadingTeaser === `${group.list === teaserItems ? 'main' : 'other'}-${idx}` ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />} <span>{item.image ? 'Replace' : 'Upload'}</span> <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTeaserImageUpload(e, group.list, group.set, idx)} /></label>
                        <button onClick={() => deleteTeaser(group.list, group.set, idx)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e53935', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input className="hub-input" style={{ fontSize: '0.9rem', fontWeight: 600 }} value={item.title || ''} placeholder="Service Title" onChange={(e) => updateTeaser(group.list, group.set, idx, 'title', e.target.value)} />
                        <textarea className="hub-textarea" style={{ fontSize: '0.85rem', height: '80px', resize: 'none' }} value={item.description || ''} placeholder="Brief description..." onChange={(e) => updateTeaser(group.list, group.set, idx, 'description', e.target.value)} />
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection.type === 'category' && activeSection.catId === 'nails' && (
        <div className="hub-form-grid">
          {isMobile ? (
            <AdminSectionDescription text="Update service names and pricing for the entire Nail Studio catalog." />
          ) : (
            <div className="editor-header"><h2>Nail Studio Prices</h2><p>Update service names and pricing for the entire Nail Studio catalog.</p></div>
          )}
          {catalog.nails?.services?.map((serviceCat, sIdx) => (
            <div key={sIdx} className="hub-section-group hub-hover-group" style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}><input className="hub-editable-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4a1a26' }} value={serviceCat.category} readOnly={true} /></div>
              {serviceCat.sections?.map((section, secIdx) => (
                <div 
                  key={secIdx} 
                  className={isMobile ? "" : "hub-field-card hub-hover-group"} 
                  style={isMobile ? { marginBottom: '24px' } : { background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0', padding: '24px', marginBottom: '24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', minHeight: '32px' }}>
                    <div className={isMobile ? "" : "reveal-on-hover"}>
                      <AdminAddButton label="Service" onClick={() => handleAddItem('nails', sIdx, secIdx)} style={{ padding: '6px 14px', fontSize: '0.75rem' }} />
                    </div>
                  </div>
                  <div className="hub-table">
                    <div className="hub-table-row hub-table-header"><span>Service Name</span><span>Price</span><span style={{ textAlign: 'right' }}>Action</span></div>
                    {section.items?.map((item) => (
                      <div key={item.id} className="hub-table-row">
                        <input className="hub-input" style={{ border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.95rem' }} value={item.name} onChange={(e) => handleUpdateItem('nails', sIdx, secIdx, item.id, 'name', e.target.value)} />
                        <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#8E8484' }}>₦</span><input className="hub-input" style={{ border: 'none', background: 'transparent', padding: '8px 0 8px 15px', fontSize: '0.95rem', fontWeight: 700 }} value={item.price || ''} onChange={(e) => handleUpdateItem('nails', sIdx, secIdx, item.id, 'price', e.target.value)} /></div>
                        <div className="row-actions"><button className="icon-btn delete" style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(229, 57, 53, 0.05)', color: '#e53935', cursor: 'pointer' }} onClick={() => handleDeleteItem('nails', sIdx, secIdx, item.id)}><Trash2 size={16} /></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {activeSection.type === 'sector' && (
        <div className="hub-form-grid">
          {catalog[activeSection.catId]?.services[activeSection.sIdx]?.sections?.filter((_, idx) => activeSection.secIdx === null || activeSection.secIdx === undefined || activeSection.secIdx === idx).map((section, sIdxOffset) => {
            const actualSecIdx = activeSection.secIdx !== null && activeSection.secIdx !== undefined ? activeSection.secIdx : sIdxOffset;
            return (
              <div 
                key={actualSecIdx} 
                className={isMobile ? "" : "hub-field-card hub-hover-group"} 
                style={isMobile ? { marginBottom: '0px' } : { background: '#fff', borderRadius: '20px', border: '1px solid #f0f0f0', padding: '24px', marginBottom: '24px' }}
              >
                {isMobile ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <AdminAddButton label="Add Service" onClick={() => handleAddItem(activeSection.catId, activeSection.sIdx, actualSecIdx)} style={{ padding: '8px 16px', fontSize: '0.85rem' }} />
                    <AdminDeleteSectionButton label="Delete Section" onDelete={() => deleteSection(activeSection.catId, activeSection.sIdx, actualSecIdx)} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input className="hub-editable-title" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4a1a26' }} value={section.title || catalog[activeSection.catId]?.services[activeSection.sIdx]?.category} onChange={(e) => updateSectionTitle(activeSection.catId, activeSection.sIdx, actualSecIdx, e.target.value)} placeholder="Title" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(activeSection.catId, activeSection.sIdx, actualSecIdx);
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#e53935', cursor: 'pointer', padding: '8px', borderRadius: '8px' }}
                        title="Delete Group"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                    <div className="reveal-on-hover">
                      <AdminAddButton label="Service" onClick={() => handleAddItem(activeSection.catId, activeSection.sIdx, actualSecIdx)} style={{ padding: '6px 14px', fontSize: '0.75rem' }} />
                    </div>
                  </div>
                )}
                
                <div className="hub-table">
                  <div className="hub-table-row hub-table-header"><span>Service Name</span><span>Price</span><span style={{ textAlign: 'right' }}>Action</span></div>
                  {section.items?.map((item) => (
                    <div key={item.id} className="hub-table-row" style={isMobile ? { padding: '12px 16px', gap: '4px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)', borderRadius: 0, marginBottom: 0 } : {}}>
                      <input className="hub-input" style={{ border: 'none', background: 'transparent', padding: isMobile ? '4px 0' : '8px 0', fontSize: '0.95rem' }} value={item.name} onChange={(e) => handleUpdateItem(activeSection.catId, activeSection.sIdx, actualSecIdx, item.id, 'name', e.target.value)} />
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', fontSize: '0.9rem', color: '#8E8484' }}>₦</span>
                        <input className="hub-input" style={{ border: 'none', background: 'transparent', padding: isMobile ? '4px 0 4px 15px' : '8px 0 8px 15px', fontSize: '0.95rem', fontWeight: 700 }} value={item.price || ''} onChange={(e) => handleUpdateItem(activeSection.catId, activeSection.sIdx, actualSecIdx, item.id, 'price', e.target.value)} />
                      </div>
                      <div className="row-actions" style={isMobile ? { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' } : {}}>
                        <button className="icon-btn delete" onClick={() => handleDeleteItem(activeSection.catId, activeSection.sIdx, actualSecIdx, item.id)} style={{ padding: '8px', borderRadius: '8px', border: 'none', background: isMobile ? 'transparent' : 'rgba(229, 57, 53, 0.05)', color: '#e53935', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const servicesSections = [
    {
      id: 'teasers',
      label: 'Homepage Teasers',
      icon: <Layout size={20} />,
      component: editorCanvas
    },
    {
      id: 'nails',
      label: 'Nail Studio Prices',
      icon: <Sparkles size={20} />,
      onAdd: () => addCategory('nails'),
      component: editorCanvas,
      children: catalog.nails?.services?.map((serviceCat, sIdx) => ({
        id: `nails-${sIdx}`,
        label: serviceCat.category,
        isNew: serviceCat.isNew,
        onRename: (newName) => updateCategoryName('nails', sIdx, newName),
        onDelete: () => deleteCategory('nails', sIdx),
        component: editorCanvas
      }))
    },
    {
      id: 'salon',
      label: 'Beauty Salon',
      icon: <Scissors size={20} />,
      onAdd: () => addCategory('salon'),
      children: catalog.salon?.services?.map((serviceCat, sIdx) => {
        const hasSub = (serviceCat.sections || []).length > 1 || (serviceCat.sections?.[0]?.title);
        return {
          id: `salon-${sIdx}`,
          label: serviceCat.category,
          isNew: serviceCat.isNew,
          onRename: (newName) => updateCategoryName('salon', sIdx, newName),
          onAdd: () => addSection('salon', sIdx),
          onDelete: () => deleteCategory('salon', sIdx),
          component: !hasSub ? editorCanvas : undefined,
          children: hasSub ? serviceCat.sections?.map((section, secIdx) => ({
            id: `salon-${sIdx}-${secIdx}`,
            label: section.title || serviceCat.category,
            isNew: section.isNew,
            onRename: (newName) => updateSectionTitle('salon', sIdx, secIdx, newName),
            onDelete: () => deleteSection('salon', sIdx, secIdx),
            component: editorCanvas
          })) : undefined
        };
      })
    }
  ];

  const hasChanges = JSON.stringify(catalog) !== JSON.stringify(originalCatalog) || 
                     JSON.stringify(teaserItems) !== JSON.stringify(originalTeaserItems) ||
                     JSON.stringify(otherItems) !== JSON.stringify(originalOtherItems);
  return (
    <div className="manager-container">
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Teaser Cards</span>
          <div className="status-value">{teaserItems.length + otherItems.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Active</span></div>
          <div className="status-badge">Live</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Nail Studio</span>
          <div className="status-value">{nailServiceCount} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Items</span></div>
          <div className="status-badge">Catalog</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Beauty Salon</span>
          <div className="status-value">{salonServiceCount} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Items</span></div>
          <div className="status-badge">Catalog</div>
        </div>
      </div>

      {!isMobile && (
        <div className="hub-main-layout">
          <aside className="hub-sidebar" style={{ gap: '24px' }}>
            {hasChanges && (
              <HubActionPill 
                onSave={handleSaveAll} 
                onDiscard={handleDiscardAll} 
                isSaving={saving} 
              />
            )}
            <div>
              <NavPill
                label="Homepage Teasers"
                icon={Layout}
                active={isTabActive('teasers')}
                onClick={() => setActiveSection({ type: 'teasers' })}
              />

              <StudioDropdown
                label="Nail Studio Prices"
                icon={Sparkles}
                value={activeSection.type === 'sector' && activeSection.catId === 'nails' ? catalog.nails?.services?.[activeSection.sIdx]?.category : (activeSection.type === 'category' && activeSection.catId === 'nails' ? 'Nail Studio Prices' : null)}
                active={isTabActive('category', 'nails') || (activeSection.type === 'sector' && activeSection.catId === 'nails')}
                onClick={() => setActiveSection({ type: 'category', catId: 'nails' })}
                onAdd={() => addCategory('nails')}
                mode="accordion"
                options={catalog.nails?.services?.map((serviceCat) => ({
                  label: serviceCat.category,
                  value: serviceCat.category,
                  active: isTabActive('sector', 'nails', null, null) || (activeSection.catId === 'nails' && catalog.nails?.services?.[activeSection.sIdx]?.category === serviceCat.category)
                }))}
                onSelect={(catLabel) => {
                  const sIdx = catalog.nails?.services?.findIndex(s => s.category === catLabel);
                  setActiveSection({ type: 'sector', catId: 'nails', sIdx });
                }}
              />
            </div>

            <div className="sidebar-group" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#8E8484', letterSpacing: '0.1em' }}>Beauty Salon</h4>
                <button onClick={() => addCategory('salon')} style={{ background: 'transparent', border: 'none', color: '#4a1a26', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Plus size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {catalog.salon?.services?.map((serviceCat, sIdx) => {
                  const hasSub = (serviceCat.sections || []).length > 1 || (serviceCat.sections?.[0]?.title);
                  return (
                    <StudioDropdown
                      key={sIdx}
                      label={serviceCat.category}
                      icon={Scissors}
                      value={activeSection.catId === 'salon' && activeSection.sIdx === sIdx ? (activeSection.secIdx !== null && activeSection.secIdx !== undefined ? serviceCat.sections?.[activeSection.secIdx]?.title : serviceCat.category) : null}
                      active={isTabActive('sector', 'salon', sIdx)}
                      onClick={() => setActiveSection({ type: 'sector', catId: 'salon', sIdx })}
                      onAdd={() => addSection('salon', sIdx)}
                      mode="accordion"
                      hasSub={hasSub}
                      options={hasSub ? serviceCat.sections?.map((section) => ({
                        label: section.title || serviceCat.category,
                        value: section.title || serviceCat.category,
                        active: activeSection.catId === 'salon' && activeSection.sIdx === sIdx && (activeSection.secIdx !== null && activeSection.secIdx !== undefined ? serviceCat.sections?.[activeSection.secIdx]?.title : serviceCat.category) === (section.title || serviceCat.category)
                      })) : []}
                      onSelect={(val) => {
                        const secIdx = serviceCat.sections?.findIndex(s => (s.title || serviceCat.category) === val);
                        setActiveSection({ type: 'sector', catId: 'salon', sIdx, secIdx });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="hub-editor-card">
            {editorCanvas}
          </main>
        </div>
      )}

      <AdminMobileLayoutWithDropdown
        sections={servicesSections}
        activeSectionId={getActiveSectionId()}
        onSectionChange={handleMobileSectionChange}
        onSave={handleSaveAll}
        onDiscard={handleDiscardAll}
        isSaving={saving}
        hasChanges={hasChanges}
      />

      {/* ── Homepage Teaser Drawer ── */}
      {isTeaserModalOpen && isMobile && (
        <div className="hub-modal-overlay" style={{ zIndex: 5000 }}>
          <AdminUploadLayout
            initialImage={draftTeaser.image}
            onUploadSuccess={(url) => setDraftTeaser({ ...draftTeaser, image: url })}
            onSave={confirmAddTeaser}
            onDiscard={() => {
              setIsTeaserModalOpen(false);
              setDraftTeaser({ title: "", description: "", image: "" });
            }}
            saveLabel="Create Card"
          >
            <input
              className="aul-field"
              placeholder="Service Title (e.g. Master Manicures)"
              value={draftTeaser.title}
              onChange={(e) => setDraftTeaser({ ...draftTeaser, title: e.target.value })}
            />
            <textarea
              className="aul-field"
              style={{ height: '120px' }}
              placeholder="Brief Description: Provide a compelling overview for the homepage..."
              value={draftTeaser.description}
              onChange={(e) => setDraftTeaser({ ...draftTeaser, description: e.target.value })}
            />
          </AdminUploadLayout>
        </div>
      )}
      {isTeaserModalOpen && !isMobile && (
        <div className="hub-modal-overlay" onClick={() => setIsTeaserModalOpen(false)}>
          <div className="hub-modal-card" style={{ maxWidth: '900px', padding: '32px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            {/* Body Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'stretch' }}>

              {/* Left Column: Visual */}
              <div className="modal-visual-zone" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="slide-image-preview-hub" style={{ flex: 1, height: 'auto', aspectRatio: '16/9', marginBottom: '0', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  {draftTeaser.image ? (
                    <img src={draftTeaser.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ccc', gap: '8px', background: '#f8f8f8' }}>
                      <ImageIcon size={40} strokeWidth={1} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.8 }}>PREVIEW</span>
                    </div>
                  )}

                  <label className="upload-pill" style={{ bottom: '20px', left: '50%', transform: 'translateX(-50%)', right: 'auto', width: 'max-content', padding: '8px 16px', fontSize: '0.75rem' }}>
                    {isUploadingTeaserDraft ? <Loader2 className="animate-spin" size={14} /> : <UploadCloud size={14} />}
                    <span>{draftTeaser.image ? 'Replace Photo' : 'Upload Card Image (16:9)'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleTeaserDraftImageUpload} />
                  </label>
                </div>
              </div>

              {/* Right Column: Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-field">
                  <input
                    className="hub-input"
                    autoFocus
                    placeholder="Service Title (e.g. Master Manicures)"
                    value={draftTeaser.title}
                    onChange={(e) => setDraftTeaser({ ...draftTeaser, title: e.target.value })}
                  />
                </div>
                <div className="input-field" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <textarea
                    className="hub-textarea"
                    style={{ flex: 1, resize: 'none' }}
                    placeholder="Brief Description: Provide a compelling overview for the homepage..."
                    value={draftTeaser.description}
                    onChange={(e) => setDraftTeaser({ ...draftTeaser, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Condensed Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <div className="hub-action-pill" style={{ padding: '8px 12px', gap: '24px', minWidth: 'auto', boxShadow: '0 15px 35px rgba(74, 26, 38, 0.2)' }}>
                <button
                  className="action-btn discard"
                  style={{ padding: '8px', minWidth: '40px', display: 'flex', justifyContent: 'center' }}
                  onClick={() => setIsTeaserModalOpen(false)}
                  title="Discard Changes"
                >
                  <X size={20} />
                </button>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

                <button
                  className="action-btn save"
                  style={{ padding: '8px', minWidth: '40px', display: 'flex', justifyContent: 'center' }}
                  disabled={!draftTeaser.title || !draftTeaser.image || isUploadingTeaserDraft}
                  onClick={confirmAddTeaser}
                  title="Create Card"
                >
                  {isUploadingTeaserDraft || saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Hub Action Bar (Desktop only, if changes exist) ── */}
      {hasChanges && !isMobile && (
        <HubActionPill
          onSave={handleSaveAll}
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

export default ServicesManager;
