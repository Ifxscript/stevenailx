import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useBooking } from '../../context/BookingContext';
import { Plus, Trash2, Check, Users, ChevronDown, ChevronRight } from 'lucide-react';

function ServiceSelector() {
  const { bookingData, addService, removeService, addGuest, removeGuest, updateGuest, addGuestService, removeGuestService, nextStep, getTotalPrice } = useBooking();
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState({});

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'services'));
        const data = {};
        snapshot.forEach(doc => { data[doc.id] = doc.data(); });
        setCatalog(data);
        // Expand first category by default
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

  const toggleCat = (id) => {
    setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      addService({
        name: item.name,
        price: parseFloat(item.price) || parseFloat(item.price_from) || 0,
        duration: 30,
        category: section?.title || '',
      });
    }
  };

  const handleToggleGuestService = (guestId, item, section) => {
    if (isGuestSelected(guestId, item.name)) {
      const guest = bookingData.guests.find(g => g.id === guestId);
      const found = guest?.services.find(s => s.name === item.name);
      if (found) removeGuestService(guestId, found.id);
    } else {
      addGuestService(guestId, {
        name: item.name,
        price: parseFloat(item.price) || parseFloat(item.price_from) || 0,
        duration: 30,
        category: section?.title || '',
      });
    }
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

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Select your services</h3>
        <p>Choose one or more services for your appointment</p>
      </div>

      {/* My Services */}
      <div className="services-scroll">
        {renderCatalogItems(handleToggleService, isSelected)}
      </div>

      {/* Guests */}
      {bookingData.guests.length > 0 && (
        <div className="guests-section">
          {bookingData.guests.map((guest, gIdx) => (
            <div key={guest.id} className="guest-card">
              <div className="guest-header">
                <Users size={16} />
                <input
                  type="text"
                  className="guest-name-input"
                  placeholder={`Guest ${gIdx + 1} name`}
                  value={guest.name}
                  onChange={(e) => updateGuest(guest.id, { name: e.target.value })}
                />
                <button className="guest-remove-btn" onClick={() => removeGuest(guest.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="guest-services">
                {renderCatalogItems(
                  (item, section) => handleToggleGuestService(guest.id, item, section),
                  (name) => isGuestSelected(guest.id, name)
                )}
              </div>
              {guest.services.length > 0 && (
                <div className="guest-summary">
                  {guest.services.map(s => (
                    <span key={s.id} className="guest-service-tag">{s.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {bookingData.guests.length < 4 && (
        <button className="add-guest-btn" onClick={addGuest}>
          <Plus size={16} /> Add a guest
        </button>
      )}

      {/* Footer */}
      <div className="step-footer">
        <div className="step-footer-info">
          <span className="total-label">{bookingData.services.length + bookingData.guests.reduce((s, g) => s + g.services.length, 0)} services selected</span>
          <span className="total-price">₦{getTotalPrice().toLocaleString()}</span>
        </div>
        <button className="step-continue-btn" disabled={!canContinue} onClick={nextStep}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default ServiceSelector;
