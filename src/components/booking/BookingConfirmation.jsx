import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { formatWhatsAppForSteve, formatDisplayDate, formatDisplayTime } from '../../lib/bookingUtils';
import { CheckCircle2, MessageCircle, CalendarCheck } from 'lucide-react';

function BookingConfirmation() {
  const { bookingData, closeBookingDrawer } = useBooking();
  const { openDashboard } = useAuth();
  const booking = bookingData.confirmedBooking;

  if (!booking) return null;

  const whatsappUrl = formatWhatsAppForSteve(booking);
  const balance = booking.depositAmount && booking.totalPrice > booking.depositAmount
    ? booking.totalPrice - booking.depositAmount
    : 0;

  const handleViewBookings = () => {
    closeBookingDrawer();
    openDashboard('upcoming');
  };

  return (
    <div className="step-container confirmation-step">
      <div className="confirmation-icon">
        <div className="check-circle-anim">
          <CheckCircle2 size={40} strokeWidth={2} />
        </div>
      </div>

      <h3 className="confirmation-title">Booking Confirmed!</h3>
      <p className="confirmation-subtitle">
        Your deposit has been received. We can't wait to see you!
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
          <span>Deposit paid</span>
          <span>₦{Number(booking.depositAmount || booking.totalPrice).toLocaleString()}</span>
        </div>
        {balance > 0 && (
          <div className="conf-total" style={{ marginTop: 6, opacity: 0.7, fontSize: '0.9rem' }}>
            <span>Balance due on the day</span>
            <span>₦{balance.toLocaleString()}</span>
          </div>
        )}
      </div>

      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-cta">
        <MessageCircle size={20} />
        <span>Message Steve on WhatsApp</span>
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
