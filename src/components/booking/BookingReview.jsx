import { useBooking } from '../../context/BookingContext';
import { formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { Clock, Calendar, MapPin } from 'lucide-react';

function BookingReview() {
  const { bookingData, updateBooking, getTotalPrice, getTotalDuration, nextStep } = useBooking();

  return (
    <div className="step-container">
      <div className="step-header">
        <h3>Review your booking</h3>
        <p>Make sure everything looks good before paying.</p>
      </div>

      <div className="review-card">
        <div className="review-row">
          <Calendar size={18} />
          <div>
            <span className="review-label">Date & Time</span>
            <span className="review-value">
              {bookingData.date ? formatDisplayDate(bookingData.date) : '—'} at{' '}
              {bookingData.timeSlot ? formatDisplayTime(bookingData.timeSlot) : '—'}
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

        <div className="review-divider" />
        <h4 className="review-section-title">Services</h4>
        {bookingData.services.map(s => (
          <div key={s.id} className="review-service-row">
            <span>{s.name}</span>
            <span>₦{Number(s.price).toLocaleString()}</span>
          </div>
        ))}

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

        <div className="review-divider" />
        <div className="review-total">
          <span>Total</span>
          <span>₦{getTotalPrice().toLocaleString()}</span>
        </div>
      </div>

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
        A deposit is required to confirm your slot — you'll choose the amount on the next step.
      </p>

      <div className="step-footer">
        <button className="step-continue-btn confirm" onClick={nextStep}>
          Proceed to Payment →
        </button>
      </div>
    </div>
  );
}

export default BookingReview;
