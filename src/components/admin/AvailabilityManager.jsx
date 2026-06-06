import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import '../../styles/AdminHub.css';

function AvailabilityManager() {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAvailability(); }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
      if (docSnap.exists()) {
        setAvailability(docSnap.data().availability || {
          slotDuration: 30,
          maxGuests: 4,
        });
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'site_content', 'landing_page'), { availability });
      alert('✅ Availability updated!');
    } catch (err) {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !availability) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#8E8484', fontWeight: 600 }}>Loading Availability Engine...</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Slot Preferences */}
      <div style={{ marginBottom: '48px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: '#4a1a26' }}>Slot Preferences</h3>
        <p style={{ fontSize: '0.9rem', color: '#8E8484', marginBottom: '24px' }}>Configure the granularity of your booking calendar.</p>
        <div className="hub-form-grid">
          <div className="hub-field-card">
            <div className="input-field" style={{ marginBottom: '32px' }}>
              <label className="field-label"><span>Booking Slot Duration</span><small>Controls the time interval for each appointment slot</small></label>
              <select className="hub-input" value={availability?.slotDuration || 30} onChange={(e) => setAvailability(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
            <div className="input-field">
              <label className="field-label"><span>Maximum Guests per Session</span><small>Sets a limit on the number of guests a client can add</small></label>
              <select className="hub-input" value={availability?.maxGuests || 4} onChange={(e) => setAvailability(prev => ({ ...prev, maxGuests: parseInt(e.target.value) }))}>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} Guests</option>
                ))}
              </select>
            </div>
            <button className="action-btn save" style={{ marginTop: '32px' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvailabilityManager;
