import { useState } from 'react';
import { X, Trash2, Plus, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import './ManageCategoriesModal.css';

function ManageCategoriesModal({ isOpen, onClose, categories }) {
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    if (categories.includes(trimmed)) {
      alert('This category already exists.');
      return;
    }

    setSaving(true);
    try {
      const updatedCategories = [...categories, trimmed];
      await setDoc(doc(db, 'site_content', 'blog_settings'), {
        categories: updatedCategories
      }, { merge: true });
      setNewCategory('');
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (categoryToRemove) => {
    if (!window.confirm(`Are you sure you want to remove "${categoryToRemove}"? Existing posts with this category will keep it, but it won't appear in the filters.`)) {
      return;
    }

    setSaving(true);
    try {
      const updatedCategories = categories.filter(c => c !== categoryToRemove);
      await setDoc(doc(db, 'site_content', 'blog_settings'), {
        categories: updatedCategories
      }, { merge: true });
    } catch (err) {
      console.error('Error removing category:', err);
      alert('Failed to remove category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bcm-overlay">
      <div className="bcm-modal">
        <div className="bcm-header">
          <h2>Manage Categories</h2>
          <button className="bcm-close" onClick={onClose} disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <div className="bcm-content">
          <form onSubmit={handleAdd} className="bcm-add-form">
            <input 
              type="text" 
              placeholder="New category name..." 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              disabled={saving}
            />
            <button type="submit" disabled={!newCategory.trim() || saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span>Add</span>
            </button>
          </form>

          <div className="bcm-list">
            {categories.length === 0 ? (
              <div className="bcm-empty">No categories found.</div>
            ) : (
              categories.map(cat => (
                <div key={cat} className="bcm-item">
                  <span className="bcm-item-name">{cat}</span>
                  <button 
                    className="bcm-item-delete" 
                    onClick={() => handleRemove(cat)}
                    disabled={saving}
                    title="Remove Category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageCategoriesModal;
