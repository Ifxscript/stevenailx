import { db } from '../src/lib/firebase.js';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const legacyReviews = [
  { id: 1, name: 'Victoria G.', rating: 5, comment: 'An amazing experience. Professionalism and skill from start to finish.', status: 'approved', date: '2024-04-09T18:09:00', isLegacy: true },
  { id: 2, name: 'Sonia C.', rating: 5, comment: 'Very good experience. Highly recommended!', status: 'approved', date: '2024-04-07T12:28:00', isLegacy: true },
  { id: 3, name: 'Susana M.', rating: 5, comment: 'First time here for color and I will definitely be back.', status: 'approved', date: '2024-03-28T15:55:00', isLegacy: true },
  { id: 4, name: 'Marina M.', rating: 5, comment: 'Friendly and personalized treatment. Very pleasant atmosphere.', status: 'approved', date: '2024-03-26T09:20:00', isLegacy: true },
  { id: 5, name: 'James R.', rating: 4, comment: 'Excellent service. The studio is clean and the staff is very welcoming.', status: 'approved', date: '2024-03-20T14:30:00', isLegacy: true },
  { id: 6, name: 'Elena P.', rating: 5, comment: 'Absolutely love the bespoke nail art! Truly a masterpiece.', status: 'approved', date: '2024-03-15T11:15:00', isLegacy: true },
  { id: 7, name: 'Clara S.', rating: 3, comment: 'Decent experience, but the session took longer than expected.', status: 'approved', date: '2024-03-10T11:15:00', isLegacy: true },
  { id: 8, name: 'Alice B.', rating: 2, comment: 'Not quite what I was hoping for. The polish chipped within 3 days.', status: 'approved', date: '2024-03-05T14:45:00', isLegacy: true },
  { id: 9, name: 'David W.', rating: 5, comment: 'Best manicure I\'ve had in a long time.Precision and skill.', status: 'approved', date: '2024-03-01T10:00:00', isLegacy: true },
  { id: 10, name: 'Sophia L.', rating: 4, comment: 'Great color selection and very friendly staff.', status: 'approved', date: '2024-02-25T16:20:00', isLegacy: true },
  { id: 11, name: 'Michael T.', rating: 5, comment: 'Fantastic job. Very meticulous and professional.', status: 'approved', date: '2024-02-20T13:10:00', isLegacy: true },
  { id: 12, name: 'Emma H.', rating: 5, comment: 'Wonderful atmosphere and talented artists.', status: 'approved', date: '2024-02-15T15:30:00', isLegacy: true },
];

async function migrate() {
  console.log("🚀 Starting Review Migration...");
  try {
    for (const review of legacyReviews) {
      const reviewId = `legacy_${review.id}`;
      await setDoc(doc(collection(db, 'reviews'), reviewId), {
        ...review,
        id: reviewId, // Use string ID
        isVerified: false,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Migrated: ${review.name}`);
    }

    // Optional: Clean up site_content to avoid duplicate data sources
    // we'll do this in a separate step once the UI is switched over.
    
    console.log("✨ ALL REVIEWS MIGRATED TO THE NEW COLLECTION!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrate();
