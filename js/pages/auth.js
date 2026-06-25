/* ==========================================================================
   auth.js — Страница входа и регистрации
   Содержит формы для входа/регистрации через Firebase Auth.
   Имя пользователя конвертируется в локальный email (username@dnd-local.com).
   ========================================================================== */

import { el, createNavigation, createCard, createInput, createButton, createFooter, showMessage } from '../components.js';
import { initAuth, loadSettings, usernameToEmail, currentUser } from '../common.js';
import { auth, db } from '../firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Состояние страницы ------- */
let currentTab = 'login'; // 'login' или 'register'

/* ------- Инициализация страницы ------- */
let pageInitialized = false;

async function initPage() {
    if (pageInitialized) return;
    pageInitialized = true;
    try {
        const app = document.getElementById('app');
        if (!app) throw new Error('Контейнер #app не найден');

        // Если пользователь уже авторизован — перенаправляем на главную
        if (currentUser) {
            window.location.href = './index.html';
            return;
        }

        // Загружаем настройки
        await loadSettings();

        // Навигация
        const nav = createNavigation();
        app.appendChild(nav);

        // Контейнер для формы авторизации
        const container = el('div', { className: 'page-container auth-container' });

        // Заголовок
        container.appendChild(
            el('h1', {
                className: 'card-title-lg',
                style: { textAlign: 'center', marginBottom: '1.5rem' }
            }, 'Добро пожаловать!')
        );

        // Карточка с формой
        const card = createCard({ className: 'auth-card' });
        card.appendChild(createAuthTabs());
        card.appendChild(createForm());
        container.appendChild(card);

        app.appendChild(container);
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки страницы авторизации:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ВКЛАДКИ (Вход / Регистрация)
   ====================================================================== */

/**
 * Создаёт вкладки для переключения между входом и регистрацией.
 * @returns {HTMLElement}
 */
function createAuthTabs() {
    const tabsContainer = el('div', { className: 'auth-tabs' });

    // Вкладка "Вход"
    const loginTab = el('button', {
        className: 'auth-tab active',
        id: 'login-tab',
        onclick: () => switchTab('login')
    }, 'Вход');

    // Вкладка "Регистрация"
    const registerTab = el('button', {
        className: 'auth-tab',
        id: 'register-tab',
        onclick: () => switchTab('register')
    }, 'Регистрация');

    tabsContainer.appendChild(loginTab);
    tabsContainer.appendChild(registerTab);

    return tabsContainer;
}

/**
 * Переключает между вкладками входа и регистрации.
 * @param {string} tab — 'login' или 'register'
 */
function switchTab(tab) {
    currentTab = tab;

    // Обновляем активный класс вкладок
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (!loginTab || !registerTab || !loginForm || !registerForm) return;

    if (tab === 'login') {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    }
}

/* ======================================================================
   ФОРМЫ
   ====================================================================== */

/**
 * Создаёт формы входа и регистрации.
 * @returns {HTMLElement}
 */
function createForm() {
    const container = el('div', { style: { marginTop: '1rem' } });

    // Важно: id форм используются для переключения вкладок
    container.appendChild(createLoginForm());
    container.appendChild(createRegisterForm());

    return container;
}

/* ----- Форма входа ----- */

function createLoginForm() {
    const form = el('div', { id: 'login-form' });

    // Поле имени пользователя
    const usernameInput = el('input', {
        className: 'form-input',
        type: 'text',
        id: 'login-username',
        placeholder: 'Имя пользователя',
        style: { marginBottom: '1rem' }
    });

    // Поле пароля
    const passwordInput = el('input', {
        className: 'form-input',
        type: 'password',
        id: 'login-password',
        placeholder: 'Пароль',
        style: { marginBottom: '1.5rem' }
    });

    // Кнопка входа
    const submitBtn = createButton('Войти', {
        className: 'btn',
        onClick: handleLogin
    });

    // Контейнер для сообщений об ошибках
    const messageContainer = el('div', { id: 'login-message' });

    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    form.appendChild(submitBtn);
    form.appendChild(messageContainer);

    // Обработка Enter в полях ввода
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordInput.focus();
    });
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    return form;
}

/* ----- Форма регистрации ----- */

function createRegisterForm() {
    const form = el('div', { id: 'register-form', style: { display: 'none' } });

    // Поле имени пользователя
    const usernameInput = el('input', {
        className: 'form-input',
        type: 'text',
        id: 'register-username',
        placeholder: 'Имя пользователя (мин. 3 символа)',
        style: { marginBottom: '1rem' }
    });

    // Поле пароля
    const passwordInput = el('input', {
        className: 'form-input',
        type: 'password',
        id: 'register-password',
        placeholder: 'Пароль (мин. 6 символов)',
        style: { marginBottom: '1.5rem' }
    });

    // Кнопка регистрации
    const submitBtn = createButton('Зарегистрироваться', {
        className: 'btn',
        onClick: handleRegister
    });

    // Контейнер для сообщений
    const messageContainer = el('div', { id: 'register-message' });

    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    form.appendChild(submitBtn);
    form.appendChild(messageContainer);

    // Обработка Enter
    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') passwordInput.focus();
    });
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleRegister();
    });

    return form;
}

/* ======================================================================
   ЛОГИКА ВХОДА
   ====================================================================== */

/**
 * Обрабатывает попытку входа в систему.
 */
async function handleLogin() {
    try {
        const username = document.getElementById('login-username')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        const messageEl = document.getElementById('login-message');

        // Очищаем предыдущие сообщения
        if (messageEl) messageEl.innerHTML = '';

        // Проверка заполнения полей
        if (!username) {
            showMessage('Введите имя пользователя', 'error');
            return;
        }

        if (!password) {
            showMessage('Введите пароль', 'error');
            return;
        }

        // Конвертируем имя пользователя в email
        const email = usernameToEmail(username);

        // Попытка входа через Firebase
        await signInWithEmailAndPassword(auth, email, password);

        // Успешный вход — перенаправляем на главную
        window.location.href = './index.html';

    } catch (error) {
        // Обработка различных ошибок Firebase с понятными сообщениями
        let errorMessage = 'Ошибка входа';

        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Пользователь с таким именем не найден';
                break;
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                errorMessage = 'Неверный пароль';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Некорректное имя пользователя';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Слишком много попыток. Попробуйте позже';
                break;
            default:
                errorMessage = 'Ошибка входа: ' + (error.message || 'Неизвестная ошибка');
        }

        showMessage(errorMessage, 'error');
    }
}

/* ======================================================================
   ЛОГИКА РЕГИСТРАЦИИ
   ====================================================================== */

/**
 * Обрабатывает регистрацию нового пользователя.
 */
async function handleRegister() {
    try {
        const username = document.getElementById('register-username')?.value?.trim();
        const password = document.getElementById('register-password')?.value;
        const messageEl = document.getElementById('register-message');

        // Очищаем предыдущие сообщения
        if (messageEl) messageEl.innerHTML = '';

        // Проверка заполнения полей
        if (!username || username.length < 3) {
            showMessage('Имя пользователя должно содержать минимум 3 символа', 'error');
            return;
        }

        // Проверка на недопустимые символы в имени
        if (!/^[a-zA-Z0-9а-яА-ЯёЁ_\-]+$/.test(username)) {
            showMessage('Имя может содержать только буквы, цифры, дефис и подчёркивание', 'error');
            return;
        }

        if (!password || password.length < 6) {
            showMessage('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }

        // Конвертируем имя пользователя в email
        const email = usernameToEmail(username);

        // Создаём пользователя в Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Сохраняем данные пользователя в Firestore
        await setDoc(doc(db, 'players', user.uid), {
            username: username,
            email: email,
            role: 'player',
            createdAt: new Date(),
            quote: ''
        });

        // Успешная регистрация — перенаправляем на главную
        window.location.href = './index.html';

    } catch (error) {
        // Обработка ошибок регистрации
        let errorMessage = 'Ошибка регистрации';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Пользователь с таким именем уже существует';
                break;
            case 'auth/weak-password':
                errorMessage = 'Пароль слишком простой. Используйте минимум 6 символов';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Некорректное имя пользователя';
                break;
            default:
                errorMessage = 'Ошибка регистрации: ' + (error.message || 'Неизвестная ошибка');
        }

        showMessage(errorMessage, 'error');
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
