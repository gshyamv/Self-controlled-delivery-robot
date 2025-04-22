// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpumtzvJJwIiilruI51nPoxvZMu8k0t70",
  authDomain: "deltra-6bfa2.firebaseapp.com",
  projectId: "deltra-6bfa2",
  storageBucket: "deltra-6bfa2.firebasestorage.app",
  messagingSenderId: "1075015286905",
  appId: "1:1075015286905:web:f5e8bafef1bcea32d8d4a8",
  measurementId: "G-LS1H1RH6M2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };