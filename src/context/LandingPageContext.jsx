import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeLiveData } from '../lib/dbUtils';

const LandingPageContext = createContext();

export const LandingPageProvider = ({ children }) => {
  const [data, setData] = useState({
    brand: {},
    hero: { slides: [] },
    services: { items: [], otherItems: [] },
    gallery: { items: [] },
    about: { hours: [] },
    footer: { navColumns: [] }
  });
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time multi-collection listener
    const unsubscribe = subscribeLiveData((liveData) => {
      if (!liveData) return;

      if (liveData.type === 'content') {
        setData(prev => ({
          ...prev,
          ...liveData.content,
          servicesCatalog: liveData.catalog
        }));
      } else if (liveData.type === 'reviews') {
        setAllReviews(liveData.reviews);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Temporary Migration Strategy
  useEffect(() => {
    const migrate = async () => {
      // If we have legacy items in content but nothing in the new reviews collection yet
      if (allReviews.length === 0 && data.reviews?.items?.length > 0) {
        console.log("Migration: Moving reviews to collection...");
        const { setDoc, doc, collection } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        
        for (const item of data.reviews.items) {
          const reviewId = `legacy_${item.id}`;
          await setDoc(doc(collection(db, 'reviews'), reviewId), {
            ...item,
            id: reviewId,
            isLegacy: true,
            isVerified: false,
            createdAt: new Date(item.date).toISOString()
          });
        }
      }
    };
    migrate();
  }, [allReviews.length, data.reviews?.items]);

  const servicesCatalog = data?.servicesCatalog || {};
  
  // Dynamically count total services in the real-time catalog
  const totalServicesCount = React.useMemo(() => {
    return Object.values(servicesCatalog).reduce((acc, category) => {
      // Each category has a 'services' array
      const services = category.services || [];
      const categoryCount = services.reduce((sAcc, service) => {
        // Each service has a 'sections' array
        const sections = service.sections || [];
        const serviceCount = sections.reduce((secAcc, section) => {
          // Each section has an 'items' array
          return secAcc + (section.items?.length || 0);
        }, 0);
        return sAcc + serviceCount;
      }, 0);
      return acc + categoryCount;
    }, 0);
  }, [servicesCatalog]);

  const value = {
    ...data,
    totalServicesCount,
    services: {
      title: data?.services?.title || "Trending nail art",
      subtitle: data?.services?.subtitle || "Other services",
      items: data?.services?.items || [],
      otherItems: data?.services?.otherItems || [],
    },
    servicesCatalog: data?.servicesCatalog || {},
    gallery: {
      title: data?.gallery?.title || "Portfolio",
      exploreLabel: data?.gallery?.exploreLabel || "Explore More",
      items: data?.gallery?.items || []
    },
    reviews: {
      title: data?.reviews?.title || "Reviews",
      items: allReviews // NEW: serve from dedicated collection
    },
    team: {
      title: data?.team?.title || "Team",
      members: data?.team?.members || []
    },
    about: {
      heading: data?.about?.heading || "About",
      description: data?.about?.description || "",
      address: data?.about?.address || "",
      directionsUrl: data?.about?.directionsUrl || "#",
      mapImage: data?.about?.mapImage || "",
      openingTitle: data?.about?.openingTitle || "Opening times",
      hours: data?.about?.hours || []
    },
    footer: {
      navColumns: data?.footer?.navColumns || [],
      copyright: data?.footer?.copyright || "SteveNailX. All Rights Reserved.",
      language: data?.footer?.language || "English"
    },
    socials: data?.socials || [],
    portfolio: data?.gallery?.items || [],
    loading,
  };

  // Skeleton shimmer loading screen
  if (loading) {
    return (
      <>
        <style>{`
          .skeleton-page { min-height: 100vh; background: #fff5f5; }
          .skeleton-nav { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; }
          .skeleton-logo { width: 160px; height: 28px; border-radius: 6px; }
          .skeleton-menu { width: 28px; height: 28px; border-radius: 4px; }
          .skeleton-hero { height: 55vh; margin: 8px 16px; border-radius: 16px; }
          .skeleton-section { padding: 24px 16px; }
          .skeleton-title { width: 180px; height: 22px; border-radius: 6px; margin-bottom: 16px; }
          .skeleton-cards { display: flex; gap: 12px; overflow: hidden; }
          .skeleton-card { min-width: 200px; height: 240px; border-radius: 12px; flex-shrink: 0; }
          .shimmer {
            background: linear-gradient(110deg, #f0e0e0 8%, #f5eded 18%, #f0e0e0 33%);
            background-size: 200% 100%;
            animation: shimmer 1.5s linear infinite;
          }
          @keyframes shimmer {
            to { background-position: -200% 0; }
          }
        `}</style>
        <div className="skeleton-page">
          <div className="skeleton-nav">
            <div className="skeleton-logo shimmer"></div>
            <div className="skeleton-menu shimmer"></div>
          </div>
          <div className="skeleton-hero shimmer"></div>
          <div className="skeleton-section">
            <div className="skeleton-title shimmer"></div>
            <div className="skeleton-cards">
              <div className="skeleton-card shimmer"></div>
              <div className="skeleton-card shimmer"></div>
              <div className="skeleton-card shimmer"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <LandingPageContext.Provider value={value}>
      {children}
    </LandingPageContext.Provider>
  );
};

export const useLandingPage = () => {
  const context = useContext(LandingPageContext);
  if (!context) {
    throw new Error('useLandingPage must be used within a LandingPageProvider');
  }
  return context;
};
