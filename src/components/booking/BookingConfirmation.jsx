import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { formatWhatsAppForSteve, formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { Check, MessageCircle, CalendarCheck } from 'lucide-react';

function BookingConfirmation() {
  const { bookingData, closeBookingDrawer } = useBooking();
  const { openDashboard } = useAuth();
  const booking = bookingData.confirmedBooking;

  if (!booking) return null;

  const whatsappUrl = formatWhatsAppForSteve(booking);

  const handleViewBookings = () => {
    closeBookingDrawer();
    openDashboard('upcoming');
  };

  return (
    <div className="step-container confirmation-step">
      <div className="confirmation-icon">
        <div className="check-circle-anim">
          <Check size={40} strokeWidth={3} />
        </div>
      </div>

      <h3 className="confirmation-title">Booking Confirmed!</h3>
      <p className="confirmation-subtitle">
        Your appointment has been saved. Steve will see it in his dashboard.
      </p>

      <div className="confirmation-card">
        <div className="conf-row">
          <CalendarCheck size={18} />
          <span>{formatDisplayDate(booking.date)} at {formatDisplayTime(booking.timeSlot)}</span>
        </div>
        <div className="conf-services">
          {booking.services.map((s, i) => (
            <span key={i} className="conf-service-tag">{s.name}</span>
          ))}
          {booking.guests?.map(g => 
            g.services.map((s, i) => (
              <span key={`g-${i}`} className="conf-service-tag guest">{s.name} ({g.name})</span>
            ))
          )}
        </div>
        <div className="conf-total">
          <span>Total</span>
          <span>₦{Number(booking.totalPrice).toLocaleString()}</span>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-cta">
        <MessageCircle size={20} />
        <span>Send Booking to Steve on WhatsApp</span>
      </a>

      <button className="view-bookings-btn" onClick={handleViewBookings}>
        View My Bookings
      </button>

      <button className="done-btn" onClick={closeBookingDrawer}>
        Done
      </button>
    </div>
  );
}

export default BookingConfirmation;
