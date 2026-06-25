import { useBooking } from '../../context/BookingContext';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { Clock, Calendar, MapPin } from 'lucide-react';

function BookingReview() {
  const { bookingData, updateBooking, getTotalPrice, getTotalDuration, nextStep } = useBooking();

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Review your booking</h3>
      </div>

      <div className="review-info-card">
        <div className="review-info-row">
          <Calendar size={22} className="review-info-icon" />
          <div>
            <span className="review-label">Date &amp; Time</span>
            <span className="review-value">
              {bookingData.date ? formatDisplayDate(bookingData.date) : '—'} · {bookingData.timeSlot ? formatDisplayTime(bookingData.timeSlot) : '—'}
            </span>
          </div>
        </div>

        <div className="review-info-row">
          <Clock size={22} className="review-info-icon" />
          <div>
            <span className="review-label">Duration</span>
            <span className="review-value">~{getTotalDuration()} minutes</span>
          </div>
        </div>

        <div className="review-info-row">
          <MapPin size={22} className="review-info-icon" />
          <div>
            <span className="review-label">Location</span>
            <span className="review-value">Saham Plaza, behind New Banex, Shop A20, Abuja</span>
          </div>
        </div>
      </div>

      <div className="review-services-header">
        <span className="review-services-label">Services</span>
      </div>

      {bookingData.services.map(s => (
        <div key={s.id} className="review-service-row">
          <span>{s.name}</span>
          <span>₦{Number(s.price).toLocaleString()}</span>
        </div>
      ))}

      {bookingData.guests.filter(g => g.name && g.services.length > 0).map(guest => (
        <div key={guest.id}>
          <div className="review-guest-label">👤 {guest.name} (Guest)</div>
          {guest.services.map(s => (
            <div key={s.id} className="review-service-row">
              <span>{s.name}</span>
              <span>₦{Number(s.price).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="review-total-divider" />
      <div className="review-total">
        <span>Total</span>
        <span>₦{getTotalPrice().toLocaleString()}</span>
      </div>

      <div className="notes-field">
        <label>
          Special requests <span className="notes-optional">(optional)</span>
        </label>
        <textarea
          value={bookingData.notes || ''}
          onChange={(e) => updateBooking({ notes: e.target.value })}
          placeholder="Any notes for Steve…"
        />
      </div>

      <div className="step-footer">
        <p className="cancellation-note">A deposit confirms your slot — you'll choose the amount next.</p>
        <button className="step-continue-btn confirm" onClick={nextStep}>
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}

export default BookingReview;
