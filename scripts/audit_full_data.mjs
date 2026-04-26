import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

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

async function audit() {
  console.log("🕵️‍♂️ FULL CLOUD DATA AUDIT");
  
  const contentSnap = await getDoc(doc(db, "site_content", "landing_page"));
  if (contentSnap.exists()) {
    console.log("\n📄 'site_content/landing_page' Keys:");
    console.log(Object.keys(contentSnap.data()));
  } else {
    console.log("\n❌ 'site_content/landing_page' MISSING!");
  }

  const servicesSnap = await getDocs(collection(db, "services"));
  console.log("\n📦 'services' Collection Documents:");
  servicesSnap.forEach(d => {
    console.log("- Document: " + d.id);
    console.log("  Fields: " + Object.keys(d.data()));
  });

  process.exit(0);
}

audit();
