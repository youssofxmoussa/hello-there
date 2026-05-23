import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDCeTjxFqft96XH5uEyv21sruBZ8WhAKY",
  authDomain: "halaxgpt.firebaseapp.com",
  projectId: "halaxgpt",
  storageBucket: "halaxgpt.firebasestorage.app",
  messagingSenderId: "173473579490",
  appId: "1:173473579490:web:efed45968d648dbe4639bb",
  measurementId: "G-436TP9YG4F",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function waitForAuthUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
