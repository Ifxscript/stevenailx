import React, { useState } from 'react';
import { Edit3, Trash2, MoreVertical, CheckCircle2, Clock, EyeOff } from 'lucide-react';
import './AdminMediaTile.css';

/**
 * AdminMediaTile - A flexible, slot-based media component.
 * Adapts its height and layout based on the provided text props.
 */
const AdminMediaTile = ({ 
  image, 
  title, 
  subtitle, 
  description,
  status,
  onEdit, 
  onDelete,
  style = {}
}) => {
  const [isTapped, setIsTapped] = useState(false);

  const statusMap = {
    live: { icon: <CheckCircle2 size={10} />, label: 'LIVE', class: 'amt-status-live' },
    approved: { icon: <CheckCircle2 size={10} />, label: 'LIVE', class: 'amt-status-live' },
    pending: { icon: <Clock size={10} />, label: 'PENDING', class: 'amt-status-pending' },
    hidden: { icon: <EyeOff size={10} />, label: 'HIDDEN', class: 'amt-status-hidden' }
  };

  const currentStatus = statusMap[status?.toLowerCase()] || null;
  
  // Slot detection
  const hasContent = title || subtitle || description;

  return (
    <div 
      className={`admin-media-tile-root ${isTapped ? 'amt-tapped' : ''}`}
      onClick={() => setIsTapped(!isTapped)}
      style={style}
    >
      {/* Media Layer: Fixed Anchor */}
      <div className="amt-preview-wrap">
        {image ? (
          <img src={image} alt={title || 'Media'} className="amt-image" loading="lazy" />
        ) : (
          <div className="amt-skeleton-placeholder">
            <div className="amt-shimmer" />
          </div>
        )}

        {currentStatus && (
          <div className={`amt-status-pill ${currentStatus.class}`}>
            {currentStatus.icon}
            <span>{currentStatus.label}</span>
          </div>
        )}

        <div className={`amt-action-overlay ${isTapped ? 'amt-visible' : ''}`}>
          <div className="amt-action-buttons">
            {onEdit && (
              <button 
                className="amt-btn amt-edit" 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
              >
                <Edit3 size={18} />
              </button>
            )}
            {onDelete && (
              <button 
                className="amt-btn amt-delete" 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {!isTapped && (
          <div className="amt-mobile-hint">
            <MoreVertical size={16} />
          </div>
        )}
      </div>

      {/* Content Layer: Flexible Slot System */}
      {hasContent && (
        <div className="amt-content-area">
          {title && <h4 className="amt-title">{title}</h4>}
          {subtitle && <p className="amt-subtitle">{subtitle}</p>}
          {description && <p className="amt-description">{description}</p>}
        </div>
      )}
    </div>
  );
};

export default AdminMediaTile;
