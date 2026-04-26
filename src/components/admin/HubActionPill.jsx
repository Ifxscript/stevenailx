import React from 'react';
import { Save, Loader2, X } from 'lucide-react';

/**
 * HubActionPill - The universal save/discard component for the SteveNailX Admin Hub.
 * Features intelligent, non-wrapping labels that automatically shorten on mobile.
 */
const HubActionPill = ({ 
  onSave, 
  onDiscard, 
  isSaving, 
  hasChanges = true, 
  saveLabel = 'Save All Changes',
  discardLabel = 'Discard Changes',
  variant = 'fixed' 
}) => {
  
  return (
    <div className={`hub-action-bar-wrap ${hasChanges ? 'visible' : ''} variant-${variant}`}>
      <div className="hub-action-pill">
        <button 
          type="button"
          className="action-btn discard" 
          onClick={onDiscard}
          disabled={isSaving}
        >
          <X size={18} className="show-mobile" />
          <span className="hide-mobile">{discardLabel}</span>
          <span className="show-mobile">Discard</span>
        </button>
        
        <button 
          type="button"
          className="action-btn save" 
          disabled={isSaving || !hasChanges} 
          onClick={onSave}
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          
          <div className="label-stack">
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <span className="hide-mobile">{saveLabel}</span>
                <span className="show-mobile">Save</span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default HubActionPill;
