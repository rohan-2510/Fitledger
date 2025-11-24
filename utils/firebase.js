// Fitledger/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyCtYk8QqJDKnkl6s_fAGgGTHHJNyVX0g0I",
  authDomain: "fitledger-e8ea2.firebaseapp.com",
  projectId: "fitledger-e8ea2",
  storageBucket: "fitledger-e8ea2.firebasestorage.app",
  messagingSenderId: "636605416706",
  appId: "1:636605416706:web:2223701e20d11166a56e1b",
  measurementId: "G-V99HJCWKMT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);