import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Check, Search, Image as ImageIcon } from 'lucide-react';
import '../../styles/AdminHub.css';

/**
 * Reusable NavPill component - The core building block of the Admin Hub.
 * EXACTLY matches the Services tab design and logic.
 */
export const NavPill = ({ 
  label, 
  icon: Icon, 
  active, 
  onClick, 
  hasSub = false, 
  isExpanded = false, 
  onAdd = null,
  className = ""
}) => (
  <div className={`hub-sidebar-row ${className}`}>
    <button className={`hub-nav-pill ${active ? 'active' : ''}`} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {Icon && <div className="pill-icon"><Icon size={18} /></div>}
        <span style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      {hasSub && (
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', 
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
            opacity: active ? 1 : 0.5 
          }} 
        />
      )}
    </button>
    {onAdd && (
      <button 
        className="hub-side-action" 
        onClick={(e) => { 
          e.stopPropagation(); 
          onAdd(); 
        }}
        title="Add New"
      >
        <Plus size={16} />
      </button>
    )}
  </div>
);

/**
 * Unified StudioDropdown - One source of truth for all selectors.
 * Supports Accordion (Sidebar) and Menu (Floating/Searchable).
 */
export const StudioDropdown = ({ 
  label,
  icon,
  options = [], // Array of strings or { label, value }
  value, // Current active value
  onSelect,
  onAdd = null,
  mode = 'accordion', // 'accordion' or 'menu'
  placeholder = "Select Option",
  searchPlaceholder = "Search...",
  allowSearch = true,
  children // For custom nested content in accordion mode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    if (mode === 'menu') {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mode]);

  const filteredOptions = options.filter(opt => 
    (typeof opt === 'string' ? opt : opt.label)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const displayLabel = value && options.length > 0
    ? (options.find(o => (typeof o === 'string' ? o : o.value) === value)?.label || 
       (typeof value === 'string' ? value : value))
    : label || value || placeholder;

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <div className={`studio-dropdown-container mode-${mode}`} ref={dropdownRef}>
      <NavPill 
        label={displayLabel}
        icon={icon || ImageIcon}
        active={isOpen || (mode === 'menu' && !!value)}
        onClick={handleToggle}
        hasSub={true}
        isExpanded={isOpen}
        onAdd={onAdd}
      />

      {isOpen && mode === 'accordion' && (
        <div className="sidebar-sub-menu">
          {children ? children : (
            options.map(opt => {
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const active = value === optValue;
              
              return (
                <button 
                  key={optValue}
                  className={`hub-nav-pill sub-pill ${active ? 'active' : ''}`}
                  onClick={() => onSelect?.(optValue)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{optLabel}</span>
                  {active && <Check size={14} />}
                </button>
              );
            })
          )}
        </div>
      )}

      {isOpen && mode === 'menu' && (
        <div className="studio-dropdown-menu">
          {allowSearch && (
             <div className="studio-dropdown-search-wrap">
               <Search size={14} className="search-icon" />
               <input 
                 autoFocus
                 placeholder={searchPlaceholder}
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
          )}
          <div className="studio-dropdown-items">
             {filteredOptions.length > 0 ? (
               filteredOptions.map(opt => {
                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                  const optValue = typeof opt === 'string' ? opt : opt.value;
                  const active = value === optValue;

                  return (
                    <button 
                      key={optValue}
                      className={`studio-dropdown-item ${active ? 'active' : ''}`}
                      onClick={() => {
                        onSelect?.(optValue);
                        setIsOpen(false);
                        setSearch("");
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{optLabel}</span>
                      {active && <Check size={14} />}
                    </button>
                  );
               })
             ) : (
               <div style={{ padding: '20px', textAlign: 'center', color: '#8E8484', fontSize: '0.85rem' }}>
                 No results found.
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
