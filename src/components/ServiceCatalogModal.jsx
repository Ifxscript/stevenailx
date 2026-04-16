import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import './ServiceCatalogModal.css';

const formatPrice = (price) => {
  if (price === undefined) return null;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('NGN', '₦');
};

const formatRange = (from, to) => {
  if (from && to) return `${formatPrice(from)} - ${formatPrice(to)}`;
  if (from) return `From ${formatPrice(from)}`;
  return '';
};

function ServiceCatalogModal({ isOpen, onClose, catalog }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const scrollContainerRef = useRef(null);
  const navRef = useRef(null);
  const categoryRefs = useRef({});
  const isManualScrolling = useRef(false);

  // Reset category on open and set initial active category
  useEffect(() => {
    if (isOpen && catalog && catalog.services.length > 0) {
      setActiveCategory(catalog.services[0].category);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, catalog]);

  // Scroll Spy Logic
  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current) return;

    const options = {
      root: scrollContainerRef.current,
      rootMargin: '-100px 0px -70% 0px', // Focus trigger at top third of modal
      threshold: 0
    };

    const observerCallback = (entries) => {
      if (isManualScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveCategory(entry.target.getAttribute('data-category'));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, options);
    
    // Set up tracking for each section
    Object.values(categoryRefs.current).forEach(section => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [isOpen]);

  // Sync horizontal scroll of the tab bar
  useEffect(() => {
    if (activeCategory && navRef.current) {
      const activeTab = navRef.current.querySelector(`.cat-tab.active`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCategory]);

  const scrollToCategory = (category) => {
    isManualScrolling.current = true;
    setActiveCategory(category);
    
    const element = categoryRefs.current[category];
    if (element) {
      // Use scrollIntoView on the element within its container
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Release manual scroll lock after animation
    setTimeout(() => {
      isManualScrolling.current = false;
    }, 800);
  };

  if (!isOpen || !catalog) return null;

  return (
    <AnimatePresence>
      <div className="catalog-overlay">
        <motion.div 
          className="catalog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        <motion.div 
          className="catalog-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="sheet-handle" onClick={onClose} />
          
          <header className="catalog-header">
            <div className="header-top">
              <h3>{catalog.title}</h3>
              <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>
            
            <nav className="category-nav" ref={navRef}>
              {catalog.services.map((cat) => (
                <button 
                  key={cat.category}
                  className={`cat-tab ${activeCategory === cat.category ? 'active' : ''}`}
                  onClick={() => scrollToCategory(cat.category)}
                >
                  <span className="tab-label">{cat.category}</span>
                  {activeCategory === cat.category && (
                    <motion.div 
                      className="active-indicator" 
                      layoutId="activeTab"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </header>

          <div className="catalog-content" ref={scrollContainerRef}>
            {catalog.services.map((cat) => (
              <section 
                key={cat.category} 
                className="catalog-section"
                data-category={cat.category}
                ref={el => categoryRefs.current[cat.category] = el}
              >
                <h4 className="category-title">{cat.category}</h4>
                
                {cat.sections.map((section, sIdx) => (
                  <div key={sIdx} className="service-group">
                    {section.title && <h5 className="section-subheading">{section.title}</h5>}
                    {section.description && <p className="section-description">{section.description}</p>}
                    
                    <div className="service-items-list">
                      {section.items.map((item) => (
                        <div key={item.id} className="service-row">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            {item.unit && <span className="item-unit">{item.unit}</span>}
                          </div>
                          <div className="item-action">
                            <span className="item-price">
                              {item.price_note ? item.price_note : 
                               (item.price ? formatPrice(item.price) : formatRange(item.price_from, item.price_to))}
                            </span>
                            <button className="btn-book-dummy">Book</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
            
            <div className="catalog-footer-hint">
              <p>All prices are subject to change based on custom designs and requirements.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ServiceCatalogModal;
