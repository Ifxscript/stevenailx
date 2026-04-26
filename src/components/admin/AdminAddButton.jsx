import React from 'react';
import { Plus } from 'lucide-react';

export default function AdminAddButton({ label, icon, onClick, style, className = '' }) {
  return (
    <button 
      className={`action-btn save ${className}`} 
      onClick={onClick}
      style={{ padding: '8px 16px', fontSize: '0.8rem', width: 'fit-content', maxWidth: '160px', flexShrink: 0, ...style }}
    >
      {icon || <Plus size={14} />}
      {label && <span>{label}</span>}
    </button>
  );
}
