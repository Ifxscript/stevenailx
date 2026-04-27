import { db } from '../src/lib/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

async function checkUsers() {
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log('Total users in Firestore "users" collection:', usersSnap.size);
  usersSnap.forEach(doc => {
    console.log(`- ${doc.id}: ${doc.data().email}`);
  });
}

checkUsers().catch(console.error);
