import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function usernameToEmail(username) {
    const clean = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean}@dnd-local.com`;
}

// Переключение вкладок
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Регистрация
const registerFormElement = document.getElementById('register');
if (registerFormElement) {
    registerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        const messageDiv = document.getElementById('message');
        
        if (!username) { 
            messageDiv.innerHTML = '<div class="message error">Введите логин</div>'; 
            return; 
        }
        if (password.length < 6) { 
            messageDiv.innerHTML = '<div class="message error">Пароль минимум 6 символов</div>'; 
            return; 
        }
        
        const email = usernameToEmail(username);
        console.log('Регистрация:', { username, email });
        
        try {
            // 1. Создаём пользователя в Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Пользователь создан в Auth:', user.uid);
            
            // 2. Создаём документ в Firestore
            const userData = {
                username: username,
                role: "player",
                flg_active: true,
                createdAt: new Date().toISOString()
            };
            console.log('Попытка записи в Firestore:', user.uid, userData);
            
            await setDoc(doc(db, "players", user.uid), userData);
            console.log('Документ успешно записан в Firestore');
            
            messageDiv.innerHTML = '<div class="message success">Регистрация успешна</div>';
            setTimeout(() => window.location.href = '/profile.html', 1500);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            console.error('Код ошибки:', error.code);
            console.error('Сообщение:', error.message);
            
            if (error.code === 'auth/email-already-in-use') {
                messageDiv.innerHTML = '<div class="message error">Логин занят</div>';
            } else if (error.code === 'permission-denied') {
                messageDiv.innerHTML = '<div class="message error">Ошибка прав доступа к базе данных. Проверьте правила Firestore.</div>';
            } else {
                messageDiv.innerHTML = '<div class="message error">Ошибка: ' + error.message + '</div>';
            }
        }
    });
}

// Вход
const loginFormElement = document.getElementById('login');
if (loginFormElement) {
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('message');
        
        if (!username) { 
            messageDiv.innerHTML = '<div class="message error">Введите логин</div>'; 
            return; 
        }
        
        const email = usernameToEmail(username);
        console.log('Вход:', { username, email });
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Вход выполнен');
            messageDiv.innerHTML = '<div class="message success">Вход выполнен</div>';
            setTimeout(() => window.location.href = '/profile.html', 1000);
        } catch (error) {
            console.error('Ошибка входа:', error);
            messageDiv.innerHTML = '<div class="message error">Неверный логин или пароль</div>';
        }
    });
}

// Проверка авторизации
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Авторизован:', user.uid, user.email);
    } else {
        console.log('Не авторизован');
    }
    if (user && window.location.pathname.includes('auth.html')) {
        window.location.href = '/profile.html';
    }
});
