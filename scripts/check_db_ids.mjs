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

async function check() {
  console.log("🔍 Checking Firestore IDs...");
  
  const contentDocs = await getDocs(collection(db, "site_content"));
  console.log("Documents in 'site_content':");
  contentDocs.forEach(d => console.log("- " + d.id));

  const serviceDocs = await getDocs(collection(db, "services"));
  console.log("\nDocuments in 'services':");
  serviceDocs.forEach(d => console.log("- " + d.id));
  
  process.exit(0);
}

check();
