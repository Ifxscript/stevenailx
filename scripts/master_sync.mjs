import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'stevenailx');

// We explicitly define the initial data structure to ensure 100% cloud-readiness
const masterSiteContent = {
  brand: {
    name: "SteveNailX",
    logo: "STEVENAILX",
    tagline: "Luxury meets artistry.",
    bio: "Steve Nail X is a premier destination for bespoke nail artistry and high-fashion beauty services, dedicated to excellence in every detail."
  },
  hero: {
    tagline: "Stressed, blessed & nail obsessed",
    subtext: "Premium nail artistry crafted to perfection. Your hands, our masterpiece.",
    slides: [
      { id: 1, image: "https://i.ibb.co/Hf1Kn9kD/hero.png" },
      { id: 2, image: "https://i.ibb.co/vxbvGbCb/landing.png" }
    ]
  },
  about: {
    heading: "About",
    description: "Where luxury meets artistry. We don't just do nails; we curate confidence and celebrate beauty in every meticulous detail.",
    address: "Saham Plaza, Abuja, Nigeria",
    mapImage: "https://i.ibb.co/QFx2hwQR/abuja-map.jpg"
  },
  gallery: {
    title: "Portfolio",
    items: [
      { id: 1, image: "https://i.ibb.co/jkpWJyxv/05b546f7-da33-42aa-9970-24db3d722a5e.jpg", title: 'Bespoke Art', category: 'art' },
      { id: 2, image: "https://i.ibb.co/DHGrqPkS/4805424a-ba58-4ab1-9f67-3e603aea138b.jpg", title: 'Classic Luxe', category: 'nails' },
      { id: 3, image: "https://i.ibb.co/ZRkvHXJp/9795e025-569d-46f9-81f7-e4646112d16e.jpg", title: 'Gel Series', category: 'nails' }
    ]
  },
  studio: {
    contact: { phone: "+234 703 487 2747" }
  }
};

const servicesSync = {
  nails: {
    category: "Nail Studio",
    services: [
      {
        category: "Manicure",
        sections: [
          { title: "Classic", items: [{ id: 1, name: "Full Set", price: "25000" }] }
        ]
      }
    ]
  },
  salon: {
    category: "Beauty Salon",
    services: [
      {
        category: "Wigs",
        sections: [
          { title: "Install", items: [{ id: 2, name: "Professional Install", price: "15000" }] }
        ]
      }
    ]
  }
};

async function sync() {
  console.log("🚀 STARTING MASTER CLOUD SYNC...");
  
  try {
    // 1. Sync Site Content
    console.log("Syncing 'site_content/landing_page'...");
    await setDoc(doc(db, "site_content", "landing_page"), masterSiteContent);
    
    // 2. Sync Services
    console.log("Syncing 'services' collection...");
    await setDoc(doc(db, "services", "nails"), servicesSync.nails);
    await setDoc(doc(db, "services", "salon"), servicesSync.salon);
    
    console.log("✨ MASTER SYNC COMPLETE! Your website is now fully heart-beat synchronized with the cloud.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
}

sync();
