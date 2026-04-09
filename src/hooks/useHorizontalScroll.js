import { useEffect } from 'react';

/**
 * Custom hook to redirect vertical scroll/touch to horizontal scroll
 * for a specific grid within a section on mobile devices.
 */
export function useHorizontalScroll(sectionRef, gridRef) {
  useEffect(() => {
    const sectionEl = sectionRef.current;
    const gridEl = gridRef.current;
    if (!sectionEl || !gridEl) return undefined;

    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    const getMaxScrollLeft = () => Math.max(0, gridEl.scrollWidth - gridEl.clientWidth);

    const isSectionActive = () => {
      const rect = sectionEl.getBoundingClientRect();
      // Section is active if it's mostly in view
      return rect.top <= window.innerHeight * 0.8 && rect.bottom >= window.innerHeight * 0.2;
    };

    const canConsumeDelta = (delta) => {
      const maxScroll = getMaxScrollLeft();
      if (maxScroll <= 0) return false;
      if (delta > 0) return gridEl.scrollLeft < maxScroll - 1;
      if (delta < 0) return gridEl.scrollLeft > 1;
      return false;
    };

    const routeScrollToGrid = (delta) => {
      if (!isMobile() || !isSectionActive() || !canConsumeDelta(delta)) return false;
      gridEl.scrollLeft += delta;
      return true;
    };

    const handleWheel = (event) => {
      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (routeScrollToGrid(dominantDelta)) {
        event.preventDefault();
      }
    };

    let lastTouchX = 0;
    let lastTouchY = 0;

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
    };

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      const moveX = touch.clientX - lastTouchX;
      const moveY = touch.clientY - lastTouchY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;

      const dominantDelta = Math.abs(moveX) > Math.abs(moveY) ? -moveX : -moveY;
      if (routeScrollToGrid(dominantDelta)) {
        event.preventDefault();
      }
    };

    sectionEl.addEventListener('wheel', handleWheel, { passive: false });
    sectionEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    sectionEl.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      sectionEl.removeEventListener('wheel', handleWheel);
      sectionEl.removeEventListener('touchstart', handleTouchStart);
      sectionEl.removeEventListener('touchmove', handleTouchMove);
    };
  }, [sectionRef, gridRef]);
}
