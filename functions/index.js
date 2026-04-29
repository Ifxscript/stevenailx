const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

/**
 * Triggered when a new booking is created in Firestore.
 * Creates two documents in the 'mail' collection to be picked up by 
 * the Firebase Trigger Email Extension.
 */
exports.onBookingCreated = onDocumentCreated("bookings/{bookingId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }
  
  const booking = snapshot.data();
  const bookingId = event.params.bookingId;

  console.log(`Processing new booking: ${bookingId}`);

  // 1. Prepare Client Confirmation Email
  const clientEmailDoc = {
    to: booking.clientEmail,
    message: {
      subject: `Booking Confirmed: ${booking.date} at ${booking.timeSlot}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #8B3A4A; text-align: center;">Booking Confirmed!</h2>
          <p>Hi ${booking.clientName},</p>
          <p>Your appointment at <strong>SteveNailX</strong> has been successfully booked.</p>
          
          <div style="background-color: #F9F7F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Services:</strong> ${booking.services.map(s => s.name).join(", ")}</p>
            <p><strong>Total Price:</strong> ₦${Number(booking.totalPrice).toLocaleString()}</p>
          </div>

          <p><strong>Location:</strong><br>
          Saham Plaza, behind New Banex,<br>
          Shop A20 Upstairs, Abuja, Nigeria</p>

          <p style="font-size: 0.9em; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you need to reschedule or cancel, please do so via your dashboard at least 24 hours before your appointment.
          </p>
        </div>
      `
    }
  };

  // 2. Prepare Admin Notification Email
  const adminEmailDoc = {
    to: 'ianekwe7@gmail.com',
    message: {
      subject: `New Booking: ${booking.clientName} - ${booking.date}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #8B3A4A;">New Booking Received</h2>
          <p>A new appointment has been scheduled.</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Client:</strong> ${booking.clientName}</p>
            <p><strong>Email:</strong> ${booking.clientEmail}</p>
            <p><strong>Phone:</strong> ${booking.clientPhone || 'Not provided'}</p>
            <p><strong>Date:</strong> ${booking.date}</p>
            <p><strong>Time:</strong> ${booking.timeSlot}</p>
            <p><strong>Services:</strong> ${booking.services.map(s => `${s.name} (₦${s.price})`).join(", ")}</p>
            <p><strong>Total:</strong> ₦${Number(booking.totalPrice).toLocaleString()}</p>
          </div>
          
          <p><a href="https://stevenailx.com/admin/bookings" style="background-color: #8B3A4A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a></p>
        </div>
      `
    }
  };

  try {
    const mailCol = db.collection("mail");
    await Promise.all([
      mailCol.add(clientEmailDoc),
      mailCol.add(adminEmailDoc)
    ]);
    console.log(`Email triggers created for booking ${bookingId}`);
  } catch (err) {
    console.error("Error creating email trigger documents:", err);
  }
});
