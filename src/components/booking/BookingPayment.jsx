import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Phone } from 'lucide-react';
import './BookingPayment.css';

function BookingPayment() {
  const { currentUser, openDashboard } = useAuth();
  const { bookingData, getTotalPrice, getTotalDuration, updateBooking, nextStep, closeBookingDrawer } = useBooking();

  const [depositOption, setDepositOption] = useState(null); // 'thirty' | 'full'
  const [phase, setPhase] = useState('select'); // 'select' | 'initiating' | 'waiting' | 'error'
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const savedRef = useRef(null);
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);

  const totalPrice = getTotalPrice();
  const thirtyPercent = Math.max(Math.round(totalPrice * 0.3), 100);

  const selectedAmount =
    depositOption === 'thirty' ? thirtyPercent
    : depositOption === 'full' ? totalPrice
    : 0;

  // Load saved phone on mount
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid))
      .then(snap => {
        setPhone((snap.exists() ? snap.data().phone : '') || '');
      })
      .catch(() => {});
  }, [currentUser]);

  // Load Paystack script once
  useEffect(() => {
    if (!document.querySelector('script[src*="js.paystack.co"]')) {
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v2/inline.js';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const waitForPaystack = () => new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    let tries = 0;
    const iv = setInterval(() => {
      if (window.PaystackPop) { clearInterval(iv); resolve(); }
      else if (++tries > 30) { clearInterval(iv); reject(new Error('Paystack script failed to load')); }
    }, 200);
  });

  const confirmBooking = async (booking) => {
    const id = savedRef.current?.bookingId || booking.id;
    await updateDoc(doc(db, 'bookings', id), {
      status: 'confirmed',
      paymentStatus: 'deposit_paid',
      updatedAt: new Date().toISOString(),
    });
    const confirmed = { ...booking, status: 'confirmed', paymentStatus: 'deposit_paid' };
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'booking_paid', booking: confirmed }),
    }).catch(() => {});
    updateBooking({ confirmedBooking: confirmed });
    nextStep();
  };

  const startPolling = (reference, booking) => {
    pollCountRef.current = 0;
    pollingRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > 72) {
        clearInterval(pollingRef.current);
        setError("We haven't detected your payment yet. If you've already transferred, contact us on WhatsApp.");
        setPhase('error');
        return;
      }
      try {
        const r = await fetch(`/api/paystack-verify?reference=${encodeURIComponent(reference)}`);
        const data = await r.json();
        if (data.verified) {
          clearInterval(pollingRef.current);
          await confirmBooking(booking);
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  const handlePay = async () => {
    if (!depositOption || phase !== 'select') return;
    if (savedRef.current) {
      closeBookingDrawer();
      openDashboard('upcoming');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError('Please enter your phone number before continuing.');
      return;
    }

    setPhase('initiating');
    setError('');

    try {
      // Persist phone to user profile (fire-and-forget, non-blocking)
      setDoc(doc(db, 'users', currentUser.uid), { phone: trimmedPhone }, { merge: true }).catch(() => {});

      const bookingId = `bk${Date.now()}`;
      const reference = `snx-${bookingId}`;

      const booking = {
        id: bookingId,
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email,
        clientEmail: currentUser.email,
        clientPhone: trimmedPhone,
        services: bookingData.services.map(s => ({
          name: s.name || '', price: s.price || 0, duration: s.duration || 30,
        })),
        guests: (bookingData.guests || [])
          .filter(g => g.name && g.services?.length > 0)
          .map(g => ({
            name: g.name,
            services: g.services.map(s => ({ name: s.name || '', price: s.price || 0, duration: s.duration || 30 })),
          })),
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        totalPrice,
        totalDuration: getTotalDuration(),
        depositAmount: selectedAmount,
        depositOption,
        paystackReference: reference,
        status: 'awaiting_payment',
        notes: bookingData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'bookings', booking.id), booking);
      savedRef.current = { bookingId: booking.id, reference };

      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking_awaiting_payment', booking }),
      }).catch(() => {});

      await waitForPaystack();

      const popup = new window.PaystackPop();
      popup.newTransaction({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: selectedAmount * 100,
        reference,
        onSuccess: (txn) => {
          setPhase('waiting');
          fetch(`/api/paystack-verify?reference=${encodeURIComponent(txn.reference)}`)
            .then(r => r.json())
            .then(d => {
              if (d.verified) confirmBooking(booking);
              else startPolling(txn.reference, booking);
            })
            .catch(() => startPolling(txn.reference, booking));
        },
        onCancel: () => {
          setPhase('slot_reserved');
        },
      });
    } catch (err) {
      console.error('[BookingPayment]', err);
      setError('Something went wrong. Please try again or contact us on WhatsApp.');
      setPhase('select');
    }
  };

  if (phase === 'slot_reserved') {
    return (
      <div className="step-container">
        <div className="step-header">
          <h3>Your slot is held</h3>
          <p>Your booking is saved. Complete your deposit from your dashboard whenever you're ready.</p>
        </div>
        <button
          className="step-continue-btn confirm"
          onClick={() => { closeBookingDrawer(); openDashboard('upcoming'); }}
        >
          Go to My Bookings →
        </button>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="step-container payment-waiting">
        <div className="waiting-spinner">
          <Loader2 size={44} className="animate-spin" />
        </div>
        <h3 className="waiting-title">Waiting for your transfer…</h3>
        <p className="waiting-sub">
          We check every 5 seconds. Bank transfers usually land within 2 minutes.
        </p>
        <div className="waiting-amount-card">
          <span>Amount due</span>
          <strong>₦{selectedAmount.toLocaleString()}</strong>
        </div>
        <p className="waiting-note">
          You can safely close the Paystack window — we'll detect your payment automatically.
        </p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="step-container payment-error-state">
        <p className="auth-error" style={{ textAlign: 'left', marginBottom: 24 }}>{error}</p>
        <button
          className="step-continue-btn confirm"
          onClick={() => { setPhase('select'); setError(''); }}
        >
          Try Again
        </button>
      </div>
    );
  }

  const balance = totalPrice - selectedAmount;

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Lock in your slot</h3>
        <p>Pay a deposit now to confirm.</p>
      </div>

      <div className="deposit-options">
        <button
          className={`deposit-option${depositOption === 'thirty' ? ' selected' : ''}`}
          onClick={() => setDepositOption('thirty')}
        >
          {depositOption === 'thirty' && (
            <>
              <div className="deposit-selected-ring" />
              <div className="deposit-check-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </>
          )}
          <div className="deposit-amount">₦{thirtyPercent.toLocaleString()}</div>
          <div className="deposit-label">30% deposit</div>
        </button>

        <button
          className={`deposit-option${depositOption === 'full' ? ' selected' : ''}`}
          onClick={() => setDepositOption('full')}
        >
          {depositOption === 'full' && (
            <>
              <div className="deposit-selected-ring" />
              <div className="deposit-check-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </>
          )}
          <div className="deposit-amount">₦{totalPrice.toLocaleString()}</div>
          <div className="deposit-label">Full payment</div>
        </button>
      </div>

      <div className="payment-summary">
        <div className="payment-row">
          <span className="payment-row-label">Appointment total</span>
          <span className="payment-row-value">₦{totalPrice.toLocaleString()}</span>
        </div>
        <div className="payment-row">
          <span className="payment-row-label payment-row-label--strong">Deposit now</span>
          <span className="deposit-now-val">{depositOption ? `₦${selectedAmount.toLocaleString()}` : '—'}</span>
        </div>
        {depositOption && balance > 0 && (
          <div className="payment-row">
            <span className="payment-row-label payment-row-label--muted">Balance on the day</span>
            <span className="payment-row-value payment-row-value--muted">₦{balance.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="phone-field">
        <label className="phone-field-label">
          <Phone size={14} />
          Phone Number
        </label>
        <input
          className="phone-field-input"
          type="tel"
          placeholder="e.g. 08012345678"
          value={phone}
          onChange={e => { setPhone(e.target.value); setError(''); }}
        />
        <p className="phone-field-hint">So Steve can reach you about your appointment</p>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="step-footer">
        <button
          className="step-continue-btn confirm"
          onClick={handlePay}
          disabled={!depositOption || phase === 'initiating'}
        >
          {phase === 'initiating' ? (
            <><Loader2 className="animate-spin" size={18} /> Opening payment…</>
          ) : depositOption ? (
            `Pay ₦${selectedAmount.toLocaleString()} →`
          ) : (
            'Choose a deposit option'
          )}
        </button>
      </div>
    </div>
  );
}

export default BookingPayment;
