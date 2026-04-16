import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SectionTabs.css';

const SECTIONS = [
  { id: 'services', label: 'SERVICES' },
  { id: 'beauty', label: 'BEAUTY' },
  { id: 'portfolio', label: 'PORTFOLIO' },
  { id: 'reviews', label: 'REVIEWS' },
  { id: 'about', label: 'LOCATION' }
];

function SectionTabs() {
  const [activeSection, setActiveSection] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const handleScrollVisibility = () => {
      const heroSection = document.getElementById('home');
      const footerSection = document.querySelector('footer');
      
      if (!heroSection) return;

      const heroRect = heroSection.getBoundingClientRect();
      const footerRect = footerSection?.getBoundingClientRect();

      // Show after hero is passed (top of hero is negative by its height)
      // Hide if footer is in view
      const pastHero = heroRect.bottom <= 80; // Assuming dynamic header height
      const reachedFooter = footerRect ? footerRect.top <= (window.innerHeight - 50) : false;

      setIsVisible(pastHero && !reachedFooter);
    };

    window.addEventListener('scroll', handleScrollVisibility);
    return () => window.removeEventListener('scroll', handleScrollVisibility);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -80% 0px', // Focus on top portion
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isVisible]);

  // Handle horizontal scroll sync for active tab
  useEffect(() => {
    if (activeSection && scrollRef.current) {
      const activeTab = scrollRef.current.querySelector(`.tab-item[data-id="${activeSection}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeSection]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 60; // Tab bar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="section-tabs-container"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
          exit={{ y: -60 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-tabs-scroll" ref={scrollRef}>
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                data-id={section.id}
                className={`tab-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => scrollToSection(section.id)}
              >
                {section.label}
                {activeSection === section.id && (
                  <motion.div 
                    className="tab-underline"
                    layoutId="activeTabUnderline"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SectionTabs;
