import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCjByCQ41RIk30Qr_aWgwciDXzcsgJy7w0",
  authDomain: "honeychain-3630b.firebaseapp.com",
  databaseURL: "https://honeychain-3630b-default-rtdb.firebaseio.com",
  projectId: "honeychain-3630b",
  storageBucket: "honeychain-3630b.firebasestorage.app",
  messagingSenderId: "884485747594",
  appId: "1:884485747594:web:24a7662990a30ae9fd8e73",
  measurementId: "G-KJXN2TSBKE",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
