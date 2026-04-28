import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ArrowLeft } from 'lucide-react';
import HubActionPill from './HubActionPill';
import AdminDrawerHeader from './AdminDrawerHeader';
import './AdminMobileLayout.css';

/**
 * AdminMobileLayout - A unified layout component for Admin Hub managers.
 * Handles desktop sidebars and mobile tile-to-drawer navigation.
 */
const AdminMobileLayout = ({
  title,
  description,
  sections = [],
  onSave,
  onDiscard,
  isSaving,
  hasChanges = true,
  activeSectionId,
  onSectionChange
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [popup, setPopup] = useState({ isOpen: false, content: null });




  const handleTileClick = (sectionId) => {
    onSectionChange(sectionId);
    if (isMobile) setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    // Delay clearing the section slightly for transition smoothness
    setTimeout(() => onSectionChange(null), 300);
  };

  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  const activeSection = sections.find(s => s.id === activeSectionId) || sections[0];

  // Inject popup control into the active section component
  const renderedComponent = React.isValidElement(activeSection?.component)
    ? React.cloneElement(activeSection.component, { openPopup, closePopup })
    : activeSection?.component;

  return (
    <div className={`hub-layout-wrapper ${isMobile ? 'mobile' : 'desktop'}`}>

      {/* ── Layer 1 (Desktop) / Base (Mobile) ── */}
      {!isMobile && (
        <div className="hub-main-layout">
          <aside className="hub-sidebar">
            <div className="sidebar-group">
              {sections.map(s => (
                <button
                  key={s.id}
                  className={`hub-nav-pill ${activeSectionId === s.id ? 'active' : ''}`}
                  onClick={() => onSectionChange(s.id)}
                >
                  <div className="pill-icon">{s.icon}</div>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="hub-editor-card">
            <div className="editor-header">
              <h2>{activeSection?.label}</h2>
              <p>{activeSection?.description}</p>
            </div>
            <div className="hub-form-content">
              {renderedComponent}
            </div>
          </main>

          <HubActionPill
            onSave={onSave}
            onDiscard={onDiscard}
            isSaving={isSaving}
            hasChanges={hasChanges}
            variant="fixed"
          />
        </div>
      )}

      {/* ── Mobile View Architecture ── */}
      {isMobile && (
        <div className="hub-mobile-container">
          {/* Layer 1: Section List */}
          <div className="mobile-nav-list">
            {sections.map(s => (
              <button
                key={s.id}
                className="mobile-nav-item"
                onClick={() => handleTileClick(s.id)}
              >
                <div className="nav-item-icon">
                  {s.icon}
                </div>
                <span className="nav-item-label">{s.label}</span>
                <ChevronRight size={18} className="nav-item-arrow" />
              </button>
            ))}
          </div>

          {/* Layer 2: Bottom Drawer */}
          <div className={`mobile-bottom-drawer ${drawerOpen ? 'open' : ''}`}>
            <div className="drawer-overlay" onClick={closeDrawer} />
            <div className="drawer-content">
              {/* FLOATING GLASS HEADER */}
              <AdminDrawerHeader
                title={activeSection?.label}
                onClose={closeDrawer}
                className="drawer-header-overlay"
              />

              <div className="drawer-scroll-body" style={{ paddingTop: '68px' }}>
                {renderedComponent}
                {/* Extra space for floating action bar */}
                <div style={{ height: '120px' }} />
              </div>

              <HubActionPill
                onSave={onSave}
                onDiscard={onDiscard}
                isSaving={isSaving}
                hasChanges={hasChanges}
                variant="drawer"
              />
            </div>
          </div>

          {/* Layer 3: Popup Modal (managed within layout) */}
          <div className={`hub-popup-overlay ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
            <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
              {popup.content}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Modal Support (Optional consistency) */}
      {!isMobile && popup.isOpen && (
        <div className={`hub-popup-overlay desktop ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
          <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
            {popup.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMobileLayout;
