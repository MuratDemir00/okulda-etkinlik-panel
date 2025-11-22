import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDNnwOr-HT_05r_bQfyB9xqgVSkZCKDO0Y",
  authDomain: "okulda-etkinlik.firebaseapp.com",
  projectId: "okulda-etkinlik",
  storageBucket: "okulda-etkinlik.firebasestorage.app",
  messagingSenderId: "961658300317",
  appId: "1:961658300317:web:cdece73a10956f8709f174",
  measurementId: "G-7Z4LBDZ169",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
