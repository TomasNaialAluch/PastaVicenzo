import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDu-mtqAJQYLLi5T1QBxL3BiTnsxpXZlko",
  authDomain: "pastasvicenzo.firebaseapp.com",
  projectId: "pastasvicenzo",
  storageBucket: "pastasvicenzo.firebasestorage.app",
  messagingSenderId: "772204708211",
  appId: "1:772204708211:web:64db7bb1cf80298251c506",
  measurementId: "G-F0STK1VZQB"
};

// Initialize Firebase
// Use getApp/getApps to avoid initializing twice in hot-reload environments or SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only on client side
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };

