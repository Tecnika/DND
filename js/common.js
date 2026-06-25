/* ==========================================================================
   common.js — Общие утилиты и состояния приложения
   Содержит: загрузку настроек, информацию о текущем пользователе,
   проверки ролей, управление аутентификацией и вспомогательные функции.
   ========================================================================== */

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Глобальное состояние приложения ------- */
export let currentUser = null;      // Текущий авторизованный пользователь Firebase
export let currentUserRole = null;  // Роль: 'admin', 'master', 'player'
export let currentUsername = null;  // Отображаемое имя пользователя
export let appSettings = null;      // Настройки приложения (аватары, роли)

/* ------- Функции обратного вызова для уведомления об изменении авторизации ------- */
const authListeners = [];

/**
 * Подписка на изменения статуса авторизации.
 * @param {Function} callback — функция, вызываемая при изменении
 */
export function onAuthChange(callback) {
    authListeners.push(callback);
    // Если пользователь уже загружен — вызываем сразу
    if (currentUser !== undefined) {
        callback(currentUser, currentUserRole, currentUsername);
    }
}

/**
 * Уведомить всех подписчиков об изменении авторизации.
 */
function notifyAuthChange() {
    authListeners.forEach(fn => {
        try {
            fn(currentUser, currentUserRole, currentUsername);
        } catch (err) {
            console.error('Ошибка в обработчике onAuthChange:', err.message);
        }
    });
}

/* ======================================================================
   ЗАГРУЗКА НАСТРОЕК
   ====================================================================== */

/**
 * Загружает настройки приложения из JSON-файла.
 * Настройки кешируются в переменной appSettings.
 * @returns {Promise<Object>} — объект с настройками
 */
export async function loadSettings() {
    // Если настройки уже загружены — возвращаем кеш
    if (appSettings) return appSettings;

    try {
        // Добавляем timestamp, чтобы избежать кеширования браузером
        const response = await fetch('./data/settings.json?t=' + Date.now());

        if (!response.ok) {
            throw new Error('Файл настроек не найден (статус: ' + response.status + ')');
        }

        appSettings = await response.json();

        if (!appSettings.avatars) {
            // Если в настройках нет раздела аватаров — используем значения по умолчанию
            appSettings.avatars = {
                style: 'adventurer',
                backgroundColor: '6366f1,4c3b9e,8b5cf6',
                size: 150,
                radius: 50
            };
        }

        return appSettings;
    } catch (error) {
        // При ошибке загрузки используем значения по умолчанию
        console.error('Ошибка загрузки настроек:', error.message);
        appSettings = {
            avatars: {
                style: 'adventurer',
                backgroundColor: '6366f1,4c3b9e,8b5cf6',
                size: 150,
                radius: 50
            }
        };
        return appSettings;
    }
}

/* ======================================================================
   АВАТАРЫ
   ====================================================================== */

/**
 * Генерирует URL для аватара пользователя через DiceBear API.
 * @param {string} username — имя пользователя (seed для аватара)
 * @param {number|null} size — размер аватара в пикселях
 * @returns {string} — URL аватара
 */
export function getAvatarUrl(username, size = null) {
    // Если имя не указано — возвращаем заглушку
    if (!username || typeof username !== 'string') {
        return 'https://placehold.co/150x150/4c3b9e/white?text=?';
    }

    const avatarSize = size || appSettings?.avatars?.size || 150;
    const style = appSettings?.avatars?.style || 'adventurer';
    const colors = appSettings?.avatars?.backgroundColor || '6366f1,4c3b9e,8b5cf6';
    const radius = appSettings?.avatars?.radius || 50;

    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(username)}&backgroundColor=${colors}&radius=${radius}&size=${avatarSize}`;
}

/* ======================================================================
   РОЛИ ПОЛЬЗОВАТЕЛЕЙ
   ====================================================================== */

/**
 * Возвращает русское название роли.
 * @param {string} role — ключ роли ('admin', 'master', 'player')
 * @returns {string} — название роли на русском
 */
export function getRoleName(role) {
    const roles = {
        admin: 'Администратор',
        master: 'Мастер',
        player: 'Игрок'
    };

    return roles[role] || role || 'Игрок';
}

/**
 * Возвращает иконку для роли.
 * @param {string} role — ключ роли
 * @returns {string} — строка с иконкой-эмодзи
 */
export function getRoleIcon(role) {
    const icons = {
        admin: '👑',
        master: '🎲',
        player: '🎮'
    };
    return icons[role] || '🎮';
}

/* ======================================================================
   АУТЕНТИФИКАЦИЯ
   ====================================================================== */

/**
 * Инициализирует отслеживание состояния аутентификации.
 * Вызывается один раз при загрузке страницы.
 * @param {Function} onReady — колбэк, вызываемый после загрузки данных пользователя
 */
export function initAuth(onReady) {
    try {
        onAuthStateChanged(auth, async (user) => {
            currentUser = user;

            if (user) {
                // Пользователь авторизован — загружаем данные из Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'players', user.uid));

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        currentUserRole = data.role || 'player';
                        currentUsername = data.username || user.email?.split('@')[0] || 'Пользователь';
                    } else {
                        // Если документа в Firestore нет — используем данные из email
                        currentUsername = user.email?.split('@')[0] || 'Пользователь';
                        currentUserRole = 'player';
                    }
                } catch (error) {
                    console.error('Ошибка загрузки данных пользователя:', error.message);
                    currentUsername = user.email?.split('@')[0] || 'Пользователь';
                    currentUserRole = 'player';
                }
            } else {
                // Пользователь не авторизован
                currentUserRole = null;
                currentUsername = null;
            }

            // Сначала вызываем колбэк готовности — он создаёт DOM-структуру страницы
            // Важно: дожидаемся его завершения, чтобы DOM был готов для обновления навигации
            if (typeof onReady === 'function') {
                try {
                    await Promise.resolve(onReady(currentUser, currentUserRole, currentUsername));
                } catch (err) {
                    console.error('Ошибка в onReady колбэке:', err.message);
                }
            }

            // Затем уведомляем подписчиков (навигация и другие компоненты)
            notifyAuthChange();
        });
    } catch (error) {
        console.error('Ошибка инициализации аутентификации:', error.message);
        // Если аутентификация не работает — всё равно вызываем колбэк с null
        if (typeof onReady === 'function') {
            onReady(null, null, null);
        }
        notifyAuthChange();
    }
}

/* ======================================================================
   ПРОВЕРКИ ДОСТУПА
   ====================================================================== */

/**
 * Проверяет, является ли текущий пользователь администратором.
 * Сначала проверяет кешированную роль, затем — Firebase.
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
    if (!currentUser) return false;

    // Если роль уже загружена в памяти — проверяем её
    if (currentUserRole === 'admin') return true;

    // Иначе — запрашиваем из Firestore
    try {
        const userDoc = await getDoc(doc(db, 'players', currentUser.uid));
        return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (error) {
        console.error('Ошибка проверки роли администратора:', error.message);
        return false;
    }
}

/**
 * Перенаправляет на страницу входа, если пользователь не авторизован.
 * @returns {boolean} — true если авторизован, false если нет
 */
export function requireAuth() {
    if (!currentUser) {
        window.location.href = './auth.html';
        return false;
    }
    return true;
}

/**
 * Перенаправляет на главную, если пользователь не администратор.
 * @returns {Promise<boolean>} — true если админ, false если нет
 */
export async function requireAdmin() {
    const admin = await isAdmin();
    if (!admin) {
        alert('Доступ запрещён. Эта страница только для администраторов.');
        window.location.href = './index.html';
        return false;
    }
    return true;
}

/**
 * Проверяет, имеет ли пользователь роль мастера или админа.
 * @returns {boolean}
 */
export function isMasterOrAdmin() {
    return currentUserRole === 'admin' || currentUserRole === 'master';
}

/**
 * Конвертирует имя пользователя в локальный email для Firebase Auth.
 * Используется в странице авторизации.
 * @param {string} username — имя пользователя
 * @returns {string} — email вида username@dnd-local.com
 */
export function usernameToEmail(username) {
    if (!username || typeof username !== 'string') {
        throw new Error('Имя пользователя не может быть пустым');
    }
    return username.toLowerCase().trim() + '@dnd-local.com';
}

/**
 * Выход из системы.
 */
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = './index.html';
    } catch (error) {
        console.error('Ошибка при выходе из системы:', error.message);
        alert('Не удалось выйти из системы. Попробуйте ещё раз.');
    }
}

/* ======================================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ====================================================================== */

/**
 * Безопасное получение данных документа Firestore.
 * @param {string} collection — название коллекции
 * @param {string} docId — ID документа
 * @returns {Promise<Object|null>} — данные документа или null
 */
export async function getDocumentSafe(collection, docId) {
    try {
        const docRef = doc(db, collection, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error(`Ошибка получения документа ${collection}/${docId}:`, error.message);
        return null;
    }
}

/**
 * Форматирует дату в читаемый вид.
 * @param {Date|string|number} date — дата для форматирования
 * @returns {string} — отформатированная дата
 */
export function formatDate(date) {
    if (!date) return 'неизвестно';

    try {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'неизвестно';

        return d.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'неизвестно';
    }
}
