import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import './BookingPayment.css';

function BookingPayment() {
  const { currentUser } = useAuth();
  const { bookingData, getTotalPrice, getTotalDuration, updateBooking, nextStep } = useBooking();

  const [depositOption, setDepositOption] = useState(null); // 'flat' | 'percent'
  const [phase, setPhase] = useState('select'); // 'select' | 'initiating' | 'waiting' | 'error'
  const [error, setError] = useState('');
  const savedRef = useRef(null);
  const pollingRef = useRef(null);
  const pollCountRef = useRef(0);

  const totalPrice = getTotalPrice();
  const flatDeposit = Math.min(5000, totalPrice);
  const percentDeposit = Math.max(Math.round(totalPrice * 0.25), 100);
  const isFlatFull = flatDeposit >= totalPrice;

  const selectedAmount =
    depositOption === 'flat' ? flatDeposit
    : depositOption === 'percent' ? percentDeposit
    : 0;

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
      // 72 polls × 5s = 6 minutes timeout
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
    setPhase('initiating');
    setError('');

    try {
      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      const phone = (snap.exists() ? snap.data().phone : '') || '';

      const bookingId = `bk${Date.now()}`;
      const reference = `snx-${bookingId}`;

      const booking = {
        id: bookingId,
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email,
        clientEmail: currentUser.email,
        clientPhone: phone,
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

      // Notify both parties immediately — don't wait for payment
      fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'booking_awaiting_payment', booking }),
      }).catch(() => {});

      await waitForPaystack();

      const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      console.log('[Paystack] key present:', !!paystackKey, '| amount (kobo):', selectedAmount * 100, '| ref:', reference, '| email:', currentUser.email);

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
          setPhase('waiting');
          startPolling(reference, booking);
        },
      });
    } catch (err) {
      console.error('[BookingPayment]', err);
      setError('Something went wrong. Please try again or contact us on WhatsApp.');
      setPhase('select');
    }
  };

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
        <h3>Secure your slot</h3>
        <p>Pay a deposit now to lock in your appointment.</p>
      </div>

      <div className="deposit-options">
        <button
          className={`deposit-option${depositOption === 'flat' ? ' selected' : ''}`}
          onClick={() => setDepositOption('flat')}
        >
          <div className="deposit-amount">₦{flatDeposit.toLocaleString()}</div>
          <div className="deposit-label">{isFlatFull ? 'Full payment' : '₦5,000 flat deposit'}</div>
        </button>

        {!isFlatFull && (
          <button
            className={`deposit-option${depositOption === 'percent' ? ' selected' : ''}`}
            onClick={() => setDepositOption('percent')}
          >
            <div className="deposit-amount">₦{percentDeposit.toLocaleString()}</div>
            <div className="deposit-label">25% of total</div>
          </button>
        )}
      </div>

      {depositOption && (
        <div className="payment-summary">
          <div className="payment-row">
            <span>Appointment total</span>
            <span>₦{totalPrice.toLocaleString()}</span>
          </div>
          <div className="payment-row deposit-row">
            <span>Deposit now</span>
            <span className="deposit-now-val">₦{selectedAmount.toLocaleString()}</span>
          </div>
          {balance > 0 && (
            <div className="payment-row balance-row">
              <span>Balance due on the day</span>
              <span>₦{balance.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

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
