import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================
// Firebase Config
// ======================
export const firebaseConfig = {
  apiKey: "AIzaSyDNnwOr-HT_05r_bQfyB9xqgVSkZCKDO0Y",
  authDomain: "okulda-etkinlik.firebaseapp.com",
  projectId: "okulda-etkinlik",
  storageBucket: "okulda-etkinlik.firebasestorage.app",
  messagingSenderId: "961658300317",
  appId: "1:961658300317:web:cdece73a10956f8709f174",
  measurementId: "G-7Z4LBDZ169",
};

// ======================
// Initialize
// ======================
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ======================
// Admin kontrol fonksiyonu
// ======================
export async function requireAdmin() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const ref = doc(db, "admins", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Bu panel için yetkiniz yok.");
        await signOut(auth);
        window.location.href = "login.html";
        return;
      }

      resolve(user); // admin kabul edildi
    });
  });
}

// ======================
// Login helper
// ======================
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ======================
// Logout helper
// ======================
export async function logout() {
  return signOut(auth);
}
