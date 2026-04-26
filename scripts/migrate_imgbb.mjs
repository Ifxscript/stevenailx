import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import FormData from "form-data";

const IMGBB_API_KEY = process.env.VITE_IMGBB_API_KEY;

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

const ASSETS_DIR = "src/assets";
const files = fs.readdirSync(ASSETS_DIR).filter(f => /\.(png|jpg|jpeg|JPG)$/.test(f));

async function uploadToImgBB(filePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: form
  });
  
  const result = await response.json();
  if (result.success) return result.data.url;
  throw new Error("ImgBB upload failed: " + JSON.stringify(result));
}

async function migrate() {
  console.log("🚀 Migrating Assets to ImgBB Cloud...");
  const mapping = {};

  for (const file of files) {
    try {
      console.log("Uploading " + file + "...");
      const url = await uploadToImgBB(path.join(ASSETS_DIR, file));
      mapping[file] = url;
      console.log("✅ Cloud URL: " + url);
    } catch (err) {
      console.error("❌ Failed: " + file, err);
    }
  }

  console.log("\n🔗 Updating Firestore Records...");
  try {
    const docRef = doc(db, 'site_content', 'landing_page');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Document not found");

    let dataStr = JSON.stringify(docSnap.data());
    
    for (const [file, url] of Object.entries(mapping)) {
      const regex = new RegExp('(\.\.\/assets\/|/assets/|/src/assets/)' + file.replace('.', '\.'), 'g');
      dataStr = dataStr.replace(regex, url);
    }

    await updateDoc(docRef, JSON.parse(dataStr));
    console.log("✨ ALL ORIGINAL PHOTOS ARE NOW CLOUD-MANAGED!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Data patch failed:", err);
    process.exit(1);
  }
}

migrate();
