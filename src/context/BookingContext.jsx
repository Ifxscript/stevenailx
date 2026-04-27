import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    services: [],
    guests: [],
    date: null,
    timeSlot: null,
    notes: '',
  });

  const openBookingDrawer = () => {
    setCurrentStep(0);
    setBookingData({ services: [], guests: [], date: null, timeSlot: null, notes: '' });
    setIsDrawerOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const openBookingWithService = (service) => {
    setCurrentStep(0);
    setBookingData({ 
      services: [{ 
        ...service, 
        id: `svc-${Date.now()}-${Math.random()}`,
        duration: service.duration || 30 // Ensure duration exists
      }], 
      guests: [], 
      date: null, 
      timeSlot: null, 
      notes: '' 
    });
    setIsDrawerOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeBookingDrawer = () => {
    setIsDrawerOpen(false);
    setCurrentStep(0);
    setBookingData({ services: [], guests: [], date: null, timeSlot: null, notes: '' });
    document.body.style.overflow = '';
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const goToStep = (step) => setCurrentStep(step);

  const updateBooking = (updates) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const addService = (service) => {
    setBookingData(prev => ({
      ...prev,
      services: [...prev.services, { ...service, id: `svc-${Date.now()}-${Math.random()}` }]
    }));
  };

  const removeService = (serviceId) => {
    setBookingData(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== serviceId)
    }));
  };

  const addGuest = () => {
    setBookingData(prev => ({
      ...prev,
      guests: [...prev.guests, { id: `guest-${Date.now()}`, name: '', services: [] }]
    }));
  };

  const removeGuest = (guestId) => {
    setBookingData(prev => ({
      ...prev,
      guests: prev.guests.filter(g => g.id !== guestId)
    }));
  };

  const updateGuest = (guestId, updates) => {
    setBookingData(prev => ({
      ...prev,
      guests: prev.guests.map(g => g.id === guestId ? { ...g, ...updates } : g)
    }));
  };

  const addGuestService = (guestId, service) => {
    setBookingData(prev => ({
      ...prev,
      guests: prev.guests.map(g => g.id === guestId ? {
        ...g,
        services: [...g.services, { ...service, id: `gsvc-${Date.now()}-${Math.random()}` }]
      } : g)
    }));
  };

  const removeGuestService = (guestId, serviceId) => {
    setBookingData(prev => ({
      ...prev,
      guests: prev.guests.map(g => g.id === guestId ? {
        ...g,
        services: g.services.filter(s => s.id !== serviceId)
      } : g)
    }));
  };

  const getTotalPrice = () => {
    const myTotal = bookingData.services.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
    const guestTotal = bookingData.guests.reduce((sum, g) => 
      sum + g.services.reduce((gSum, s) => gSum + (parseFloat(s.price) || 0), 0), 0);
    return myTotal + guestTotal;
  };

  const getTotalDuration = () => {
    const myDur = bookingData.services.reduce((sum, s) => sum + (s.duration || 30), 0);
    const guestDur = bookingData.guests.reduce((sum, g) => 
      sum + g.services.reduce((gSum, s) => gSum + (s.duration || 30), 0), 0);
    return myDur + guestDur;
  };

  return (
    <BookingContext.Provider value={{
      isDrawerOpen,
      currentStep,
      bookingData,
      openBookingDrawer,
      openBookingWithService,
      closeBookingDrawer,
      nextStep,
      prevStep,
      goToStep,
      updateBooking,
      addService,
      removeService,
      addGuest,
      removeGuest,
      updateGuest,
      addGuestService,
      removeGuestService,
      getTotalPrice,
      getTotalDuration,
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
