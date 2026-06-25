/* ==========================================================================
   user-page.js — Публичный профиль пользователя (только для чтения)
   Отображает информацию о пользователе без возможности редактирования.
   Загружается по ?id= из параметров URL.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createAvatarImage, createButton, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings, getRoleName, getRoleIcon, formatDate, currentUser } from '../common.js';
import { db } from '../firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

        // Получаем ID пользователя из URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        if (!userId) {
            container.appendChild(
                createCard({},
                    el('h2', { className: 'card-title' }, 'Пользователь не указан'),
                    el('p', { className: 'empty-state' }, 'Укажите ID пользователя в параметре ?id=')
                )
            );
            app.appendChild(container);
            app.appendChild(createFooter());
            return;
        }

        app.appendChild(container);

        // Загружаем данные пользователя
        await loadUserData(userId, container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки публичного профиля:', error.message);
        showMessage('Не удалось загрузить профиль: ' + error.message, 'error');
    }
}

/* ======================================================================
   ЗАГРУЗКА ДАННЫХ
   ====================================================================== */

/**
 * Загружает данные пользователя из Firestore.
 * @param {string} userId — ID пользователя
 * @param {HTMLElement} container
 */
async function loadUserData(userId, container) {
    const loader = showLoader(container, 'Загрузка профиля...');

    try {
        const userDoc = await getDoc(doc(db, 'players', userId));

        if (loader) hideLoader(loader);

        if (!userDoc.exists()) {
            container.appendChild(
                createCard({},
                    el('h2', { className: 'card-title' }, 'Пользователь не найден'),
                    el('p', { className: 'empty-state' }, 'Такого пользователя не существует')
                )
            );
            return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() };

        // Отрисовываем профиль
        renderUserProfile(userData, container);

    } catch (error) {
        if (loader) hideLoader(loader);
        console.error('Ошибка загрузки данных пользователя:', error.message);
        showMessage('Ошибка загрузки профиля: ' + error.message, 'error');
    }
}

/* ======================================================================
   ОТРИСОВКА ПРОФИЛЯ
   ====================================================================== */

/**
 * Отрисовывает публичный профиль (только чтение).
 * @param {Object} userData — данные пользователя
 * @param {HTMLElement} container
 */
function renderUserProfile(userData, container) {
    const profileLayout = el('div', { className: 'profile-layout' });

    // === ЛЕВАЯ КОЛОНКА ===
    const sidebar = el('div', { className: 'profile-sidebar' });

    // Аватар
    sidebar.appendChild(createAvatarImage(userData.username));

    // Имя
    sidebar.appendChild(
        el('h2', {
            style: {
                fontFamily: "'Playfair Display', serif",
                color: '#c4b5fd',
                marginBottom: '0.5rem'
            }
        }, userData.username || 'Без имени')
    );

    // Роль
    const roleName = getRoleName(userData.role);
    const roleIcon = getRoleIcon(userData.role);
    sidebar.appendChild(
        el('p', { className: 'profile-info' },
            el('span', { className: 'profile-label' }, 'Роль: '),
            ' ' + roleIcon + ' ' + roleName
        )
    );

    // Дата регистрации
    if (userData.createdAt) {
        sidebar.appendChild(
            el('p', { className: 'profile-info' },
                el('span', { className: 'profile-label' }, 'На сайте с: '),
                ' ' + formatDate(userData.createdAt.toDate?.() || userData.createdAt)
            )
        );
    }

    profileLayout.appendChild(sidebar);

    // === ПРАВАЯ КОЛОНКА ===
    const content = el('div', { className: 'profile-content' });

    // Цитата (только чтение)
    const quoteBlock = el('div', { className: 'public-quote' },
        el('div', { className: 'public-quote-label' }, 'Публичная цитата')
    );

    if (userData.quote) {
        quoteBlock.appendChild(
            el('div', { className: 'public-quote-text' }, userData.quote)
        );
    } else {
        quoteBlock.appendChild(
            el('p', { className: 'empty-quote' }, 'Цитата не задана')
        );
    }

    content.appendChild(quoteBlock);

    // Список персонажей
    const charactersHeader = el('h3', { className: 'card-title' }, 'Персонажи');
    content.appendChild(charactersHeader);
    const charactersContainer = el('div', { id: 'user-page-characters' },
        el('p', { className: 'empty-state' }, 'Загрузка персонажей...')
    );
    content.appendChild(charactersContainer);

    profileLayout.appendChild(content);
    container.appendChild(profileLayout);

    // Загружаем персонажей
    loadPublicCharacters(userData.id);
}

/**
 * Загружает персонажей пользователя.
 * @param {string} userId — ID пользователя
 */
async function loadPublicCharacters(userId) {
    try {
        const container = document.getElementById('user-page-characters');
        if (!container) return;

        const charactersQuery = query(
            collection(db, 'characters'),
            where('uid', '==', userId)
        );

        const querySnapshot = await getDocs(charactersQuery);

        container.innerHTML = '';

        if (querySnapshot.empty) {
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Персонажи не найдены')
            );
            return;
        }

        querySnapshot.forEach(docItem => {
            const charData = docItem.data();

            const charCard = createGameCard({
                title: charData.name || 'Без имени',
                subtitle: (charData.race || 'Неизвестно') + ' — ' + (charData.class || 'Неизвестно'),
                description: 'Сила: ' + (charData.strength || '?') +
                            ' | Ловк: ' + (charData.dexterity || '?') +
                            ' | Тел: ' + (charData.constitution || '?') +
                            ' | Инт: ' + (charData.intelligence || '?') +
                            ' | Муд: ' + (charData.wisdom || '?') +
                            ' | Хар: ' + (charData.charisma || '?')
            });

            container.appendChild(charCard);
        });

    } catch (error) {
        console.error('Ошибка загрузки персонажей:', error.message);
        const container = document.getElementById('user-page-characters');
        if (container) {
            container.innerHTML = '';
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки персонажей')
            );
        }
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
