import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { sendBookingConfirmation, sendNewBookingNotification } from '../../lib/emailService';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { Loader2, Clock, Calendar, MapPin } from 'lucide-react';

function BookingReview() {
  const { currentUser } = useAuth();
  const { bookingData, updateBooking, getTotalPrice, getTotalDuration, nextStep } = useBooking();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setConfirming(true);
    setError('');
    try {
      // Get user phone from profile
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userPhone = userDoc.exists() ? userDoc.data().phone : '';

      const booking = {
        id: `bk_${Date.now()}`,
        clientId: currentUser.uid,
        clientName: currentUser.displayName || currentUser.email,
        clientEmail: currentUser.email,
        clientPhone: userPhone,
        services: bookingData.services.map(s => ({ name: s.name, price: s.price, duration: s.duration || 30 })),
        guests: bookingData.guests.filter(g => g.name && g.services.length > 0).map(g => ({
          name: g.name,
          services: g.services.map(s => ({ name: s.name, price: s.price, duration: s.duration || 30 }))
        })),
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        totalPrice: getTotalPrice(),
        totalDuration: getTotalDuration(),
        status: 'confirmed',
        notes: bookingData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Firestore
      await setDoc(doc(db, 'bookings', booking.id), booking);

      // Send emails (non-blocking — won't fail the booking if email fails)
      sendBookingConfirmation(booking);
      sendNewBookingNotification(booking);

      // Store booking ref for confirmation screen
      updateBooking({ confirmedBooking: booking });
      nextStep();
    } catch (err) {
      console.error('Booking failed:', err);
      setError('Failed to confirm booking. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Review your booking</h3>
        <p>Make sure everything looks good before confirming.</p>
      </div>

      <div className="review-card">
        {/* Date & Time */}
        <div className="review-row">
          <Calendar size={18} />
          <div>
            <span className="review-label">Date & Time</span>
            <span className="review-value">
              {bookingData.date ? formatDisplayDate(bookingData.date) : '—'} at {bookingData.timeSlot ? formatDisplayTime(bookingData.timeSlot) : '—'}
            </span>
          </div>
        </div>

        <div className="review-row">
          <Clock size={18} />
          <div>
            <span className="review-label">Duration</span>
            <span className="review-value">~{getTotalDuration()} minutes</span>
          </div>
        </div>

        <div className="review-row">
          <MapPin size={18} />
          <div>
            <span className="review-label">Location</span>
            <span className="review-value">Saham Plaza, behind New Banex, Shop A20, Abuja</span>
          </div>
        </div>

        {/* Services */}
        <div className="review-divider" />
        <h4 className="review-section-title">Services</h4>
        {bookingData.services.map(s => (
          <div key={s.id} className="review-service-row">
            <span>{s.name}</span>
            <span>₦{Number(s.price).toLocaleString()}</span>
          </div>
        ))}

        {/* Guests */}
        {bookingData.guests.filter(g => g.name && g.services.length > 0).map(guest => (
          <div key={guest.id}>
            <div className="review-divider" />
            <h4 className="review-section-title">👤 {guest.name} (Guest)</h4>
            {guest.services.map(s => (
              <div key={s.id} className="review-service-row">
                <span>{s.name}</span>
                <span>₦{Number(s.price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Total */}
        <div className="review-divider" />
        <div className="review-total">
          <span>Total</span>
          <span>₦{getTotalPrice().toLocaleString()}</span>
        </div>
      </div>

      {/* Notes */}
      <div className="notes-field">
        <label>Special requests (optional)</label>
        <textarea
          value={bookingData.notes || ''}
          onChange={(e) => updateBooking({ notes: e.target.value })}
          placeholder="Any special requests or notes for Steve..."
          rows={3}
        />
      </div>

      <p className="cancellation-note">
        You can cancel or reschedule from your bookings page up to 24 hours before your appointment.
      </p>

      {error && <p className="auth-error">{error}</p>}

      <div className="step-footer">
        <button className="step-continue-btn confirm" onClick={handleConfirm} disabled={confirming}>
          {confirming ? <><Loader2 className="animate-spin" size={18} /> Confirming...</> : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}

export default BookingReview;
