import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import { galleryData } from '../data/gallery';
import './GalleryPage.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % galleryData.length;
    setCurrentIndex(nextIdx);
    setSelectedImage(galleryData[nextIdx].image);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + galleryData.length) % galleryData.length;
    setCurrentIndex(prevIdx);
    setSelectedImage(galleryData[prevIdx].image);
  };

  return (
    <div className="gallery-page">
      <BackButton />

      <header className="gallery-page-header">
        <motion.div 
          className="header-content"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <h1>PORTFOLIO</h1>
          <p className="subtitle">A visual celebration of meticulous craftsmanship and high-fashion hair and beauty.</p>
        </motion.div>
      </header>

      <main className="gallery-page-content">
        <motion.div 
          className="gallery-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {galleryData.map((item, index) => (
            <motion.div 
              key={item.id}
              className="gallery-item"
              variants={fadeUp}
              onClick={() => openModal(item.image, index)}
            >
              <div className="gallery-image-container">
                <img src={item.image} alt={item.title} />
                <div className="gallery-overlay">
                  <span>{item.title}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <button className="lightbox-close" onClick={closeModal} aria-label="Close">
              <X size={32} />
            </button>
            
            <button className="lightbox-nav prev" onClick={prevImage} aria-label="Previous">
              <ChevronLeft size={48} strokeWidth={1} />
            </button>
            
            <motion.div 
              className="lightbox-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Fullscreen work" />
              <div className="lightbox-info">
                <span>{galleryData[currentIndex].title}</span>
              </div>
            </motion.div>

            <button className="lightbox-nav next" onClick={nextImage} aria-label="Next">
              <ChevronRight size={48} strokeWidth={1} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

export default GalleryPage;
