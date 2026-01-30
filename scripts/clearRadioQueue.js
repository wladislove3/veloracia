// scripts/clearRadioQueue.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Вставьте сюда ваш firebaseConfig:
const firebaseConfig = {
  apiKey: "AIzaSyBCAXjNt2nwSNwm7OhZAtclDkBEbJXP06o",
  authDomain: "veloracia.firebaseapp.com",
  projectId: "veloracia",
  storageBucket: "veloracia.appspot.com",
  messagingSenderId: "742580188568",
  appId: "1:742580188568:web:7af7dcb873caacab23e7ed",
  measurementId: "G-MXX2H2TWYP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearRadioQueue() {
  const colRef = collection(db, 'radioQueue');
  const snapshot = await getDocs(colRef);
  const batch = [];
  snapshot.forEach((docSnap) => {
    batch.push(deleteDoc(doc(db, 'radioQueue', docSnap.id)));
  });
  await Promise.all(batch);
  console.log(`Удалено пользователей из очереди: ${batch.length}`);
}

clearRadioQueue().then(() => {
  console.log('Готово!');
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});