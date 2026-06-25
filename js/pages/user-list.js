/* ==========================================================================
   user-list.js — Страница сообщества (список пользователей)
   Загружает и отображает всех зарегистрированных пользователей.
   Каждый пользователь представлен карточкой с аватаром, именем и ролью.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createAvatarImage, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings, getRoleName, getRoleIcon } from '../common.js';
import { db } from '../firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Инициализация страницы ------- */
let pageInitialized = false;

async function initPage() {
    if (pageInitialized) return;
    pageInitialized = true;
    try {
        const app = document.getElementById('app');
        if (!app) throw new Error('Контейнер #app не найден');

        // Загружаем настройки
        await loadSettings();

        // Навигация
        const nav = createNavigation();
        app.appendChild(nav);

        // Основной контейнер
        const container = el('div', { className: 'page-container' });

        // Заголовок
        container.appendChild(
            el('h1', { className: 'card-title-lg' }, '👥 Сообщество')
        );

        // Контейнер для списка пользователей
        const userListContainer = el('div', { id: 'user-list-container' });
        container.appendChild(userListContainer);

        app.appendChild(container);

        // Загружаем пользователей
        await loadUsers();

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки страницы сообщества:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ
   ====================================================================== */

/**
 * Загружает всех пользователей из Firestore и отрисовывает их.
 */
async function loadUsers() {
    try {
        const container = document.getElementById('user-list-container');
        if (!container) return;

        const loader = showLoader(container, 'Загрузка пользователей...');

        const querySnapshot = await getDocs(collection(db, 'players'));

        if (loader) hideLoader(loader);

        // Очищаем контейнер
        container.innerHTML = '';

        if (querySnapshot.empty) {
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Пользователей пока нет')
            );
            return;
        }

        const users = [];

        querySnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        // Статистика
        container.appendChild(
            el('p', {
                style: {
                    color: '#8b5cf6',
                    marginBottom: '1.5rem',
                    fontSize: '0.95rem'
                }
            }, 'Всего участников: ' + users.length)
        );

        // Сетка пользователей
        const grid = el('div', { className: 'grid' });

        users.forEach(user => {
            const roleName = getRoleName(user.role);
            const roleIcon = getRoleIcon(user.role);

            const card = createGameCard({
                title: user.username || 'Без имени',
                subtitle: roleIcon + ' ' + roleName,
                description: user.quote || '',
                onClick: () => {
                    window.location.href = './profile-page.html?id=' + encodeURIComponent(user.id);
                }
            });

            // Вставляем аватар в начало карточки
            const avatar = createAvatarImage(user.username, 80, 'avatar-img');
            avatar.style.width = '80px';
            avatar.style.height = '80px';
            avatar.style.margin = '0 auto 0.5rem';
            card.insertBefore(avatar, card.firstChild);

            grid.appendChild(card);
        });

        container.appendChild(grid);

    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error.message);
        const container = document.getElementById('user-list-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки пользователей: ' + error.message)
            );
        }
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
