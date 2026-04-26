import { db } from './firebase';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';

/**
 * Sets up a real-time listener for the landing page data.
 * Returns an unsubscribe function.
 */
export const subscribeLiveData = (callback) => {
  // 1. Content listener
  const unsubContent = onSnapshot(
    doc(db, "site_content", "landing_page"),
    async (contentSnap) => {
      try {
        const servicesSnap = await getDocs(collection(db, "services"));
        const catalog = {};
        servicesSnap.forEach(d => { catalog[d.id] = d.data(); });
        if (contentSnap.exists()) {
          callback({ type: 'content', content: contentSnap.data(), catalog });
        }
      } catch (err) { console.error("Content sync error:", err); }
    }
  );

  // 2. Reviews listener
  const unsubReviews = onSnapshot(
    collection(db, "reviews"),
    (snap) => {
      const reviews = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback({ type: 'reviews', reviews });
    }
  );

  return () => { unsubContent(); unsubReviews(); };
};

/**
 * One-shot fetch (kept as fallback).
 */
export const fetchLiveData = async () => {
  const { getDoc } = await import('firebase/firestore');
  try {
    const contentSnap = await getDoc(doc(db, "site_content", "landing_page"));
    const servicesSnap = await getDocs(collection(db, "services"));
    const catalog = {};
    servicesSnap.forEach(d => {
      catalog[d.id] = d.data();
    });

    if (!contentSnap.exists()) {
      console.warn("No 'landing_page' document found in Firestore.");
      return null;
    }

    return {
      content: contentSnap.data(),
      catalog: catalog
    };
  } catch (error) {
    console.error("Cloud Fetch failed:", error);
    return null;
  }
};
