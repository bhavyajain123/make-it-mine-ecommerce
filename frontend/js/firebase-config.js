
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvYG3ADumC3jGU9D19qeEoxmkr-jGbVQ0",
  authDomain: "ecommerce-project-e937f.firebaseapp.com",
  projectId: "ecommerce-project-e937f",
  storageBucket: "ecommerce-project-e937f.firebasestorage.app",
  messagingSenderId: "156168087450",
  appId: "1:156168087450:web:4ac2f6374553fdc8563c23",
  measurementId: "G-KKWGMMN2MR"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
