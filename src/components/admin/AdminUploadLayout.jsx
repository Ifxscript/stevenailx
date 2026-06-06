import React, { useState } from 'react';
import { UploadCloud, Loader2, Plus, Trash2, Edit3 } from 'lucide-react';
import { uploadToImgBB } from '../../lib/imgbb';
import HubActionPill from './HubActionPill';
import './AdminUploadLayout.css';

/**
 * AdminUploadLayout
 * A generic UI for uploading one or more items (image + configurable fields).
 * Handles batch uploading of files to ImgBB before returning the final array of items.
 */
const AdminUploadLayout = ({
  initialItems = [],
  itemConfigs = [],
  onSaveItems,
  onDiscard,
  saveLabel = "Save",
  discardLabel = "Cancel",
  isSaving = false,
}) => {
  const createEmptyItem = () => {
    const fields = {};
    itemConfigs.forEach(cfg => { fields[cfg.name] = cfg.defaultValue || ''; });
    return { id: `new-${Date.now()}-${Math.random()}`, image: null, file: null, previewUrl: null, fields, isNew: true };
  };

  const [items, setItems] = useState(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map(item => {
        const fields = {};
        itemConfigs.forEach(cfg => {
          fields[cfg.name] = item[cfg.name] !== undefined ? item[cfg.name] : (cfg.defaultValue || '');
        });
        return {
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          image: item.image || item.src || null,
          file: null,
          previewUrl: item.image || item.src || null,
          fields,
          originalItemData: item
        };
      });
    }
    return [createEmptyItem()];
  });
  
  const [localSaving, setLocalSaving] = useState(false);

  const handleAddItem = () => {
    setItems(prev => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleFieldChange = (id, fieldName, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, fields: { ...item.fields, [fieldName]: value } };
      }
      return item;
    }));
  };

  const handleFileChange = (e, indexToReplace = null) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length === 1 && indexToReplace !== null) {
      const file = files[0];
      setItems(prev => prev.map((item, idx) => {
        if (idx === indexToReplace) {
          return { ...item, file, previewUrl: URL.createObjectURL(file) };
        }
        return item;
      }));
    } else {
      const newItems = files.map(file => {
        let name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        name = name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        const fields = {};
        itemConfigs.forEach(cfg => {
          if (cfg.name === 'title' || cfg.name === 'name' || cfg.name === 'heading') {
             fields[cfg.name] = name;
          } else {
             fields[cfg.name] = cfg.defaultValue || '';
          }
        });

        return {
          id: `item-${Date.now()}-${Math.random()}`,
          image: null,
          file,
          previewUrl: URL.createObjectURL(file),
          fields,
          isNew: true
        };
      });
      
      setItems(prev => {
        if (indexToReplace !== null) {
          const list = [...prev];
          list.splice(indexToReplace, 1, ...newItems);
          return list;
        } else {
           if (prev.length === 1 && !prev[0].file && !prev[0].image && prev[0].isNew) {
             return newItems; // overwrite the initial blank item
           }
           return [...prev, ...newItems];
        }
      });
    }
  };

  const handleActionSave = async () => {
    // Basic validation
    for (const item of items) {
      for (const cfg of itemConfigs) {
        if (cfg.required && !item.fields[cfg.name]) {
          alert(`Please fill in all required fields (missing: ${cfg.placeholder || cfg.name}).`);
          return;
        }
      }
    }

    setLocalSaving(true);
    try {
      const finalItems = [];
      for (const item of items) {
        let finalImageUrl = item.image;
        if (item.file) {
          finalImageUrl = await uploadToImgBB(item.file);
        }
        
        const returnObj = {
          ...(item.originalItemData || {}),
          ...item.fields,
        };
        
        // Ensure image prop is populated (parent can map to 'src' if needed)
        returnObj.image = finalImageUrl;
        
        if (!returnObj.id) {
           returnObj.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        }
        
        finalItems.push(returnObj);
      }
      
      if (onSaveItems) {
        onSaveItems(finalItems);
      }
    } catch (err) {
      console.error("Upload/Save failed:", err);
      alert("Failed to save some items.");
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="admin-upload-layout-root">
      <div className="aul-sheet">
        {(isSaving || localSaving) && (
          <div className="aul-upload-overlay" style={{ zIndex: 100 }}>
            <Loader2 className="aul-spin" size={26} />
            <span>SAVING AND UPLOADING...</span>
          </div>
        )}

        <div className="aul-multi-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item, index) => (
            <div key={item.id} className="aul-multi-item" style={{ background: '#fcfcfc', borderRadius: '12px', padding: '16px', border: '1px solid #f0efea', position: 'relative', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {items.length > 1 && (
                <button className="aul-multi-remove-btn" type="button" onClick={() => handleRemoveItem(item.id)} style={{ position: 'absolute', top: -8, right: -8, background: '#fff', border: '1px solid #eee', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#e53935', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <Trash2 size={14} />
                </button>
              )}
              
              <div className="aul-multi-thumb-wrap" style={{ width: '80px', height: '80px', flexShrink: 0, position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.previewUrl ? (
                  <img src={item.previewUrl} className="aul-multi-thumb" alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UploadCloud size={24} color="#ccc" />
                )}
                
                <label style={{ position: 'absolute', bottom: 4, right: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <Edit3 size={12} color="#4a1a26" />
                  <input type="file" className="aul-hidden-input" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, index)} accept="image/*" multiple />
                </label>
              </div>

              <div className="aul-multi-fields" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {itemConfigs.map(cfg => {
                  if (cfg.type === 'textarea') {
                    return (
                      <textarea 
                        key={cfg.name}
                        className="aul-multi-field aul-multi-textarea" 
                        placeholder={cfg.placeholder} 
                        value={item.fields[cfg.name]} 
                        onChange={(e) => handleFieldChange(item.id, cfg.name, e.target.value)} 
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0dcd0', background: '#fff', fontSize: '0.9rem', width: '100%', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }}
                      />
                    );
                  } else if (cfg.type === 'select') {
                    return (
                      <select 
                        key={cfg.name}
                        className="aul-multi-field" 
                        value={item.fields[cfg.name]} 
                        onChange={(e) => handleFieldChange(item.id, cfg.name, e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0dcd0', background: '#fff', fontSize: '0.9rem', width: '100%', appearance: 'none' }}
                      >
                        <option value="" disabled>{cfg.placeholder}</option>
                        {cfg.options?.map(opt => (
                          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                        ))}
                      </select>
                    );
                  } else {
                    return (
                      <input 
                        key={cfg.name}
                        type="text" 
                        className="aul-multi-field" 
                        placeholder={cfg.placeholder} 
                        value={item.fields[cfg.name]} 
                        onChange={(e) => handleFieldChange(item.id, cfg.name, e.target.value)} 
                        style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0dcd0', background: '#fff', fontSize: '0.9rem', width: '100%' }}
                      />
                    );
                  }
                })}
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px', borderRadius: '12px', border: '1.5px dashed #e0dcd0', background: 'transparent', color: '#4a1a26', fontWeight: 700, cursor: 'pointer', justifyContent: 'center', marginTop: '4px' }}>
            <Plus size={18} />
            <span>Add Another Item</span>
          </button>
        </div>
      </div>

      <div className="aul-action-wrap">
        <HubActionPill
          onSave={handleActionSave}
          onDiscard={onDiscard}
          isSaving={isSaving || localSaving}
          hasChanges={true}
          saveLabel={items.length > 1 ? `Upload ${items.length} Items` : saveLabel}
          discardLabel={discardLabel}
          variant="inline"
        />
      </div>
    </div>
  );
};

export default AdminUploadLayout;
