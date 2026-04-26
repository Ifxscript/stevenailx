/**
 * MASTER SYNC — Pushes the complete site data to Firestore.
 * Run once: node scripts/sync_all.mjs
 * After this, the client manages everything from the admin dashboard.
 */
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyC2m1tzJI-DS2WWWjJw-xFBNEzEBqVj9QY",
  authDomain: "stevenailx.firebaseapp.com",
  projectId: "stevenailx",
  storageBucket: "stevenailx.firebasestorage.app",
  messagingSenderId: "231302928962",
  appId: "1:231302928962:web:41de51cc3bcf9c832aabdb",
});
const db = getFirestore(app, "stevenailx");

// ─── Available ImgBB images ───
const IMG = {
  hero1:    "https://i.ibb.co/Hf1Kn9kD/hero.png",
  hero2:    "https://i.ibb.co/vxbvGbCb/landing.png",
  art:      "https://i.ibb.co/jkpWJyxv/05b546f7-da33-42aa-9970-24db3d722a5e.jpg",
  classic:  "https://i.ibb.co/DHGrqPkS/4805424a-ba58-4ab1-9f67-3e603aea138b.jpg",
  gel:      "https://i.ibb.co/ZRkvHXJp/9795e025-569d-46f9-81f7-e4646112d16e.jpg",
  map:      "https://i.ibb.co/QFx2hwQR/abuja-map.jpg",
};

const WHATSAPP = "https://wa.me/2347034872747?text=Hi%20SteveNailX!%20I%27d%20like%20to%20book%20an%20appointment.";

// ─── Complete landing page data ───
const landingPageData = {
  brand: {
    name: "SteveNailX",
    logo: "STEVENAILX",
    logoImage: IMG.art,
    tagline: "Luxury meets artistry.",
    description: "Where luxury meets artistry. We don't just do nails; we curate confidence and celebrate beauty in every meticulous detail.",
    bio: "Steve Nail X is a premier destination for bespoke nail artistry and high-fashion beauty services, dedicated to excellence in every detail."
  },
  socials: [
    { id: 1, label: "Book on WhatsApp", href: WHATSAPP, description: "Direct booking and inquiries" },
    { id: 2, label: "Follow on Instagram", href: "https://instagram.com/stevenailx", description: "Our latest portfolio and nail art" },
    { id: 3, label: "Follow on TikTok", href: "#", description: "Process videos and BTS" },
    { id: 4, label: "Visit Website", href: "/", description: "Return to our homepage" }
  ],
  hero: {
    rotation: { enabled: true, intervalMs: 3500 },
    slides: [
      {
        id: "landing-1",
        heading: "Stressed, blessed & nail obsessed",
        subheading: "Premium nail artistry crafted to perfection. Your hands, our masterpiece.",
        ctaPrimary: { label: "Book Appointment", href: WHATSAPP, external: true },
        ctaSecondary: { label: "Discover Services", href: "#services", external: false },
        src: IMG.hero1,
        alt: "SteveNailX manicure showcase look one",
      },
      {
        id: "landing-2",
        heading: "Elegance at your fingertips",
        subheading: "From minimalist chic to statement sets, every design is tailored to your vibe.",
        ctaPrimary: { label: "Book Appointment", href: WHATSAPP, external: true },
        ctaSecondary: { label: "View Services", href: "#services", external: false },
        src: IMG.hero2,
        alt: "SteveNailX manicure showcase look two",
      },
    ],
  },
  services: {
    title: "Trending nail art",
    subtitle: "Other services",
    items: [
      { id: 1, title: "Classic Luxe", description: "Timeless elegance with meticulous care, shaping, and a flawless polished finish.", image: IMG.classic, link: "/services#classic" },
      { id: 2, title: "Custom Nail Art", description: "A masterpiece on every finger — completely bespoke designs that reflect your style.", image: IMG.art, link: "/services#art" },
      { id: 3, title: "Elite Gel Series", description: "Ultimate durability with a high-fashion edge and incredible, long-lasting shine.", image: IMG.gel, link: "/services#gel" },
    ],
    otherItems: [
      { id: 1, title: "Wig Installation", description: "Precision melting and styling for a flawless, natural scalp finish.", image: IMG.gel, link: "/services#wigs" },
      { id: 2, title: "Professional Makeup", description: "Bespoke artistry ranging from editorial glam to signature natural glows.", image: IMG.art, link: "/services#makeup" },
      { id: 3, title: "Deluxe Pedicure", description: "Renewing sole therapy with meticulous care and a premium polished end.", image: IMG.classic, link: "/services#pedicure" },
    ]
  },
  gallery: {
    title: "Portfolio",
    exploreLabel: "Explore More",
    items: [
      { id: 1, image: IMG.art, title: "Bespoke Art", category: "art" },
      { id: 2, image: IMG.classic, title: "Classic Luxe", category: "nails" },
      { id: 3, image: IMG.gel, title: "Gel Series", category: "nails" },
      { id: 4, image: IMG.hero1, title: "Manicure", category: "nails" },
      { id: 5, image: IMG.hero2, title: "Styling", category: "hair" },
      { id: 6, image: IMG.art, title: "Minimalist", category: "art" },
      { id: 7, image: IMG.classic, title: "Volume Lashes", category: "lashes" },
      { id: 8, image: IMG.gel, title: "Bridal Makeup", category: "makeup" },
      { id: 9, image: IMG.hero1, title: "Aesthetic Art", category: "art" },
      { id: 10, image: IMG.hero2, title: "Braid Style", category: "hair" },
    ]
  },
  team: {
    title: "Team",
    members: [
      { id: 1, name: "Steve Nail", role: "Lead Artist & Founder", image: null },
    ]
  },
  reviews: {
    title: "Reviews",
    seeAllLabel: "See All Reviews",
    items: [
      { id: 1, name: "Victoria G.", rating: 5, comment: "An amazing experience. Professionalism and skill from start to finish.", status: "approved", date: "2024-04-09T18:09:00" },
      { id: 2, name: "Sonia C.", rating: 5, comment: "Very good experience. Highly recommended!", status: "approved", date: "2024-04-07T12:28:00" },
      { id: 3, name: "Susana M.", rating: 5, comment: "First time here for color and I will definitely be back.", status: "approved", date: "2024-03-28T15:55:00" },
      { id: 4, name: "Marina M.", rating: 5, comment: "Friendly and personalized treatment. Very pleasant atmosphere.", status: "approved", date: "2024-03-26T09:20:00" },
      { id: 5, name: "James R.", rating: 4, comment: "Excellent service. The studio is clean and the staff is very welcoming.", status: "approved", date: "2024-03-20T14:30:00" },
      { id: 6, name: "Elena P.", rating: 5, comment: "Absolutely love the bespoke nail art! Truly a masterpiece.", status: "approved", date: "2024-03-15T11:15:00" },
      { id: 7, name: "Clara S.", rating: 3, comment: "Decent experience, but the session took longer than expected.", status: "approved", date: "2024-03-10T11:15:00" },
      { id: 8, name: "Alice B.", rating: 2, comment: "Not quite what I was hoping for. The polish chipped within 3 days.", status: "approved", date: "2024-03-05T14:45:00" },
      { id: 9, name: "David W.", rating: 5, comment: "Best manicure I've had in a long time. Precision and skill.", status: "approved", date: "2024-03-01T10:00:00" },
      { id: 10, name: "Sophia L.", rating: 4, comment: "Great color selection and very friendly staff.", status: "approved", date: "2024-02-25T16:20:00" },
      { id: 11, name: "Michael T.", rating: 5, comment: "Fantastic job. Very meticulous and professional.", status: "approved", date: "2024-02-20T13:10:00" },
      { id: 12, name: "Emma H.", rating: 5, comment: "Wonderful atmosphere and talented artists.", status: "approved", date: "2024-02-15T15:30:00" },
    ]
  },
  about: {
    heading: "About",
    description: "Where luxury meets artistry. We don't just do nails; we curate confidence and celebrate beauty in every meticulous detail.",
    address: "Saham Plaza, behind New Banex, Shop A20 Upstairs, Abuja, Nigeria 900288",
    directionsUrl: "https://www.google.com/maps/search/?api=1&query=Saham+Plaza+behind+New+Banex+Shop+A20+Upstairs+Abuja",
    mapImage: IMG.map,
    openingTitle: "Opening times",
    hours: [
      { name: "Monday", hours: "Closed", isOpen: false },
      { name: "Tuesday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Wednesday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Thursday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Friday", hours: "9:30 am - 7:00 pm", isOpen: true },
      { name: "Saturday", hours: "10:00 am - 2:00 pm", isOpen: true },
      { name: "Sunday", hours: "Closed", isOpen: false },
    ]
  },
  availability: {
    slotDuration: 30,
    maxGuests: 4,
    workingHours: {
      monday: { open: "", close: "", isOpen: false },
      tuesday: { open: "09:30", close: "19:00", isOpen: true },
      wednesday: { open: "09:30", close: "19:00", isOpen: true },
      thursday: { open: "09:30", close: "19:00", isOpen: true },
      friday: { open: "09:30", close: "19:00", isOpen: true },
      saturday: { open: "10:00", close: "14:00", isOpen: true },
      sunday: { open: "", close: "", isOpen: false },
    },
    blockedDates: []
  },
  footer: {
    navColumns: [
      {
        title: "Navigation",
        links: [
          { label: "Home", href: "#home" },
          { label: "Services", href: "#services" },
          { label: "Gallery", href: "/gallery" },
          { label: "Reviews", href: "#reviews" },
          { label: "Our Story", href: "#about" }
        ]
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy Policy", href: "#" },
          { label: "Terms of service", href: "#" },
          { label: "Terms of use", href: "#" }
        ]
      },
      {
        title: "Contact",
        links: [
          { label: "📍 Saham Plaza, Abuja", isStatic: true },
          { label: "📞 +234 703 487 2747", href: "tel:+2347034872747" },
          { label: "✉️ hello@stevenailx.com", href: "mailto:hello@stevenailx.com" }
        ]
      },
      {
        title: "Socials",
        links: [
          { label: "Instagram", href: "https://instagram.com/stevenailx", hasArrow: true },
          { label: "TikTok", href: "#", hasArrow: true },
          { label: "WhatsApp", href: WHATSAPP, hasArrow: true }
        ]
      }
    ],
    copyright: "SteveNailX. All Rights Reserved.",
    language: "English"
  }
};

// ─── PUSH TO FIRESTORE ───
async function syncAll() {
  console.log("🚀 Starting full sync to Firestore...\n");

  // Push the entire landing page document
  await setDoc(doc(db, "site_content", "landing_page"), landingPageData);
  console.log("✅ site_content/landing_page — SYNCED");

  console.log("\n🎉 ALL DATA PUSHED SUCCESSFULLY!");
  console.log("Your client can now update everything from the admin dashboard.");
  process.exit(0);
}

syncAll().catch(e => { console.error("❌ Sync failed:", e); process.exit(1); });
