/* ==========================================================================
   firebase-config.js — Инициализация Firebase
   Здесь создаётся подключение к Firebase (аутентификация и база данных).
   Все модули проекта импортируют auth и db из этого файла.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Конфигурация Firebase проекта.
 * ВАЖНО: Эти данные публичны и безопасны для клиентского кода —
 * это настройки подключения, а не секретные ключи.
 */
const firebaseConfig = {
    apiKey: "AIzaSyDRbak2gj5XMn8hPZ7zbJs9CtFBFDuaQDs",
    authDomain: "dnd-bd.firebaseapp.com",
    projectId: "dnd-bd",
    storageBucket: "dnd-bd.firebasestorage.app",
    messagingSenderId: "284167928066",
    appId: "1:284167928066:web:627bd42566ecc397766a1b",
    measurementId: "G-D39XC241YP"
};

// Инициализация приложения Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    // Если Firebase не загрузился — показываем понятное сообщение
    console.error('Ошибка инициализации Firebase:', error.message);
    throw new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету.');
}

export { auth, db };
