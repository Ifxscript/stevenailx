import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { CONFIG } from '../config';

const STEVE_PHONE = CONFIG.phone;

/**
 * Generate time slots for a given day based on working hours.
 */
export const generateTimeSlots = (workingHours, dayName) => {
  const day = workingHours[dayName.toLowerCase()];
  if (!day || !day.isOpen) return [];

  const slots = [];
  const [openH, openM] = day.open.split(':').map(Number);
  const [closeH, closeM] = day.close.split(':').map(Number);

  let h = openH, m = openM;
  while (h < closeH || (h === closeH && m < closeM)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
};

/**
 * Get already-booked slots for a specific date.
 */
export const getBookedSlots = async (dateStr) => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', dateStr),
      where('status', 'in', ['confirmed', 'rescheduled'])
    );
    const snapshot = await getDocs(q);
    const booked = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Block all slots this booking occupies
      const startMinutes = timeToMinutes(data.timeSlot);
      const duration = data.totalDuration || 30;
      for (let i = 0; i < duration; i += 30) {
        booked.push(minutesToTime(startMinutes + i));
      }
    });
    return booked;
  } catch (err) {
    console.error('Error fetching booked slots:', err);
    return [];
  }
};

/**
 * Get available slots for a date (all slots minus booked).
 */
export const getAvailableSlots = async (dateStr, workingHours) => {
  const date = new Date(dateStr);
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];

  const allSlots = generateTimeSlots(workingHours, dayName);
  const bookedSlots = await getBookedSlots(dateStr);

  return allSlots.filter(slot => !bookedSlots.includes(slot));
};

/**
 * Fetch availability config from Firestore.
 */
export const getAvailability = async () => {
  try {
    const docSnap = await getDoc(doc(db, 'site_content', 'landing_page'));
    if (docSnap.exists()) {
      return docSnap.data().availability || null;
    }
    return null;
  } catch (err) {
    console.error('Error fetching availability:', err);
    return null;
  }
};

/**
 * Check if a date is blocked.
 */
export const isDateBlocked = (dateStr, blockedDates = []) => {
  return blockedDates.includes(dateStr);
};

/**
 * Check if a day is a working day.
 */
export const isWorkingDay = (date, workingHours) => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  return workingHours[dayName]?.isOpen || false;
};

// ── Time helpers ──
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Format booking into a WhatsApp message for Steve.
 */
export const formatWhatsAppForSteve = (booking) => {
  const services = booking.services.map(s => `  • ${s.name} — ₦${Number(s.price).toLocaleString()}`).join('\n');
  const guestLines = booking.guests?.filter(g => g.name && g.services.length > 0).map(g => {
    const gServices = g.services.map(s => `    - ${s.name} — ₦${Number(s.price).toLocaleString()}`).join('\n');
    return `  👤 ${g.name}\n${gServices}`;
  }).join('\n') || '';

  const msg = `🔔 NEW BOOKING

👤 Client: ${booking.clientName}
📅 ${booking.date} | ${booking.timeSlot}
💅 Services:
${services}${guestLines ? `\n👥 Guests:\n${guestLines}` : ''}
💰 Total: ₦${Number(booking.totalPrice).toLocaleString()}
📞 ${booking.clientPhone || booking.clientEmail}
${booking.notes ? `📝 Notes: ${booking.notes}` : ''}`;

  return `https://wa.me/${STEVE_PHONE}?text=${encodeURIComponent(msg)}`;
};

/**
 * Format booking into a WhatsApp save for the client.
 */
export const formatWhatsAppForClient = (booking) => {
  const services = booking.services.map(s => `• ${s.name}`).join('\n');

  const msg = `✅ BOOKING CONFIRMED — SteveNailX

📅 ${booking.date} | ${booking.timeSlot}
💅 ${services}
💰 Total: ₦${Number(booking.totalPrice).toLocaleString()}
📍 Saham Plaza, behind New Banex, Shop A20, Abuja

To cancel or reschedule, visit your bookings at stevenailx.com/bookings`;

  return `https://wa.me/${STEVE_PHONE}?text=${encodeURIComponent(msg)}`;
};

/**
 * Format date for display: "Tue, Apr 22"
 */
export const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

/**
 * Format time for display: "10:00 AM"
 */
export const formatDisplayTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};
