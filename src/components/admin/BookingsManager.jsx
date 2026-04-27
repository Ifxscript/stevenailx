import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { 
  Loader2, Calendar, Phone, CheckCircle2, XCircle, 
  Clock, RefreshCcw, MessageCircle, LayoutList, 
  CalendarCheck, Users, Smartphone, Coins, ChevronRight, X
} from 'lucide-react';
import AdminMobileLayout from './AdminMobileLayout';
import HubActionPill from './HubActionPill';

// ── Sub-Component for the Booking List ──
function BookingList({ list, activeSectionId, onUpdateStatus, openPopup, closePopup }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const getWhatsAppLink = (booking) => {
    const msg = `Hi ${booking.clientName}! This is SteveNailX regarding your appointment on ${formatDisplayDate(booking.date)} at ${formatDisplayTime(booking.timeSlot)}.`;
    return `https://wa.me/${booking.clientPhone?.replace(/[^\d]/g, '') || ''}?text=${encodeURIComponent(msg)}`;
  };

  const confirmCancel = (booking, props) => {
    props.openPopup(
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <XCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', marginBottom: '8px' }}>Cancel Appointment?</h3>
        <p style={{ color: '#8E8484', marginBottom: '24px', fontSize: '0.95rem' }}>Are you sure you want to cancel the booking for <strong>{booking.clientName}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="action-btn discard" style={{ flex: 1 }} onClick={props.closePopup}>Keep Booking</button>
          <button className="action-btn save" style={{ flex: 1, backgroundColor: '#991B1B' }} onClick={() => { onUpdateStatus(booking.docId || booking.id, 'cancelled'); props.closePopup(); }}>Yes, Cancel</button>
        </div>
      </div>
    );
  };

  const confirmComplete = (booking, props) => {
    const completionWhatsAppMsg = `Hi ${booking.clientName}! ✨ Your SteveNailX appointment on ${formatDisplayDate(booking.date)} has been completed. Thank you for visiting — we hope you love the results! Feel free to leave a review in your dashboard. See you next time! 💅`;
    const whatsappUrl = `https://wa.me/${booking.clientPhone?.replace(/[^\d]/g, '') || ''}?text=${encodeURIComponent(completionWhatsAppMsg)}`;

    props.openPopup(
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#E1E8DE', color: '#4F5E49', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4a1a26', marginBottom: '8px' }}>Mark as Completed?</h3>
        <p style={{ color: '#8E8484', marginBottom: '24px', fontSize: '0.95rem' }}>This will mark <strong>{booking.clientName}</strong>'s appointment as completed and open WhatsApp to notify them.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="action-btn discard" style={{ flex: 1 }} onClick={props.closePopup}>Not Yet</button>
          <button className="action-btn save" style={{ flex: 1 }} onClick={async () => {
            await onUpdateStatus(booking.docId || booking.id, 'completed');
            // Write email trigger document
            if (booking.clientEmail) {
              try {
                await addDoc(collection(db, 'mail'), {
                  to: booking.clientEmail,
                  message: {
                    subject: 'Your SteveNailX appointment is complete! ✨',
                    html: `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #4a1a26;">
                      <h1 style="font-size: 1.5rem; margin-bottom: 16px;">Thank you, ${booking.clientName}! 💅</h1>
                      <p style="color: #8E8484; line-height: 1.6;">Your appointment for <strong>${booking.services?.map(s => s.name).join(', ')}</strong> on <strong>${formatDisplayDate(booking.date)}</strong> has been completed.</p>
                      <p style="color: #8E8484; line-height: 1.6; margin-top: 16px;">We'd love to hear how it went! Log in to your dashboard to leave a review and help others discover SteveNailX.</p>
                      <hr style="border: none; border-top: 1px solid #F0EFEA; margin: 24px 0;" />
                      <p style="font-size: 0.85rem; color: #B5AFA5;">SteveNailX — Premium Nail Artistry</p>
                    </div>`
                  }
                });
              } catch (emailErr) {
                console.error('Failed to queue email:', emailErr);
              }
            }
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            props.closePopup();
          }}>Yes, Complete</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-bookings-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8E8484' }}>
          <Calendar size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
          <p>No {activeSectionId} appointments found.</p>
        </div>
      ) : (
        list.map(b => (
          <div key={b.docId || b.id} className="hub-field-card hub-hover-group" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a1a26', fontWeight: 800, fontSize: '1rem' }}>
                  {b.clientName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#4a1a26', marginBottom: '2px' }}>{b.clientName}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: '#8E8484' }}>
                    <a href={`tel:${b.clientPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit' }}><Smartphone size={12} /> {b.clientPhone}</a>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {formatDisplayTime(b.timeSlot)}</span>
                  </div>
                </div>
              </div>
              <span style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: b.status === 'completed' ? '#E6E9F9' : 
                                 b.status === 'cancelled' ? '#FEE2E2' : 
                                 (b.date < todayStr ? '#FDE68A' : (b.status === 'confirmed' ? '#E1E8DE' : '#F9F0D9')),
                color: b.status === 'completed' ? '#4D547F' : 
                       b.status === 'cancelled' ? '#991B1B' : 
                       (b.date < todayStr ? '#92400E' : (b.status === 'confirmed' ? '#4F5E49' : '#7A693F'))
              }}>
                {b.status === 'completed' || b.status === 'cancelled' 
                  ? b.status 
                  : (b.date < todayStr ? 'missed' : b.status)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '24px', alignItems: 'end' }}>
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {b.services?.map((s, i) => (
                    <span key={i} style={{ padding: '4px 10px', borderRadius: '8px', backgroundColor: '#F9F7F2', color: '#4a1a26', fontSize: '0.8rem', fontWeight: 600 }}>{s.name}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#8E8484', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {formatDisplayDate(b.date)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#4a1a26' }}><Coins size={14} /> ₦{Number(b.totalPrice).toLocaleString()}</span>
                </div>
              </div>

              {/* Desktop: reveal on hover */}
              <div className="reveal-on-hover" style={{ display: 'flex', gap: '8px' }}>
                {b.clientPhone && (
                  <a href={getWhatsAppLink(b)} target="_blank" rel="noopener noreferrer" className="action-btn" style={{ backgroundColor: '#25D366', color: '#fff', padding: '8px 16px', fontSize: '0.8rem' }}>
                    <MessageCircle size={14} /> Msg
                  </a>
                )}
                {b.status === 'confirmed' && (
                  <>
                    <button className="action-btn save" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => confirmComplete(b, { openPopup, closePopup })}>
                      <CheckCircle2 size={14} /> Done
                    </button>
                    <button className="action-btn discard" style={{ padding: '8px 16px', fontSize: '0.8rem', backgroundColor: '#FEE2E2', color: '#991B1B' }} onClick={() => confirmCancel(b, { openPopup, closePopup })}>
                      <XCircle size={14} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile: always-visible action row */}
            {b.status === 'confirmed' && (
              <div className="booking-mobile-actions">
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button 
                    className="action-btn save" 
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', borderRadius: '24px', backgroundColor: '#E1E8DE', color: '#4F5E49', justifyContent: 'center', border: 'none' }} 
                    onClick={() => confirmComplete(b, { openPopup, closePopup })}
                  >
                    <CheckCircle2 size={16} /> Mark as Completed
                  </button>
                  <button 
                    className="action-btn discard" 
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', borderRadius: '24px', backgroundColor: '#FEE2E2', color: '#991B1B', justifyContent: 'center', border: 'none' }} 
                    onClick={() => confirmCancel(b, { openPopup, closePopup })}
                  >
                    <XCircle size={16} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function BookingsManager() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState('upcoming');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach(d => items.push({ ...d.data(), docId: d.id }));
      setBookings(items);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      fetchBookings();
    } catch {
      alert('Failed to update status.');
    }
  };

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const todaysBookings = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.date === today && b.status === 'confirmed';
  });

  const thisWeekRevenue = bookings.filter(b => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new Date(b.date) >= weekAgo && b.status !== 'cancelled';
  }).reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const sections = [
    { 
      id: 'upcoming', 
      label: 'Upcoming', 
      description: 'Appointments scheduled for today or in the future.',
      icon: <CalendarCheck size={20} />,
      status: `${bookings.filter(b => b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'completed').length} Active`,
      component: <BookingList 
        list={bookings.filter(b => b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'completed')} 
        activeSectionId="Upcoming" 
        onUpdateStatus={updateStatus} 
      />
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      description: 'Successfully serviced appointments.',
      icon: <CheckCircle2 size={20} />,
      status: 'Archive',
      component: <BookingList 
        list={bookings.filter(b => b.status === 'completed')} 
        activeSectionId="Completed" 
        onUpdateStatus={updateStatus} 
      />
    },
    { 
      id: 'missed', 
      label: 'Missed', 
      description: 'Past appointments that were never marked as completed.',
      icon: <Clock size={20} />,
      status: 'Review Required',
      component: <BookingList 
        list={bookings.filter(b => b.date < todayStr && b.status !== 'cancelled' && b.status !== 'completed')} 
        activeSectionId="Missed" 
        onUpdateStatus={updateStatus} 
      />
    },
    { 
      id: 'cancelled', 
      label: 'Cancelled', 
      description: 'Declined or revoked appointment requests.',
      icon: <XCircle size={20} />,
      status: 'Void',
      component: <BookingList 
        list={bookings.filter(b => b.status === 'cancelled')} 
        activeSectionId="Cancelled" 
        onUpdateStatus={updateStatus} 
      />
    }
  ];

  if (loading && bookings.length === 0) {
    return (
      <div className="manager-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={40} color="#4a1a26" />
        <p style={{ marginTop: 16, color: '#8E8484', fontWeight: 600 }}>Loading Appointments...</p>
      </div>
    );
  }

  return (
    <div className="manager-container">
      <div className="status-header-grid">
        <div className="status-card sage">
          <span className="status-label">Today's Schedule</span>
          <div className="status-value">{todaysBookings.length} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Confirmed</span></div>
          <div className="status-badge">Daily</div>
        </div>
        <div className="status-card periwinkle">
          <span className="status-label">Confirmed Queue</span>
          <div className="status-value">{confirmedCount} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Bookings</span></div>
          <div className="status-badge">Active</div>
        </div>
        <div className="status-card mustard">
          <span className="status-label">Weekly Revenue</span>
          <div className="status-value">₦{thisWeekRevenue.toLocaleString()}</div>
          <div className="status-badge">Revenue</div>
        </div>
      </div>

      <AdminMobileLayout 
        title="Bookings"
        description="Manage scheduling, client communication, and booking statuses."
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
        onSave={fetchBookings}
        onDiscard={() => {}} 
        isSaving={loading}
        hasChanges={false}
      />
    </div>
  );
}

export default BookingsManager;
