import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingPage } from '../context/LandingPageContext';
import { useBooking } from '../context/BookingContext';
import './MobileStickyBar.css';

const MobileStickyBar = () => {
  const { totalServicesCount, footer } = useLandingPage();
  const { openBookingDrawer } = useBooking();
  const [isFloating, setIsFloating] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const wrapperRef = useRef(null);
  
  // Extract WhatsApp link from socials for consistency
  
  useEffect(() => {
    // Entrance logic - show after a short delay
    const timer = setTimeout(() => setIsVisible(true), 800);

    const handleScroll = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // The threshold is when the bottom of the viewport reaches the natural 
      // position (bottom) of the sticky bar slot.
      // We use rect.top and window height to determine if the slot has arrived.
      const barHeight = 80; // Should match CSS
      
      // If the top of the wrapper is still below the 'floating' threshold, stay fixed.
      // Otherwise, dock it.
      if (rect.top > viewportHeight - barHeight) {
        setIsFloating(true);
      } else {
        setIsFloating(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="sticky-bar-wrapper" ref={wrapperRef}>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={`mobile-sticky-bar ${isFloating ? 'floating' : 'docked'}`}
            initial={isFloating ? { y: 100, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="sticky-bar-content">
              <div className="sticky-bar-left">
                <span className="services-count">
                  {totalServicesCount} services available
                </span>
              </div>
              <div className="sticky-bar-right">
                <button 
                  className="sticky-book-btn"
                  onClick={openBookingDrawer}
                >
                  Book now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileStickyBar;
