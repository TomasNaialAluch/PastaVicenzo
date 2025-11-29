import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC9zUkdQULNoe-G2KR97xdUDpdWAnUARe0",
  authDomain: "pastavicenzo.firebaseapp.com",
  projectId: "pastavicenzo",
  storageBucket: "pastavicenzo.firebasestorage.app",
  messagingSenderId: "575935344286",
  appId: "1:575935344286:web:8b7fceca33be909a76958f",
  measurementId: "G-18L2TJMBCN"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics only on client side
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db };
