import React, { useState } from 'react';
import { UploadCloud, Loader2, Save } from 'lucide-react';
import { uploadToImgBB } from '../../lib/imgbb';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import HubActionPill from './HubActionPill';
import './AdminUploadLayout.css';

/**
 * AdminUploadLayout - Pixel-perfect redesign from user specification.
 */
const AdminUploadLayout = ({
  initialImage = null,
  onUploadSuccess,
  onSave,
  onDiscard,
  saveLabel = "Save",
  discardLabel = "Discard",
  isSaving = false,
  canSave = true,
  children
}) => {
  const [image, setImage] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [internalValues, setInternalValues] = useState({});
  const [localSaving, setLocalSaving] = useState(false);

  // Recursively process children to intercept inputs and manage state locally
  // This solves the stale closure issue when this component is rendered inside a static modal
  const processChildren = (nodes) => {
    return React.Children.map(nodes, (child, index) => {
      if (!React.isValidElement(child)) return child;

      const isInput = child.type === 'input' || child.type === 'textarea';

      if (isInput) {
        let key = child.props.name;
        if (!key) {
          const ph = (child.props.placeholder || '').toLowerCase();
          if (ph.includes('name')) key = 'name';
          else if (ph.includes('role')) key = 'role';
          else if (ph.includes('heading')) key = 'heading';
          else if (ph.includes('title')) key = 'title';
          else if (ph.includes('support text') || ph.includes('subheading')) key = 'subheading';
          else if (ph.includes('description')) key = 'description';
          else key = `field-${index}`;
        }

        const initialVal = child.props.value !== undefined ? child.props.value : (child.props.defaultValue || '');
        const currentValue = internalValues[key] !== undefined ? internalValues[key] : initialVal;

        return React.cloneElement(child, {
          value: currentValue,
          onChange: (e) => {
            setInternalValues(prev => ({ ...prev, [key]: e.target.value }));
            if (child.props.onChange) {
              child.props.onChange(e);
            }
          }
        });
      }

      if (child.props && child.props.children) {
        return React.cloneElement(child, {
          children: processChildren(child.props.children)
        });
      }

      return child;
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadToImgBB(file);
      setImage(url);
      if (onUploadSuccess) onUploadSuccess(url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleActionSave = async () => {
    setLocalSaving(true);
    try {
      const path = window.location.pathname;
      const docRef = doc(db, 'site_content', 'landing_page');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        let fieldPath = null;
        let targetArray = [];

        if (path.includes('team')) {
          fieldPath = 'team.members';
          targetArray = data.team?.members || [];
        } else if (path.includes('portfolio')) {
          fieldPath = 'gallery.items';
          targetArray = data.gallery?.items || [];
        } else if (path.includes('content')) {
          fieldPath = 'hero.slides';
          targetArray = data.hero?.slides || [];
        } else if (path.includes('services')) {
          const activeTabs = Array.from(document.querySelectorAll('.hub-tab.active'));
          const isOther = activeTabs.some(t => t.innerText.toLowerCase().includes('other'));
          fieldPath = isOther ? 'services.otherItems' : 'services.items';
          targetArray = isOther ? (data.services?.otherItems || []) : (data.services?.items || []);
        }

        if (fieldPath) {
          const isSlide = path.includes('content');
          const finalImageProp = isSlide ? 'src' : 'image';
          const newImage = image || initialImage;

          let existingIndex = -1;
          if (initialImage) {
            existingIndex = targetArray.findIndex(item => item[finalImageProp] === initialImage);
          }
          
          if (existingIndex === -1 && (internalValues.name || internalValues.title)) {
            existingIndex = targetArray.findIndex(item => 
              (internalValues.name && item.name === internalValues.name) ||
              (internalValues.title && item.title === internalValues.title)
            );
          }

          // Gather final values including untouched inputs
          const finalValues = { ...internalValues };
          React.Children.forEach(children, (child, index) => {
            if (!React.isValidElement(child)) return;
            const isInput = child.type === 'input' || child.type === 'textarea';
            if (isInput) {
              let key = child.props.name;
              if (!key) {
                const ph = (child.props.placeholder || '').toLowerCase();
                if (ph.includes('name')) key = 'name';
                else if (ph.includes('role')) key = 'role';
                else if (ph.includes('heading')) key = 'heading';
                else if (ph.includes('title')) key = 'title';
                else if (ph.includes('support text') || ph.includes('subheading')) key = 'subheading';
                else if (ph.includes('description')) key = 'description';
                else key = `field-${index}`;
              }
              if (finalValues[key] === undefined) {
                 finalValues[key] = child.props.value !== undefined ? child.props.value : (child.props.defaultValue || '');
              }
            }
          });

          let newItem = { ...finalValues, [finalImageProp]: newImage };
          if (path.includes('portfolio') && !newItem.category) newItem.category = "nails";

          let newArray = [...targetArray];
          if (existingIndex >= 0) {
            newArray[existingIndex] = { ...newArray[existingIndex], ...newItem };
          } else {
            newItem.id = Date.now().toString();
            newArray.push(newItem);
          }

          await updateDoc(docRef, { [fieldPath]: newArray });
        }
      }

      // Bypass the stale closure alert by closing directly
      if (onDiscard) onDiscard();
      else if (onSave) onSave();
      
      // Attempt to refresh the page gently to show new data since local state wasn't updated
      window.location.reload();

    } catch (err) {
      console.error("Firestore save failed:", err);
      if (onSave) onSave(); // fallback
    } finally {
      setLocalSaving(false);
    }
  };

  return (
    <div className="admin-upload-layout-root">

      {/* THE SHEET CARD */}
      <div className="aul-sheet">

        {/* DROPZONE */}
        <div className="aul-dropzone">
          <input type="file" className="aul-hidden-input" onChange={handleFileChange} accept="image/*" id="aul-file-input" />

          {isUploading && (
            <div className="aul-upload-overlay">
              <Loader2 className="aul-spin" size={26} />
              <span>UPDATING...</span>
            </div>
          )}

          {image && !isUploading ? (
            <div className="aul-preview-container">
              <img src={image} alt="Preview" className="aul-preview-image" />
              <label htmlFor="aul-file-input" className="aul-change-overlay">
                <span className="aul-change-btn">Change Photo</span>
              </label>
            </div>
          ) : (
            <label htmlFor="aul-file-input" className="aul-placeholder">
              <div className="aul-icon-square">
                <UploadCloud size={26} strokeWidth={1.8} />
              </div>
              <span className="aul-dropzone-label">Select Media</span>
              <span className="aul-dropzone-sub">Tap to browse gallery</span>
            </label>
          )}
        </div>

        {/* DETAILS SECTION (Children are inputs) */}
        <div className="aul-details-section">
          {processChildren(children)}
        </div>
      </div>

      {/* ACTION PILL OUTSIDE CARD */}
      <div className="aul-action-wrap">
        <HubActionPill
          onSave={handleActionSave}
          onDiscard={onDiscard}
          isSaving={isSaving || localSaving}
          hasChanges={canSave && (!!image || !!initialImage || Object.keys(internalValues).length > 0)}
          saveLabel={saveLabel}
          discardLabel={discardLabel}
          variant="inline"
        />
      </div>

    </div>
  );
};

export default AdminUploadLayout;
