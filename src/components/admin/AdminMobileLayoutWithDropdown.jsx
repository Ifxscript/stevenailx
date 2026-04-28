import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit2, MoreVertical, Trash2 } from 'lucide-react';
import HubActionPill from './HubActionPill';
import AdminDrawerHeader from './AdminDrawerHeader';
import './AdminMobileLayout.css';
import './AdminMobileLayoutWithDropdown.css';

/**
 * AdminMobileLayoutWithDropdown
 * 
 * A mobile-only layout for admin pages that use dropdown/accordion navigation
 * on desktop (e.g. Services & Prices, Portfolio). Renders an expandable 
 * section list on mobile with parent/child/grandchild hierarchy support.
 * 
 * Returns null on desktop — those pages manage their own desktop layout.
 * 
 * Section schema:
 * {
 *   id: string,
 *   label: string,
 *   icon: ReactNode,
 *   status?: string,
 *   component?: ReactElement,      // Leaf: opens drawer directly
 *   onAdd?: () => void,            // Plus button callback
 *   children?: [{                  // Expandable: reveals inline children
 *     id: string,
 *     label: string,
 *     component?: ReactElement,
 *     onAdd?: () => void,
 *     children?: [{ id, label, component }]  // Nested grandchildren
 *   }]
 * }
 */

const NavItemLabel = ({ item, isEditing, onStartEdit, onStopEdit }) => {
  const [tempLabel, setTempLabel] = React.useState(item.label || '');

  React.useEffect(() => {
    if (item.isNew && !isEditing) {
      onStartEdit(item.id);
    }
  }, [item.isNew]);

  React.useEffect(() => {
    setTempLabel(item.label || '');
  }, [item.label]);

  if (isEditing) {
    return (
      <textarea
        className="nav-item-edit-textarea"
        autoFocus
        value={tempLabel}
        onChange={(e) => setTempLabel(e.target.value)}
        onBlur={() => {
          if (tempLabel.trim()) {
            item.onRename(tempLabel);
          }
          onStopEdit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new line
            if (tempLabel.trim()) {
              item.onRename(tempLabel);
            }
            onStopEdit();
          } else if (e.key === 'Escape') {
            onStopEdit();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder="Enter name..."
        rows={1}
      />
    );
  }

  return <span className="nav-item-label">{item.label}</span>;
};

const ActionMenu = ({ item, isEditing, onStartEdit, onStopEdit }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isEditing) {
    return (
      <button 
        className="nav-action-btn save-btn" 
        onClick={(e) => { 
          e.stopPropagation(); 
          onStopEdit(); 
        }}
        type="button"
      >
        <span className="save-text">Save</span>
      </button>
    );
  }

  if (!item.onRename && !item.onAdd && !item.onDelete) return null;

  return (
    <div className="action-menu-wrapper" ref={menuRef} onClick={e => e.stopPropagation()}>
      <button 
        className="nav-action-btn more-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="action-menu-dropdown">
          {item.onRename && (
            <button className="action-menu-item" onClick={() => { onStartEdit(item.id); setIsOpen(false); }}>
              <Edit2 size={14} /> Edit Name
            </button>
          )}
          {item.onAdd && (
            <button className="action-menu-item" onClick={() => { item.onAdd(); setIsOpen(false); }}>
              <Plus size={14} /> Add Section
            </button>
          )}
          {item.onDelete && (
            <button className="action-menu-item delete" onClick={() => {
              if (window.confirm("Are you sure you want to delete this?")) item.onDelete();
              setIsOpen(false);
            }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AdminMobileLayoutWithDropdown = ({
  sections = [],
  activeSectionId,
  onSectionChange,
  onSave,
  onDiscard,
  isSaving,
  hasChanges = true,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [popup, setPopup] = useState({ isOpen: false, content: null });
  const [editingId, setEditingId] = useState(null);

  const handleDiscard = () => {
    setEditingId(null);
    if (onDiscard) onDiscard();
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // ── State Handlers ──

  const toggleExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLeafClick = (sectionId) => {
    onSectionChange(sectionId);
    if (isMobile) setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => onSectionChange(null), 300);
  };

  const openPopup = (content) => setPopup({ isOpen: true, content });
  const closePopup = () => setPopup({ isOpen: false, content: null });

  // ── Resolve active component from flat or nested tree ──

  const findSection = (id) => {
    for (const section of sections) {
      if (section.id === id) return section;
      if (section.children) {
        for (const child of section.children) {
          if (child.id === id) return child;
          if (child.children) {
            for (const gc of child.children) {
              if (gc.id === id) return gc;
            }
          }
        }
      }
    }
    return sections[0];
  };

  const activeSection = findSection(activeSectionId);

  // Inject popup control into the active section component
  const renderedComponent = React.isValidElement(activeSection?.component)
    ? React.cloneElement(activeSection.component, { openPopup, closePopup })
    : activeSection?.component;

  // ── Desktop: return null (pages manage their own desktop layout) ──
  if (!isMobile) return null;

  // ── Mobile Rendering ──
  return (
    <div className="hub-layout-wrapper mobile">
      <div className="hub-mobile-container">

        {/* ═══ Layer 1: Expandable Section List ═══ */}
        <div className="mobile-nav-list dropdown-nav-list">
          {sections.map(section => {
            const hasChildren = section.children && section.children.length > 0;
            const isExpanded = expandedIds.has(section.id);
            const isLeaf = !hasChildren && section.component;

            return (
              <div key={section.id} className="dropdown-nav-group">
                {/* ── Parent Row ── */}
                <button
                  className={`mobile-nav-item ${hasChildren ? 'has-children' : ''} ${activeSectionId === section.id ? 'active' : ''}`}
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpand(section.id);
                    } else if (isLeaf) {
                      handleLeafClick(section.id);
                    }
                  }}
                >
                  {section.icon && (
                    <div className="nav-item-icon">{section.icon}</div>
                  )}
                  <NavItemLabel 
                    item={section} 
                    isEditing={editingId === section.id}
                    onStartEdit={(id) => setEditingId(id)}
                    onStopEdit={() => setEditingId(null)}
                  />

                  <div className="nav-item-actions">
                    <ActionMenu 
                      item={section} 
                      isEditing={editingId === section.id}
                      onStartEdit={(id) => setEditingId(id)}
                      onStopEdit={() => setEditingId(null)}
                    />
                    {hasChildren ? (
                      <ChevronDown
                        size={18}
                        className={`nav-item-chevron ${isExpanded ? 'expanded' : ''}`}
                      />
                    ) : (
                      <ChevronRight size={18} className="nav-item-arrow" />
                    )}
                  </div>
                </button>

                {/* ── Children (expand inline) ── */}
                {hasChildren && (
                  <div className={`nav-children ${isExpanded ? 'expanded' : ''}`}>
                    {section.children.map(child => {
                      const hasGrandchildren = child.children && child.children.length > 0;
                      const isChildExpanded = expandedIds.has(child.id);

                      return (
                        <div key={child.id} className="dropdown-nav-subgroup">
                          <button
                            className={`mobile-nav-item child-item ${activeSectionId === child.id ? 'active' : ''} ${hasGrandchildren ? 'has-children' : ''}`}
                            onClick={() => {
                              if (hasGrandchildren) {
                                toggleExpand(child.id);
                              } else {
                                handleLeafClick(child.id);
                              }
                            }}
                          >
                            <NavItemLabel 
                              item={child} 
                              isEditing={editingId === child.id}
                              onStartEdit={(id) => setEditingId(id)}
                              onStopEdit={() => setEditingId(null)}
                            />
                            <div className="nav-item-actions">
                              <ActionMenu 
                                item={child} 
                                isEditing={editingId === child.id}
                                onStartEdit={(id) => setEditingId(id)}
                                onStopEdit={() => setEditingId(null)}
                              />
                              {hasGrandchildren ? (
                                <ChevronDown
                                  size={16}
                                  className={`nav-item-chevron ${isChildExpanded ? 'expanded' : ''}`}
                                />
                              ) : (
                                <ChevronRight size={16} className="nav-item-arrow" />
                              )}
                            </div>
                          </button>

                          {/* ── Grandchildren ── */}
                          {hasGrandchildren && (
                            <div className={`nav-children nested ${isChildExpanded ? 'expanded' : ''}`}>
                              {child.children.map(grandchild => (
                                <button
                                  key={grandchild.id}
                                  className={`mobile-nav-item grandchild-item ${activeSectionId === grandchild.id ? 'active' : ''}`}
                                  onClick={() => handleLeafClick(grandchild.id)}
                                >
                                  <NavItemLabel 
                                    item={grandchild} 
                                    isEditing={editingId === grandchild.id}
                                    onStartEdit={(id) => setEditingId(id)}
                                    onStopEdit={() => setEditingId(null)}
                                  />
                                  <div className="nav-item-actions">
                                    <ActionMenu 
                                      item={grandchild} 
                                      isEditing={editingId === grandchild.id}
                                      onStartEdit={(id) => setEditingId(id)}
                                      onStopEdit={() => setEditingId(null)}
                                    />
                                    <ChevronRight size={14} className="nav-item-arrow" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
 
        {/* ═══ Main Page Actions ═══ */}
        {hasChanges && !drawerOpen && (
          <HubActionPill
            onSave={onSave}
            onDiscard={handleDiscard}
            isSaving={isSaving}
            hasChanges={hasChanges}
            variant="fixed"
          />
        )}

        {/* ═══ Layer 2: Bottom Drawer ═══ */}
        <div className={`mobile-bottom-drawer ${drawerOpen ? 'open' : ''}`}>
          <div className="drawer-overlay" onClick={closeDrawer} />
          <div className="drawer-content">
            <AdminDrawerHeader
              title={activeSection?.label}
              onClose={closeDrawer}
              className="drawer-header-overlay"
            />

            <div className="drawer-scroll-body" style={{ paddingTop: '68px' }}>
              {renderedComponent}
              <div style={{ height: '120px' }} />
            </div>

            <HubActionPill
              onSave={onSave}
              onDiscard={handleDiscard}
              isSaving={isSaving}
              hasChanges={hasChanges}
              variant="drawer"
            />
          </div>
        </div>

        {/* ═══ Layer 3: Popup Modal ═══ */}
        <div className={`hub-popup-overlay ${popup.isOpen ? 'open' : ''}`} onClick={closePopup}>
          <div className="hub-popup-card" onClick={e => e.stopPropagation()}>
            {popup.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMobileLayoutWithDropdown;
