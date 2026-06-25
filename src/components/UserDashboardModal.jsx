import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, UserRound, CalendarHeart, Phone, LogOut, ChevronRight,
  Check, Clock, MessageCircle, Loader2, Calendar, MapPin,
  History, Settings, ShieldCheck, Mail, Star, Plus,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useLandingPage } from '../context/LandingPageContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import ReviewSubmissionModal from './ReviewSubmissionModal';
import UserAvatar from './UserAvatar';
import { CONFIG } from '../config';
import './UserDashboardModal.css';

// Map of page titles for the modal header
const TAB_TITLES = {
  appointments: 'Appointments',
  settings: 'Account Settings'
};

// Reusable Booking Row inside the dashboard
const DashboardBookingRow = ({ booking, onReview, onResumePayment }) => {
  const { reviews } = useLandingPage();
  const allReviews = reviews?.items || [];

  const isReviewed = allReviews?.some(r => r.bookingId === (booking.id || booking.docId));

  const [year, month, day] = booking.date.split('-');
  const d = new Date(year, month - 1, day);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = d.toLocaleDateString('en-US', { day: 'numeric' });

  const isUpcoming = new Date(`${booking.date}T${booking.timeSlot.split(' - ')[0]}`) > new Date();
  const isCancelled = booking.status === 'cancelled';
  const isAwaitingPayment = booking.status === 'awaiting_payment';
  const isCompleted = booking.status === 'completed';

  const totalPrice = booking.services?.reduce((sum, s) => sum + parseInt(s.price || 0), 0) || 0;

  const handleContactSteve = () => {
    const orderId = booking.orderId || booking.id || booking.docId;
    const msg = `Hi Steve, I'd like to discuss my appointment.\n\nOrder ID: ${orderId}\nDate: ${booking.date} at ${booking.timeSlot}`;
    const whatsappUrl = `${CONFIG.whatsappBaseUrl}?text=${encodeURIComponent(msg)}`;
    window.location.href = whatsappUrl;
    setMenuOpen(false);
  };

  const statusLabel = isAwaitingPayment ? 'Payment Pending' : (booking.status || 'Upcoming');

  return (
    <div className={`ref-booking-card ${isCancelled ? 'cancelled' : ''}`}>
      <div className="booking-card-main">
        {/* Top Row: Date/Time & Status */}
        <div className="booking-header-row">
          <div className="booking-date-group">
            <span className="booking-day">{dayName}, {dayNumber}</span>
            <div className="booking-time-chip">
              <Clock size={12} />
              <span>{booking.timeSlot}</span>
            </div>
          </div>
          <div className={`booking-status-tag ${isAwaitingPayment ? 'awaiting-payment' : (booking.status || 'upcoming')}`}>
            {statusLabel}
          </div>
        </div>

        {/* Middle Row: Service Name + Order ID */}
        <div className="booking-body-row">
          <h4 className="booking-service-title">
            {booking.services?.map(s => s.name).join(', ') || 'Nail Service'}
          </h4>
          {(booking.orderId || booking.id) && (
            <span style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 600, letterSpacing: '0.04em', marginTop: '2px', display: 'block' }}>
              {booking.orderId || booking.id}
            </span>
          )}
        </div>

        {/* Bottom Row: Price & Actions */}
        <div className="booking-footer-row">
          <div className="booking-price-tag">
            ₦{totalPrice.toLocaleString()}
          </div>

          <div className="booking-actions-group">
            {isUpcoming && !isCancelled && !isAwaitingPayment && (
              <button className="ref-edit-btn" onClick={handleContactSteve}>
                <MessageCircle size={14} />
                <span>Contact Steve</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complete Payment banner for awaiting_payment bookings */}
      {isAwaitingPayment && (
        <button
          className="complete-payment-banner"
          onClick={() => onResumePayment(booking)}
        >
          <CreditCard size={16} />
          <span>Complete Payment — ₦{(booking.depositAmount || 0).toLocaleString()} deposit</span>
          <ChevronRight size={16} />
        </button>
      )}

      {/* Review banner for completed, unreviewed bookings */}
      {isCompleted && !isReviewed && !isCancelled && (
        <button
          className="review-prompt-banner"
          onClick={() => onReview(booking)}
        >
          <Star size={16} fill="#f59e0b" color="#f59e0b" />
          <span>Leave a Review</span>
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};

const UserDashboardModal = ({ isOpen, onClose }) => {
  const { currentUser, logout, loginAsClient, dashboardTab, openDashboard } = useAuth();
  const { openBookingDrawer } = useBooking();

  // Normalize tab state
  const activeTab = useMemo(() => {
    if (dashboardTab === 'settings') return 'settings';
    return 'appointments';
  }, [dashboardTab]);

  const [subTab, setSubTab] = useState(dashboardTab === 'history' ? 'history' : 'upcoming');

  const setActiveTab = (tab) => openDashboard(tab);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState(null);

  // Resume payment state
  const [resumePhase, setResumePhase] = useState(null); // null | 'initiating' | 'waiting' | 'error'
  const [resumeBooking, setResumeBooking] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const resumePollingRef = useRef(null);
  const resumePollCount = useRef(0);

  // Profile state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (currentUser) {
        fetchBookings();
        fetchUserData();
      }
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, currentUser]);

  // Load Paystack script for resume payment
  useEffect(() => {
    if (!document.querySelector('script[src*="js.paystack.co"]')) {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v2/inline.js';
      s.async = true;
      document.head.appendChild(s);
    }
    return () => { if (resumePollingRef.current) clearInterval(resumePollingRef.current); };
  }, []);

  const waitForPaystack = () => new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    let tries = 0;
    const iv = setInterval(() => {
      if (window.PaystackPop) { clearInterval(iv); resolve(); }
      else if (++tries > 30) { clearInterval(iv); reject(new Error('Paystack failed to load')); }
    }, 200);
  });

  const confirmResumedBooking = async (booking) => {
    const id = booking.id || booking.docId;
    await updateDoc(doc(db, 'bookings', id), {
      status: 'confirmed',
      paymentStatus: 'deposit_paid',
      updatedAt: new Date().toISOString(),
    });
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking_paid', booking: { ...booking, status: 'confirmed', paymentStatus: 'deposit_paid' } }),
    }).catch(() => {});
    setResumePhase(null);
    setResumeBooking(null);
    fetchBookings();
  };

  const startResumePolling = (reference, booking) => {
    resumePollCount.current = 0;
    resumePollingRef.current = setInterval(async () => {
      resumePollCount.current += 1;
      if (resumePollCount.current > 72) {
        clearInterval(resumePollingRef.current);
        setResumeError("Payment not detected yet. If you've already transferred, contact Steve on WhatsApp.");
        setResumePhase('error');
        return;
      }
      try {
        const r = await fetch(`/api/paystack-verify?reference=${encodeURIComponent(reference)}`);
        const data = await r.json();
        if (data.verified) {
          clearInterval(resumePollingRef.current);
          await confirmResumedBooking(booking);
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const handleResumePayment = async (booking) => {
    if (resumePollingRef.current) clearInterval(resumePollingRef.current);
    setResumeBooking(booking);
    setResumePhase('initiating');
    setResumeError('');
    try {
      await waitForPaystack();
      const newRef = `snx-bk${Date.now()}`;
      await updateDoc(doc(db, 'bookings', booking.id || booking.docId), {
        paystackReference: newRef,
        updatedAt: new Date().toISOString(),
      });
      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: (booking.depositAmount || 5000) * 100,
        reference: newRef,
        onSuccess: (txn) => {
          setResumePhase('waiting');
          fetch(`/api/paystack-verify?reference=${encodeURIComponent(txn.reference)}`)
            .then(r => r.json())
            .then(d => {
              if (d.verified) confirmResumedBooking(booking);
              else startResumePolling(txn.reference, booking);
            })
            .catch(() => startResumePolling(txn.reference, booking));
        },
        onCancel: () => {
          setResumePhase('waiting');
          startResumePolling(newRef, booking);
        },
      });
    } catch (err) {
      setResumeError(err.message || 'Something went wrong. Please try again.');
      setResumePhase('error');
    }
  };

  const fetchUserData = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      if (snap.exists()) setPhoneNumber(snap.data().phone || '');
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const q = query(collection(db, 'bookings'), where('clientId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ ...d.data(), docId: d.id, id: d.id }));

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const stale = items.filter(b => b.status === 'awaiting_payment' && b.createdAt < oneHourAgo);
      if (stale.length > 0) {
        await Promise.all(stale.map(b =>
          updateDoc(doc(db, 'bookings', b.id), { status: 'cancelled', updatedAt: new Date().toISOString() })
        ));
        stale.forEach(b => { b.status = 'cancelled'; });
      }

      items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(items);
    } catch (err) { console.error(err); }
    finally { setLoadingBookings(false); }
  };

  const handleSavePhone = async () => {
    if (!currentUser || !phoneNumber.trim()) return;
    setIsSavingPhone(true);
    try {
      await setDoc(doc(db, 'users', currentUser.uid), { phone: phoneNumber.trim() }, { merge: true });
      setPhoneSaved(true);
      setTimeout(() => { setIsEditingPhone(false); setPhoneSaved(false); }, 1500);
    } catch (err) { console.error(err); }
    finally { setIsSavingPhone(false); }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const isCancelled = b.status === 'cancelled';
      const isCompleted = b.status === 'completed';

      if (activeTab === 'appointments') {
        if (subTab === 'upcoming') return !isCancelled && !isCompleted;
        if (subTab === 'history') return isCancelled || isCompleted;
      }
      return false;
    });
  }, [bookings, activeTab, subTab]);

  // Group by month
  const groupedBookings = useMemo(() => {
    const groups = {};
    filteredBookings.forEach(b => {
      const date = new Date(b.date);
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      if (!groups[monthName]) groups[monthName] = [];
      groups[monthName].push(b);
    });
    return groups;
  }, [filteredBookings]);

  if (!isOpen) return null;

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="dashboard-overlay">
      <motion.div 
        className="dashboard-backdrop" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      <motion.div 
        className="dashboard-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }} 
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Mobile Drag Handle */}
        <div className="mobile-sheet-handle-wrapper">
          <div className="mobile-sheet-handle"></div>
        </div>
        {!currentUser ? (
          <div className="dashboard-auth-prompt">
            <UserRound size={48} color="#ccc" />
            <h2>Sign in to continue</h2>
            <p>View your bookings and manage your profile.</p>
            <button className="google-login-btn-v2" onClick={loginAsClient}>
              Continue with Google
            </button>
            <button className="btn-close-prompt" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            {/* Sidebar (Desktop Only) */}
            <aside className="dashboard-sidebar">
              <div className="sidebar-user-section">
                <UserAvatar 
                  user={currentUser} 
                  className="sidebar-avatar" 
                />
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{currentUser.displayName}</span>
                  <span className="sidebar-user-email">{currentUser.email}</span>
                </div>
              </div>

              <nav className="sidebar-nav">
                <NavItem id="appointments" icon={CalendarHeart} label="Appointments" />
                <NavItem id="settings" icon={Settings} label="Account Settings" />
                <button className="sidebar-nav-item sidebar-booking-cta" onClick={() => { onClose(); openBookingDrawer(); }}>
                  <Plus size={18} />
                  <span>New Booking</span>
                </button>
              </nav>

              <div className="sidebar-logout">
                <button className="btn-logout-sidebar" onClick={() => { logout(); onClose(); }}>
                  <LogOut size={18} /> <span>Log Out</span>
                </button>
              </div>
            </aside>

            {/* Main Center Area */}
            <main className="dashboard-main">
              <header className="dashboard-header">
                <h2>{TAB_TITLES[activeTab] || 'Dashboard'}</h2>
                <button className="dashboard-close-btn" onClick={onClose}>
                  <X size={24} />
                </button>
              </header>

              <div className="mobile-dashboard-tabs">
                <button className={`mobile-tab-item ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>Appointments</button>
                <button className={`mobile-tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
              </div>

              <div className="dashboard-content-scroll">
                {activeTab === 'settings' ? (
                  <div className="settings-view">
                    <p className="dashboard-section-desc">Manage your contact information and preferences.</p>
                    <div className="settings-group">
                      <div className="settings-field">
                        <label>Phone Number</label>
                        {isEditingPhone ? (
                          <div className="phone-edit-inline-v2">
                            <input 
                              type="tel" 
                              value={phoneNumber} 
                              onChange={e => setPhoneNumber(e.target.value)}
                              autoFocus 
                            />
                            <div className="edit-actions-v2">
                              <button className="btn-save-v2" onClick={handleSavePhone} disabled={isSavingPhone}>
                                {phoneSaved ? <Check size={16} /> : 'Save Changes'}
                              </button>
                              <button className="btn-cancel-v2" onClick={() => setIsEditingPhone(false)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="phone-view-mode">
                             <span className="phone-number-val">{phoneNumber || 'Not provided'}</span>
                             <button className="btn-edit-inline" onClick={() => setIsEditingPhone(true)}>Edit</button>
                          </div>
                        )}
                      </div>

                      <div className="settings-field">
                        <label>Email Address</label>
                        <div className="phone-view-mode">
                          <span className="phone-number-val">{currentUser.email}</span>
                          <ShieldCheck size={16} color="#16a34a" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bookings-view">
                    <div className="view-header-ref">
                      <p className="dashboard-section-desc">See your scheduled events from your local visit history.</p>
                    </div>

                    {activeTab === 'appointments' && (
                      <div className="ref-tab-bar-desktop">
                        <button className={`ref-tab-pill ${subTab === 'upcoming' ? 'active' : ''}`} onClick={() => setSubTab('upcoming')}>Upcoming</button>
                        <button className={`ref-tab-pill ${subTab === 'history' ? 'active' : ''}`} onClick={() => setSubTab('history')}>History</button>
                      </div>
                    )}

                    {loadingBookings ? (
                      <div className="loading-state-box">
                        <Loader2 className="animate-spin" />
                        <span>Fetching your bookings...</span>
                      </div>
                    ) : Object.keys(groupedBookings).length === 0 ? (
                      <div className="empty-state-box">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #f9f0f3 0%, #fdf6f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <CalendarHeart size={36} color="var(--color-burgundy, #8b1d41)" style={{ opacity: 0.6 }} />
                          </div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-brown, #3a2a2a)', margin: '0 0 8px' }}>
                            {subTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
                          </h3>
                          <p style={{ fontSize: '0.9rem', color: '#999', margin: '0 0 24px', lineHeight: 1.5 }}>
                            {subTab === 'upcoming' 
                              ? 'Your scheduled appointments will appear here.' 
                              : 'Your visit history will appear here once you complete a booking.'}
                          </p>
                          <button 
                            className="book-first-cta"
                            onClick={() => { onClose(); openBookingDrawer(); }}
                          >
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="book-appointment-inline"
                          onClick={() => { onClose(); openBookingDrawer(); }}
                        >
                          <Plus size={16} />
                          <span>Book Appointment</span>
                        </button>
                        <div className="ref-booking-groups">
                          {Object.entries(groupedBookings).map(([month, items]) => (
                            <div key={month} className="ref-month-group">
                              <h3 className="ref-month-label">{month}</h3>
                              <div className="ref-booking-list">
                                {items.map(b => (
                                  <DashboardBookingRow
                                    key={b.id}
                                    booking={b}
                                    onReview={setReviewingBooking}
                                    onResumePayment={handleResumePayment}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </main>
          </>
        )}
      </motion.div>

      {/* Resume payment overlay */}
      {resumePhase && resumeBooking && (
        <div className="resume-payment-overlay">
          {resumePhase === 'initiating' && (
            <div className="resume-payment-card">
              <Loader2 size={36} className="animate-spin" style={{ color: '#c94b35' }} />
              <p>Opening payment…</p>
            </div>
          )}
          {resumePhase === 'waiting' && (
            <div className="resume-payment-card">
              <Loader2 size={36} className="animate-spin" style={{ color: '#c94b35' }} />
              <h4>Waiting for your transfer…</h4>
              <p>We check every 5 seconds. Bank transfers usually land within 2 minutes.</p>
              <div className="resume-amount-chip">
                Amount due: <strong>₦{(resumeBooking.depositAmount || 0).toLocaleString()}</strong>
              </div>
            </div>
          )}
          {resumePhase === 'error' && (
            <div className="resume-payment-card">
              <p style={{ color: '#c94b35', marginBottom: 16 }}>{resumeError}</p>
              <button
                className="step-continue-btn confirm"
                style={{ fontSize: '0.9rem', padding: '10px 20px' }}
                onClick={() => { setResumePhase(null); setResumeBooking(null); setResumeError(''); }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legacy Review Modal integration */}
      <AnimatePresence>
        {reviewingBooking && (
          <ReviewSubmissionModal
            isOpen={!!reviewingBooking}
            onClose={() => setReviewingBooking(null)}
            booking={reviewingBooking}
            onSuccess={() => fetchBookings()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDashboardModal;
