import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function AdminDeleteSectionButton({ onDelete, label = "Delete Section" }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffebee', padding: '6px 12px', borderRadius: '100px' }}>
        <AlertTriangle size={14} color="#d32f2f" />
        <span style={{ fontSize: '0.8rem', color: '#d32f2f', fontWeight: 600 }}>Confirm?</span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
            onDelete(e);
          }} 
          style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: '100px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Yes
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }} 
          style={{ background: 'transparent', color: '#666', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '4px 6px' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        setConfirming(true);
      }}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        padding: '8px 16px', 
        fontSize: '0.85rem', 
        fontWeight: 600,
        color: '#d32f2f', 
        background: 'rgba(211, 47, 47, 0.08)', 
        border: 'none', 
        borderRadius: '100px',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      <Trash2 size={14} />
      <span>{label}</span>
    </button>
  );
}
