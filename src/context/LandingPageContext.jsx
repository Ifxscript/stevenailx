import React, { createContext, useContext, useState, useEffect } from 'react';
import { landingPageData as initialData } from '../data/landingPageData';

const LandingPageContext = createContext();

export const LandingPageProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // In a real scenario, this would be a fetch call to an API
  const refreshData = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    // Here you would fetch from your DB/Admin panel API
    // const response = await fetch('/api/landing-page');
    // const newData = await response.json();
    // setData(newData);
    setLoading(false);
  };

  return (
    <LandingPageContext.Provider value={{ ...data, loading, refreshData }}>
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
