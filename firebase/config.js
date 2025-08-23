import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZ2rpvt2vvubdlF07YV12w8XcfneZVo7s",
  authDomain: "fonecrib.firebaseapp.com",
  projectId: "fonecrib",
  storageBucket: "fonecrib.firebasestorage.app",
  messagingSenderId: "191898274785",
  appId: "1:191898274785:web:6a904a444d3a2a29c420a0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);