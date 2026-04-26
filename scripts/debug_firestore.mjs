// Dump ALL Firestore data to see every available image URL
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyC2m1tzJI-DS2WWWjJw-xFBNEzEBqVj9QY",
  authDomain: "stevenailx.firebaseapp.com",
  projectId: "stevenailx",
  storageBucket: "stevenailx.firebasestorage.app",
  messagingSenderId: "231302928962",
  appId: "1:231302928962:web:41de51cc3bcf9c832aabdb",
});
const db = getFirestore(app, 'stevenailx');

async function dump() {
  // Full landing_page dump
  const snap = await getDoc(doc(db, "site_content", "landing_page"));
  if (snap.exists()) {
    console.log(JSON.stringify(snap.data(), null, 2));
  }

  // Full services collection dump
  console.log("\n\n=== SERVICES COLLECTION ===");
  const sSnap = await getDocs(collection(db, "services"));
  sSnap.forEach(d => {
    console.log(`\n--- Document: ${d.id} ---`);
    console.log(JSON.stringify(d.data(), null, 2));
  });

  process.exit(0);
}
dump().catch(e => { console.error(e); process.exit(1); });
