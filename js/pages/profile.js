/* ==========================================================================
   profile.js — Профиль пользователя
   Загружается по ?id= из параметров URL. Показывает аватар, имя, роль,
   цитату (редактируемую для своего профиля) и список персонажей.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createAvatarImage, createButton, createFooter, showMessage, showLoader, hideLoader, createEmptyState } from '../components.js';
import { initAuth, loadSettings, getRoleName, getRoleIcon, formatDate, currentUser, currentUserRole, currentUsername } from '../common.js';
import { db } from '../firebase-config.js';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Состояние ------- */
let profileUserId = null; // ID пользователя, чей профиль просматривается
let profileData = null;   // Данные просматриваемого профиля

/* ------- Инициализация страницы ------- */
async function initPage() {
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
        profileUserId = urlParams.get('id');

        if (!profileUserId) {
            // Если ID не указан — показываем своё имя страницы профиля или ошибку
            container.appendChild(
                createCard({},
                    el('h2', { className: 'card-title' }, 'Профиль не указан'),
                    el('p', { className: 'empty-state' }, 'Укажите ID пользователя в параметре ?id=')
                )
            );
            app.appendChild(container);
            app.appendChild(createFooter());
            return;
        }

        app.appendChild(container);

        // Загружаем данные профиля
        await loadProfile(container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки профиля:', error.message);
        showMessage('Не удалось загрузить профиль: ' + error.message, 'error');
    }
}

/* ======================================================================
   ЗАГРУЗКА ДАННЫХ ПРОФИЛЯ
   ====================================================================== */

/**
 * Загружает данные пользователя из Firestore и отрисовывает профиль.
 * @param {HTMLElement} container — контейнер для контента
 */
async function loadProfile(container) {
    try {
        // Показываем загрузку
        const loader = showLoader(container, 'Загрузка профиля...');

        // Получаем данные пользователя
        const userDoc = await getDoc(doc(db, 'players', profileUserId));

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

        profileData = { id: userDoc.id, ...userDoc.data() };

        // Отрисовываем профиль
        renderProfile(container);

    } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error.message);
        showMessage('Ошибка загрузки профиля: ' + error.message, 'error');
    }
}

/* ======================================================================
   ОТРИСОВКА ПРОФИЛЯ
   ====================================================================== */

/**
 * Отрисовывает профиль пользователя.
 * @param {HTMLElement} container
 */
function renderProfile(container) {
    const profileLayout = el('div', { className: 'profile-layout' });

    // === ЛЕВАЯ КОЛОНКА: боковая панель ===
    profileLayout.appendChild(createProfileSidebar());

    // === ПРАВАЯ КОЛОНКА: контент ===
    const content = el('div', { className: 'profile-content' });

    // Блок цитаты
    content.appendChild(createQuoteBlock());

    // Список персонажей
    const charactersBlock = el('div', { id: 'characters-block' },
        el('h3', { className: 'card-title' }, 'Персонажи'),
        el('p', { className: 'empty-state' }, 'Загрузка персонажей...')
    );
    content.appendChild(charactersBlock);

    profileLayout.appendChild(content);
    container.appendChild(profileLayout);

    // Загружаем персонажей
    loadCharacters();
}

/* ----- Левая боковая панель ----- */

function createProfileSidebar() {
    const sidebar = el('div', { className: 'profile-sidebar' });

    // Аватар
    sidebar.appendChild(createAvatarImage(profileData.username));

    // Имя пользователя
    sidebar.appendChild(
        el('h2', {
            style: {
                fontFamily: "'Playfair Display', serif",
                color: '#c4b5fd',
                marginBottom: '0.5rem'
            }
        }, profileData.username || 'Без имени')
    );

    // Роль
    const roleName = getRoleName(profileData.role);
    const roleIcon = getRoleIcon(profileData.role);
    sidebar.appendChild(
        el('p', { className: 'profile-info' },
            el('span', { className: 'profile-label' }, 'Роль: '),
            ' ' + roleIcon + ' ' + roleName
        )
    );

    // Дата регистрации
    if (profileData.createdAt) {
        sidebar.appendChild(
            el('p', { className: 'profile-info' },
                el('span', { className: 'profile-label' }, 'На сайте с: '),
                ' ' + formatDate(profileData.createdAt.toDate?.() || profileData.createdAt)
            )
        );
    }

    return sidebar;
}

/* ----- Блок цитаты ----- */

function createQuoteBlock() {
    const block = el('div', { className: 'public-quote' });

    block.appendChild(
        el('div', { className: 'public-quote-label' }, 'Публичная цитата')
    );

    // Проверяем, свой ли это профиль
    const isOwnProfile = currentUser && currentUser.uid === profileUserId;

    if (isOwnProfile) {
        // Свой профиль — можно редактировать цитату
        const quoteText = profileData.quote || '';

        const textarea = el('textarea', {
            className: 'form-textarea',
            id: 'quote-textarea',
            placeholder: 'Напишите свою цитату...',
            style: { minHeight: '80px', marginBottom: '0.5rem' },
            innerText: quoteText
        });

        block.appendChild(textarea);

        const saveBtn = createButton('Сохранить цитату', {
            className: 'btn-secondary',
            onClick: handleSaveQuote
        });

        block.appendChild(saveBtn);
        block.appendChild(el('div', { id: 'quote-message' }));

    } else if (profileData.quote) {
        // Чужой профиль — просто показываем цитату
        block.appendChild(
            el('div', { className: 'public-quote-text' }, profileData.quote)
        );
    } else {
        // Цитата не задана
        block.appendChild(
            el('p', { className: 'empty-quote' }, 'Цитата не задана')
        );
    }

    return block;
}

/**
 * Сохраняет цитату в Firestore.
 */
async function handleSaveQuote() {
    try {
        const textarea = document.getElementById('quote-textarea');
        if (!textarea) return;

        const quote = textarea.value.trim();

        // Обновляем цитату в Firestore
        await updateDoc(doc(db, 'players', profileUserId), { quote: quote });

        // Обновляем локальные данные
        profileData.quote = quote;

        showMessage('Цитата сохранена!', 'success');

    } catch (error) {
        console.error('Ошибка сохранения цитаты:', error.message);
        showMessage('Ошибка сохранения: ' + error.message, 'error');
    }
}

/* ----- Список персонажей ----- */

/**
 * Загружает и отрисовывает список персонажей пользователя.
 */
async function loadCharacters() {
    try {
        const block = document.getElementById('characters-block');
        if (!block) return;

        const charactersQuery = query(
            collection(db, 'characters'),
            where('uid', '==', profileUserId)
        );

        const querySnapshot = await getDocs(charactersQuery);

        // Очищаем блок (оставляем заголовок)
        while (block.children.length > 1) {
            block.removeChild(block.lastChild);
        }

        if (querySnapshot.empty) {
            block.appendChild(
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

            block.appendChild(charCard);
        });

    } catch (error) {
        console.error('Ошибка загрузки персонажей:', error.message);
        const block = document.getElementById('characters-block');
        if (block) {
            block.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки персонажей')
            );
        }
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
