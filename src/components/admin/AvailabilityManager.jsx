import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Save, RefreshCcw, Plus, X, Calendar, Clock, Lock, Settings, ChevronRight, Check, ChevronDown } from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import HubActionPill from './HubActionPill';
import { useMobile } from '../../hooks/useMobile';
import '../../styles/AdminHub.css';

// ── Custom Dropdown for mobile Slot Preferences ──
const InlineSelectDropdown = ({ label, hint, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9e9690', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        {hint && <small style={{ display: 'block', fontSize: '0.75rem', color: '#b0a8a0', marginTop: '2px' }}>{hint}</small>}
      </div>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f5f3ef',
            border: 'none',
            borderRadius: '14px',
            padding: '14px 16px',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#2a1a1a',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left'
          }}
        >
          <span>{selectedLabel}</span>
          <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9e9690' }} />
        </button>

        {isOpen && (
          <div style={{
            marginTop: '8px',
            backgroundColor: '#FFFBF7',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #F0EFEA',
            overflow: 'hidden'
          }}>
            {options.map((opt, i) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: isSelected ? 'rgba(139, 29, 65, 0.05)' : 'transparent',
                    color: isSelected ? '#8B1D41' : '#4a1a26',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.95rem',
                    border: 'none',
                    borderBottom: i < options.length - 1 ? '1px solid #F0EFEA' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={16} color="#8B1D41" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function AvailabilityManager() {
  const isMobile = useMobile();
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [activeSectionId, setActiveSectionId] = useState('hours');

  useEffect(() => { fetchAvailability(); }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
      if (docSnap.exists()) {
        setAvailability(docSnap.data().availability || {
          slotDuration: 30,
          maxGuests: 4,
          workingHours: {},
          blockedDates: [],
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

  const updateDay = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value }
      }
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    setAvailability(prev => ({
      ...prev,
      blockedDates: [...(prev.blockedDates || []), newBlockedDate]
    }));
    setNewBlockedDate('');
  };

  const removeBlockedDate = (date) => {
    setAvailability(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.filter(d => d !== date)
    }));
  };

  const sections = [
    { 
      id: 'hours', 
      label: 'Weekly Hours', 
      description: 'Define the windows when your studio is open for bookings.',
      icon: <Clock size={20} />,
      status: 'Engine',
      component: isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {DAY_NAMES.map((day, i) => {
            const dayData = availability?.workingHours?.[day] || { isOpen: false, open: '', close: '' };
            return (
              <div key={day} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: i < DAY_NAMES.length - 1 ? '1px solid #f0efea' : 'none',
                opacity: dayData.isOpen ? 1 : 0.5
              }}>
                <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.9rem', color: dayData.isOpen ? '#4a1a26' : '#8E8484', width: '70px', flexShrink: 0 }}>
                  {day.slice(0, 3)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
                  <Clock size={12} color="#9e9690" />
                  <input
                    type="time"
                    value={dayData.open || ''}
                    onChange={(e) => updateDay(day, 'open', e.target.value)}
                    disabled={!dayData.isOpen}
                    style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.85rem', color: '#4a1a26', width: '75px', padding: '0', fontFamily: 'inherit' }}
                  />
                  <span style={{ color: '#ccc', fontSize: '0.8rem' }}>—</span>
                  <input
                    type="time"
                    value={dayData.close || ''}
                    onChange={(e) => updateDay(day, 'close', e.target.value)}
                    disabled={!dayData.isOpen}
                    style={{ border: 'none', background: 'transparent', fontWeight: 700, fontSize: '0.85rem', color: '#4a1a26', width: '75px', padding: '0', fontFamily: 'inherit' }}
                  />
                </div>
                <label className="hub-switch" style={{ flexShrink: 0 }}>
                  <input type="checkbox" checked={dayData.isOpen || false} onChange={(e) => updateDay(day, 'isOpen', e.target.checked)} />
                  <span className="hub-slider"></span>
                </label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="hub-form-grid">
          <div className="hub-field-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {DAY_NAMES.map(day => {
                const dayData = availability?.workingHours?.[day] || { isOpen: false, open: '', close: '' };
                return (
                  <div key={day} className="hour-row" style={{ padding: '16px 24px', backgroundColor: dayData.isOpen ? '#fff' : '#f9f7f2', border: dayData.isOpen ? '1px solid #f0efea' : '1px solid transparent', borderRadius: '16px' }}>
                    <span style={{ fontWeight: 800, textTransform: 'capitalize', width: '120px', color: dayData.isOpen ? '#4a1a26' : '#8E8484' }}>{day}</span>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input className="hub-input" style={{ width: '130px', border: 'none', background: 'transparent', fontWeight: 700 }} type="time" value={dayData.open || ''} onChange={(e) => updateDay(day, 'open', e.target.value)} disabled={!dayData.isOpen} />
                      <span style={{ color: '#ccc' }}>—</span>
                      <input className="hub-input" style={{ width: '130px', border: 'none', background: 'transparent', fontWeight: 700 }} type="time" value={dayData.close || ''} onChange={(e) => updateDay(day, 'close', e.target.value)} disabled={!dayData.isOpen} />
                    </div>
                    <label className="toggle-row" style={{ marginLeft: 'auto' }}>
                      <label className="hub-switch">
                        <input type="checkbox" checked={dayData.isOpen || false} onChange={(e) => updateDay(day, 'isOpen', e.target.checked)} />
                        <span className="hub-slider"></span>
                      </label>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>{dayData.isOpen ? 'OPEN' : 'CLOSED'}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )
    },
    { 
      id: 'blocked', 
      label: 'Blocked Dates', 
      description: 'Restrict bookings for holidays, staff vacations, or studio maintenance.',
      icon: <Lock size={20} />,
      status: 'Schedule',
      component: (
        <div className="hub-form-grid">
          <div className="hub-field-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="input-field" style={{ flex: 1 }}>
                 <label className="field-label"><span>Select Date to Block</span></label>
                 <input type="date" className="hub-input" value={newBlockedDate} onChange={(e) => setNewBlockedDate(e.target.value)} />
              </div>
              <button className="action-btn save" style={{ height: '52px', marginTop: '28px' }} onClick={addBlockedDate}><Plus size={18} /> Block Date</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {(availability?.blockedDates || []).map(date => (
              <div key={date} className="hub-field-card hub-hover-group" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#e53935', opacity: 0.6 }}><Lock size={16} /></div>
                  <span style={{ fontWeight: 700, color: '#4a1a26' }}>{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <button className="reveal-on-hover" onClick={() => removeBlockedDate(date)} style={{ border: 'none', background: 'transparent', color: '#e53935', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            ))}
            {availability?.blockedDates?.length === 0 && <p style={{ color: '#8E8484', gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>No dates are currently blocked.</p>}
          </div>
        </div>
      )
    },
    { 
      id: 'settings', 
      label: 'Slot Preferences', 
      description: 'Configure the granularity of your booking calendar.',
      icon: <Settings size={20} />,
      status: 'Preferences',
      component: isMobile ? (
        <div style={{ padding: '0 16px' }}>
          <InlineSelectDropdown
            label="Booking Slot Duration"
            hint="Controls the time interval for each appointment slot"
            value={availability?.slotDuration || 30}
            options={[
              { value: 30, label: '30 Minutes' },
              { value: 60, label: '60 Minutes' }
            ]}
            onChange={(val) => setAvailability(prev => ({ ...prev, slotDuration: val }))}
          />
          <InlineSelectDropdown
            label="Maximum Guests per Session"
            hint="Sets a limit on the number of guests a client can add"
            value={availability?.maxGuests || 4}
            options={[1, 2, 3, 4, 5].map(n => ({ value: n, label: `${n} Guest${n > 1 ? 's' : ''}` }))}
            onChange={(val) => setAvailability(prev => ({ ...prev, maxGuests: val }))}
          />
        </div>
      ) : (
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
          </div>
        </div>
      )
    }
  ];

  if (loading || !availability) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Availability Engine...</p>
      </div>
    );
  }

  const openDaysCount = DAY_NAMES.filter(d => availability.workingHours?.[d]?.isOpen).length;

  return (
    <div className="manager-container">
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Operational Speed</span>
          <div className="status-value">{availability.slotDuration} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>mins</span></div>
          <div className="status-badge">Engine</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Weekly Range</span>
          <div className="status-value">{openDaysCount} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Open Days</span></div>
          <div className="status-badge">Schedule</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Blocked Dates</span>
          <div className="status-value">{availability.blockedDates?.length || 0} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Dates</span></div>
          <div className="status-badge">Locked</div>
        </div>
      </div>

      <AdminMobileLayout 
        title="Availability"
        description="Configure your booking engine, weekly hours, and blocked holiday dates."
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
        onSave={handleSave}
        onDiscard={fetchAvailability}
        isSaving={saving}
        hasChanges={true}
      />
    </div>
  );
}

export default AvailabilityManager;
