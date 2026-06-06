import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useBooking } from '../../context/BookingContext';
import { Plus, Check, ChevronDown, ChevronRight, ArrowLeft, X, Users } from 'lucide-react';

function ServiceSelector() {
  const {
    bookingData, addService, removeService,
    addGuest, removeGuest, updateGuest,
    addGuestService, removeGuestService,
    nextStep, getTotalPrice
  } = useBooking();

  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState({});
  const [guestViewId, setGuestViewId] = useState(null);
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const serviceRefs = useRef({});

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'services'));
        const data = {};
        snapshot.forEach(doc => { data[doc.id] = doc.data(); });
        setCatalog(data);
        const firstKey = Object.keys(data)[0];
        if (firstKey) setExpandedCats({ [firstKey]: true });
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Auto-scroll to pre-selected service on open
  useEffect(() => {
    if (!loading && bookingData.services.length > 0) {
      const selectedSvc = bookingData.services[0];
      let targetCatId = null;
      Object.entries(catalog).forEach(([catId, catData]) => {
        catData.services?.forEach(svc => {
          svc.sections?.forEach(section => {
            if (section.items?.some(item => item.name === selectedSvc.name)) targetCatId = catId;
          });
        });
      });
      if (targetCatId) {
        setExpandedCats(prev => ({ ...prev, [targetCatId]: true }));
        setTimeout(() => {
          const el = serviceRefs.current[selectedSvc.name];
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [loading, catalog, bookingData.services]);

  const toggleCat = (id) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  const isSelected = (name) => bookingData.services.some(s => s.name === name);
  const isGuestSelected = (guestId, name) => {
    const guest = bookingData.guests.find(g => g.id === guestId);
    return guest?.services.some(s => s.name === name);
  };

  const handleToggleService = (item, section) => {
    if (isSelected(item.name)) {
      const found = bookingData.services.find(s => s.name === item.name);
      if (found) removeService(found.id);
    } else {
      addService({ name: item.name, price: parseFloat(item.price) || parseFloat(item.price_from) || 0, duration: 30, category: section?.title || '' });
    }
  };

  const handleToggleGuestService = (guestId, item, section) => {
    if (isGuestSelected(guestId, item.name)) {
      const guest = bookingData.guests.find(g => g.id === guestId);
      const found = guest?.services.find(s => s.name === item.name);
      if (found) removeGuestService(guestId, found.id);
    } else {
      addGuestService(guestId, { name: item.name, price: parseFloat(item.price) || parseFloat(item.price_from) || 0, duration: 30, category: section?.title || '' });
    }
  };

  const handleAddGuest = () => {
    const guestId = `guest-${Date.now()}`;
    addGuest(guestId);
    setGuestSheetOpen(false);
    setGuestViewId(guestId);
  };

  const openGuestEdit = (guestId) => {
    setGuestSheetOpen(false);
    setTimeout(() => setGuestViewId(guestId), 200);
  };

  const canContinue = bookingData.services.length > 0;

  if (loading) return <div className="step-loading">Loading services...</div>;

  const renderCatalogItems = (onToggle, isItemSelected) => (
    Object.entries(catalog).map(([catId, catData]) => (
      <div key={catId} className="booking-category">
        <button className="booking-cat-header" onClick={() => toggleCat(catId)}>
          {expandedCats[catId] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span>{catData.title || (catId === 'nails' ? 'Nail Studio' : 'Beauty Salon')}</span>
        </button>
        {expandedCats[catId] && catData.services?.map((svc, sIdx) => (
          <div key={sIdx}>
            {svc.sections?.map((section, secIdx) => (
              <div key={secIdx} className="booking-section">
                {section.title && <h5 className="booking-section-title">{section.title}</h5>}
                {section.items?.map((item) => {
                  const price = item.price || item.price_from || '0';
                  const selected = isItemSelected(item.name);
                  return (
                    <button
                      key={item.id}
                      ref={el => serviceRefs.current[item.name] = el}
                      className={`booking-service-item ${selected ? 'selected' : ''}`}
                      onClick={() => onToggle(item, section)}
                    >
                      <div className="service-item-info">
                        <span className="service-item-name">{item.name}</span>
                        <span className="service-item-price">₦{Number(price).toLocaleString()}</span>
                      </div>
                      <div className="service-item-meta">
                        <span className="service-item-duration">~30 min</span>
                        <div className={`service-check ${selected ? 'checked' : ''}`}>
                          {selected && <Check size={14} />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    ))
  );

  /* ── Guest sub-view ── */
  const guestView = guestViewId ? bookingData.guests.find(g => g.id === guestViewId) : null;

  if (guestView) {
    const guestIndex = bookingData.guests.findIndex(g => g.id === guestViewId);
    const guestTotal = guestView.services.reduce((s, svc) => s + (parseFloat(svc.price) || 0), 0);

    return (
      <motion.div
        className="guest-subview"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="guest-subview-header">
          <button className="guest-subview-back" onClick={() => setGuestViewId(null)}>
            <ArrowLeft size={20} />
          </button>
          <span className="guest-subview-title">
            {guestView.name || `Guest ${guestIndex + 1}`}
          </span>
          <button
            className="guest-subview-remove"
            onClick={() => { removeGuest(guestViewId); setGuestViewId(null); }}
            title="Remove guest"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="guest-subview-body">
          <div className="guest-name-field">
            <label>Guest name</label>
            <input
              type="text"
              value={guestView.name}
              onChange={e => updateGuest(guestViewId, { name: e.target.value })}
              placeholder="e.g. Sarah"
            />
          </div>

          <p className="guest-services-label">Select services for this guest</p>

          <div className="services-scroll">
            {renderCatalogItems(
              (item, section) => handleToggleGuestService(guestViewId, item, section),
              (name) => isGuestSelected(guestViewId, name)
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="step-footer">
          <div className="step-footer-summary">
            <span className="total-label">{guestView.services.length} service{guestView.services.length !== 1 ? 's' : ''} selected</span>
            {guestTotal > 0 && <span className="total-price">₦{guestTotal.toLocaleString()}</span>}
          </div>
          <div className="step-footer-actions">
            <button className="step-continue-btn" onClick={() => setGuestViewId(null)}>
              Done
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Main view ── */
  const totalServiceCount = bookingData.services.length + bookingData.guests.reduce((s, g) => s + g.services.length, 0);
  const hasGuests = bookingData.guests.length > 0;

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Select your services</h3>
        <p>Choose one or more services for your appointment</p>
      </div>

      <div className="services-scroll">
        {renderCatalogItems(handleToggleService, isSelected)}
      </div>

      {/* Sticky footer */}
      <div className="step-footer">
        <div className="step-footer-summary">
          <span className="total-label">{totalServiceCount} service{totalServiceCount !== 1 ? 's' : ''} selected</span>
          <span className="total-price">₦{getTotalPrice().toLocaleString()}</span>
        </div>
        <div className="step-footer-actions">
          {hasGuests ? (
            <button className="guests-pill-btn" onClick={() => setGuestSheetOpen(true)}>
              <Users size={15} />
              <span>Guests</span>
              <span className="guests-pill-count">{bookingData.guests.length}</span>
            </button>
          ) : (
            <button className="add-guest-footer-btn" onClick={handleAddGuest}>
              <Plus size={15} /> Add a guest
            </button>
          )}
          <button className="step-continue-btn" disabled={!canContinue} onClick={nextStep}>
            Continue
          </button>
        </div>
      </div>

      {/* Guest sheet */}
      <AnimatePresence>
        {guestSheetOpen && (
          <>
            <motion.div
              className="guest-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuestSheetOpen(false)}
            />
            <motion.div
              className="guest-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="guest-sheet-handle" />

              <div className="guest-sheet-header">
                <span className="guest-sheet-title">Guests ({bookingData.guests.length})</span>
                <button className="guest-sheet-close" onClick={() => setGuestSheetOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="guest-sheet-list">
                {bookingData.guests.map((guest, i) => (
                  <div key={guest.id} className="guest-sheet-row">
                    <button className="guest-sheet-row-main" onClick={() => openGuestEdit(guest.id)}>
                      <div className="guest-row-info">
                        <span className="guest-row-name">{guest.name || `Guest ${i + 1}`}</span>
                        <span className="guest-row-meta">
                          {guest.services.length > 0
                            ? `${guest.services.length} service${guest.services.length > 1 ? 's' : ''} · ₦${guest.services.reduce((s, svc) => s + (parseFloat(svc.price) || 0), 0).toLocaleString()}`
                            : 'No services — tap to add'}
                        </span>
                      </div>
                      <ChevronRight size={16} color="#bbb" />
                    </button>
                    <button
                      className="guest-sheet-remove"
                      onClick={() => { removeGuest(guest.id); if (bookingData.guests.length === 1) setGuestSheetOpen(false); }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {bookingData.guests.length < 4 && (
                <button className="guest-sheet-add" onClick={handleAddGuest}>
                  <Plus size={16} /> Add another guest
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServiceSelector;
