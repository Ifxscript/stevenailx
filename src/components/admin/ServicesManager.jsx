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
import AdminAddButton from './AdminAddButton';
import AdminDeleteSectionButton from './AdminDeleteSectionButton';
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
  const [activeSection, setActiveSection] = useState({ type: 'teasers' });
  const [uploadingTeaser, setUploadingTeaser] = useState(null);
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

  const [jsonImportModal, setJsonImportModal] = useState({ isOpen: false, category: null });

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) throw new Error("JSON must be an array");
        setCatalog(prev => {
          const newCatalog = { ...prev };
          newCatalog[jsonImportModal.category].services = json;
          return newCatalog;
        });
        setJsonImportModal({ isOpen: false, category: null });
        alert("✅ Price list imported successfully!");
      } catch (err) {
        alert("Invalid JSON format: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const openJsonModal = (category) => {
    setJsonImportModal({ isOpen: true, category });
  };

  const confirmAddTeaser = (items, listType) => {
    const newItems = items.map(item => ({ ...item, id: item.id || Date.now().toString() }));
    if (listType === 'main') {
      setTeaserItems(prev => [...prev, ...newItems]);
    } else {
      setOtherItems(prev => [...prev, ...newItems]);
    }
    setIsTeaserModalOpen(false);
    closePopup();
  };

  const openTeaserModal = (listType) => {
    setTeaserListType(listType);
    
    const content = (
      <div className={isMobile ? "" : "teaser-modal-content"} style={isMobile ? {} : { maxWidth: '600px', padding: '0', background: 'transparent', boxShadow: 'none' }}>
        <AdminUploadLayout
          initialItems={[]}
          itemConfigs={[
            { name: 'title', placeholder: 'Service Title', type: 'text' },
            { name: 'description', placeholder: 'Description...', type: 'textarea' }
          ]}
          onSaveItems={(items) => confirmAddTeaser(items, listType)}
          onDiscard={() => { closePopup(); setIsTeaserModalOpen(false); }}
          saveLabel="Add Teaser"
        />
      </div>
    );

    if (isMobile) {
      openPopup(content);
    } else {
      setIsTeaserModalOpen(true);
      setPopup({ isOpen: true, content });
    }
  };

  // handleTeaserDraftImageUpload removed, handled by AdminUploadLayout

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
          {isMobile ? null : (
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
                              initialItems={[item]}
                              itemConfigs={[
                                { name: 'title', placeholder: 'Service Title', type: 'text', defaultValue: item.title },
                                { name: 'description', placeholder: 'Description...', type: 'textarea', defaultValue: item.description }
                              ]}
                              onSaveItems={(items) => {
                                updateTeaser(group.list, group.set, idx, 'title', items[0].title);
                                updateTeaser(group.list, group.set, idx, 'description', items[0].description);
                                if (items[0].image) updateTeaser(group.list, group.set, idx, 'image', items[0].image);
                                closePopup();
                              }}
                              onDiscard={closePopup}
                              saveLabel="Save Changes"
                            />,
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
            <div style={{ marginBottom: '24px' }}>
              <button className="hub-add-btn" onClick={() => openJsonModal('nails')} style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center', background: '#f5f5f5', color: '#4a1a26', borderRadius: '12px', border: '1px solid #e0dcd0', fontWeight: 700 }}>
                <UploadCloud size={16}/> Import JSON
              </button>
            </div>
          ) : (
            <div className="editor-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h2>Nail Studio Prices</h2><p>Update service names and pricing for the entire Nail Studio catalog.</p></div>
                <button className="hub-add-btn" onClick={() => openJsonModal('nails')} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', background: '#f5f5f5', color: '#4a1a26', borderRadius: '10px', border: '1px solid #e0dcd0', fontWeight: 700 }}>
                  <UploadCloud size={16}/> Import JSON
                </button>
              </div>
            </div>
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
      {/* JSON Import button for Salon is handled in the sector view if needed, or we can add it here. */}
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

      <div style={{ padding: '24px', maxWidth: '1200px' }}>
        {/* ── Homepage Teasers Section ── */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout size={20} /> Homepage Teasers
          </h2>
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '24px', marginTop: '12px' }}>
            {editorCanvas}
          </div>
        </section>

        {/* ── Nail Studio Prices Section ── */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> Nail Studio Prices
            </h2>
            <button
              onClick={() => addCategory('nails')}
              className="action-btn save"
              style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
          
          {!catalog?.nails?.services || catalog.nails.services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8E8484' }}>
              <p>No categories yet. Click "Add Category" to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
              {catalog.nails.services.map((serviceCat, sIdx) => (
                <div key={sIdx} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a1a26', margin: 0 }}>
                      {serviceCat.category}
                      {serviceCat.isNew && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#ffd700', color: '#333', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>NEW</span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const newName = prompt(`Rename "${serviceCat.category}":`);
                          if (newName) updateCategoryName('nails', sIdx, newName);
                        }}
                        style={{ background: 'transparent', border: '1px solid #ddd', color: '#8E8484', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deleteCategory('nails', sIdx)}
                        style={{ background: 'transparent', border: '1px solid #e8998e', color: '#e8998e', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  
                  {serviceCat.sections?.map((section, secIdx) => (
                    <div key={secIdx} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', marginBottom: secIdx < serviceCat.sections.length - 1 ? '12px' : 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8E8484', marginBottom: '12px' }}>{section.title || 'Items'}</div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {section.items?.map((item, itemIdx) => (
                          <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: '#4a1a26', fontSize: '0.875rem' }}>{item.name}</div>
                              <div style={{ color: '#8E8484', fontSize: '0.75rem' }}>${item.price}</div>
                            </div>
                            <button
                              onClick={() => {
                                const newPrice = prompt(`Update price for "${item.name}":`, item.price);
                                if (newPrice) {
                                  const updated = [...catalog.nails.services];
                                  updated[sIdx].sections[secIdx].items[itemIdx].price = newPrice;
                                  setCatalog({ ...catalog, nails: { services: updated } });
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#8E8484', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Beauty Salon Prices Section ── */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scissors size={20} /> Beauty Salon Prices
            </h2>
            <button
              onClick={() => addCategory('salon')}
              className="action-btn save"
              style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} /> Add Category
            </button>
          </div>
          
          {!catalog?.salon?.services || catalog.salon.services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#8E8484' }}>
              <p>No categories yet. Click "Add Category" to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
              {catalog.salon.services.map((serviceCat, sIdx) => (
                <div key={sIdx} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a1a26', margin: 0 }}>
                      {serviceCat.category}
                      {serviceCat.isNew && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#ffd700', color: '#333', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>NEW</span>}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => addSection('salon', sIdx)}
                        className="action-btn save"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={14} /> Section
                      </button>
                      <button
                        onClick={() => {
                          const newName = prompt(`Rename "${serviceCat.category}":`);
                          if (newName) updateCategoryName('salon', sIdx, newName);
                        }}
                        style={{ background: 'transparent', border: '1px solid #ddd', color: '#8E8484', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deleteCategory('salon', sIdx)}
                        style={{ background: 'transparent', border: '1px solid #e8998e', color: '#e8998e', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  
                  {serviceCat.sections?.map((section, secIdx) => (
                    <div key={secIdx} style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', marginBottom: secIdx < serviceCat.sections.length - 1 ? '12px' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8E8484' }}>{section.title || 'Items'}</div>
                        <button
                          onClick={() => {
                            const newTitle = prompt(`Rename section:`, section.title);
                            if (newTitle) updateSectionTitle('salon', sIdx, secIdx, newTitle);
                          }}
                          style={{ background: 'transparent', border: '1px solid #ddd', color: '#8E8484', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Rename
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {section.items?.map((item, itemIdx) => (
                          <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
                            <div>
                              <div style={{ fontWeight: 600, color: '#4a1a26', fontSize: '0.875rem' }}>{item.name}</div>
                              <div style={{ color: '#8E8484', fontSize: '0.75rem' }}>${item.price}</div>
                            </div>
                            <button
                              onClick={() => {
                                const newPrice = prompt(`Update price for "${item.name}":`, item.price);
                                if (newPrice) {
                                  const updated = [...catalog.salon.services];
                                  updated[sIdx].sections[secIdx].items[itemIdx].price = newPrice;
                                  setCatalog({ ...catalog, salon: { services: updated } });
                                }
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#8E8484', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── JSON Import Modal ── */}
      <div className={`hub-popup-overlay ${jsonImportModal.isOpen ? 'open' : ''}`} onClick={() => setJsonImportModal({ isOpen: false, category: null })}>
        <div className="hub-popup-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4a1a26', marginBottom: '8px' }}>Import {jsonImportModal.category === 'nails' ? 'Nail Studio' : 'Beauty Salon'} Prices</h2>
          <p style={{ color: '#8E8484', marginBottom: '24px' }}>Upload a JSON file to bulk-update this section's price list. This will replace the current list.</p>
          
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px', marginBottom: '24px', overflowX: 'auto' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#8E8484', marginBottom: '8px', textTransform: 'uppercase' }}>Expected Format:</span>
            <pre style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>
{`[
  {
    "category": "Manicures",
    "sections": [
      {
        "title": "Classic",
        "items": [
          { "id": 1, "name": "Basic Manicure", "price": "5000" },
          { "id": 2, "name": "Gel Manicure", "price": "8000" }
        ]
      }
    ]
  }
]`}
            </pre>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="action-btn discard" onClick={() => setJsonImportModal({ isOpen: false, category: null })}>Cancel</button>
            <label className="action-btn save" style={{ cursor: 'pointer' }}>
              Upload JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleJsonUpload} />
            </label>
          </div>
        </div>
      </div>



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
