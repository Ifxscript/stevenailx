import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import './PortfolioModal.css';

function PortfolioModal({ isOpen, onClose, images }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  // Derive tabs dynamically from actual image data so they always match what's in Firestore
  const categories = useMemo(() => {
    const seen = new Set();
    const unique = [];
    (images || []).forEach(img => {
      if (img.category) {
        const key = img.category.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(img.category); }
      }
    });
    return [{ id: 'all', label: 'All Work' }, ...unique.map(cat => ({ id: cat.toLowerCase(), label: cat }))];
  }, [images]);

  // Case-insensitive filter so "Lashes" and "lashes" both match the 'lashes' tab
  const filteredImages = activeTab === 'all'
    ? images
    : (images || []).filter(img => (img.category || '').toLowerCase() === activeTab);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setSelectedImage(null); // Reset zoom
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="catalog-overlay portfolio-overlay">
        <motion.div 
          className="catalog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <motion.div 
          className="catalog-sheet portfolio-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="sheet-handle" onClick={onClose} />
          
          <header className="catalog-header">
            <div className="header-top">
              <h3>Our Work</h3>
              <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>
            
            <nav className="category-nav">
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  className={`cat-tab ${activeTab === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </header>

          <div className="catalog-content portfolio-content">
            <motion.div 
              className="portfolio-grid"
              layout
            >
              <AnimatePresence mode='popLayout'>
                {filteredImages.map((item) => (
                  <motion.div 
                    key={item.id}
                    className="portfolio-item"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedImage(item)}
                  >
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div className="item-overlay">
                      <Maximize2 size={24} color="#fff" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            
            <div className="catalog-footer-hint">
              <p>Showcasing the artistry and precision of Stevenailx Studio.</p>
            </div>
          </div>
        </motion.div>

        {/* Lightbox Zoom */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              className="lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
            >
              <motion.div 
                className="lightbox-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
                  <X size={32} />
                </button>
                <img src={selectedImage.image} alt={selectedImage.title} />
                <div className="lightbox-caption">
                  <h4>{selectedImage.title}</h4>
                  <p>{selectedImage.category.toUpperCase()}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}

export default PortfolioModal;
