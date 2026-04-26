import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

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
const storage = getStorage(app);
const db = getFirestore(app, 'stevenailx');

const ASSETS_DIR = "src/assets";
// Check if folder exists
if (!fs.existsSync(ASSETS_DIR)) {
    console.error("Assets directory not found!");
    process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR).filter(f => /\.(png|jpg|jpeg|JPG)$/.test(f));

async function migrate() {
  console.log("🚀 Starting Image Migration to Cloud...");
  const mapping = {};

  for (const file of files) {
    try {
      const filePath = path.join(ASSETS_DIR, file);
      const buffer = fs.readFileSync(filePath);
      const storageRef = ref(storage, "site_assets/" + file);
      
      console.log("Uploading " + file + "...");
      await uploadBytes(storageRef, buffer);
      const url = await getDownloadURL(storageRef);
      mapping[file] = url;
      console.log("✅ Success: " + file);
    } catch (err) {
      console.error("❌ Failed: " + file, err);
    }
  }

  console.log("\n🔗 Updating Firestore with Cloud URLs...");
  try {
    const docRef = doc(db, 'site_content', 'landing_page');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Document not found");

    let dataObj = docSnap.data();
    let dataStr = JSON.stringify(dataObj);
    
    // Replace logic: this replaces the static asset names with cloud URLs
    for (const [file, url] of Object.entries(mapping)) {
      // Find both relative and asset paths
      // We look for the filename in the JSON string
      const regex = new RegExp('(\.\.\/assets\/|/assets/|/src/assets/)' + file.replace('.', '\.'), 'g');
      dataStr = dataStr.replace(regex, url);
    }

    await updateDoc(docRef, JSON.parse(dataStr));
    console.log("✨ EVERYTHING IS NOW 100% CLOUD-MANAGED!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Data patch failed:", err);
    process.exit(1);
  }
}

migrate();
