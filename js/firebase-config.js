// Подключение Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ВАШИ ДАННЫЕ ИЗ FIREBASE CONSOLE (скопируйте сюда!)
const firebaseConfig = {
  apiKey: "AIzaSyDRbak2gj5XMn8hPZ7zbJs9CtFBFDuaQDs",
  authDomain: "dnd-bd.firebaseapp.com",
  projectId: "dnd-bd",
  storageBucket: "dnd-bd.firebasestorage.app",
  messagingSenderId: "284167928066",
  appId: "1:284167928066:web:627bd42566ecc397766a1b",
  measurementId: "G-D39XC241YP"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Экспортируем для использования в других файлах
export { auth, db };