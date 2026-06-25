/* ==========================================================================
   admin.js — Панель администратора
   Управление пользователями (роли, удаление) и новостями (создание, удаление).
   Доступна только пользователям с ролью 'admin'.
   ========================================================================== */

import { el, createNavigation, createCard, createButton, createInput, createTextarea, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings, getAvatarUrl, getRoleName, isAdmin, currentUser } from '../common.js';
import { db } from '../firebase-config.js';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, setDoc, onSnapshot, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Состояние страницы ------- */
let allUsers = []; // Кеш всех пользователей
let currentAdminTab = 'users'; // 'users' или 'news'

/* ------- Инициализация страницы ------- */
async function initPage() {
    try {
        const app = document.getElementById('app');
        if (!app) throw new Error('Контейнер #app не найден');

        // Загружаем настройки
        await loadSettings();

        // Проверка прав администратора
        const admin = await isAdmin();
        if (!admin) {
            showMessage('Доступ запрещён. Только администраторы могут просматривать эту страницу.', 'error');
            setTimeout(() => { window.location.href = './index.html'; }, 2000);
            return;
        }

        // Навигация
        const nav = createNavigation();
        app.appendChild(nav);

        // Основной контейнер
        const container = el('div', { className: 'page-container' });

        // Заголовок
        container.appendChild(
            el('h1', { className: 'card-title-lg' }, '👑 Админ панель')
        );

        // Вкладки
        container.appendChild(createAdminTabs());

        // Панели
        container.appendChild(createUsersPanel());
        container.appendChild(createNewsPanel());

        app.appendChild(container);
        app.appendChild(createFooter());

        // Загружаем данные
        loadUsers();
        loadNews();

    } catch (error) {
        console.error('Ошибка загрузки админ панели:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ВКЛАДКИ
   ====================================================================== */

function createAdminTabs() {
    const tabsContainer = el('div', { className: 'admin-tabs' });

    tabsContainer.appendChild(el('button', {
        className: 'tab-btn active',
        id: 'tab-users',
        onclick: () => switchAdminTab('users')
    }, 'Пользователи'));

    tabsContainer.appendChild(el('button', {
        className: 'tab-btn',
        id: 'tab-news',
        onclick: () => switchAdminTab('news')
    }, 'Новости'));

    return tabsContainer;
}

/**
 * Переключает между вкладками админ панели.
 * @param {string} tab — 'users' или 'news'
 */
function switchAdminTab(tab) {
    currentAdminTab = tab;

    const tabUsers = document.getElementById('tab-users');
    const tabNews = document.getElementById('tab-news');
    const panelUsers = document.getElementById('panel-users');
    const panelNews = document.getElementById('panel-news');

    if (!tabUsers || !tabNews || !panelUsers || !panelNews) return;

    if (tab === 'users') {
        tabUsers.classList.add('active');
        tabNews.classList.remove('active');
        panelUsers.classList.add('active');
        panelNews.classList.remove('active');
    } else {
        tabNews.classList.add('active');
        tabUsers.classList.remove('active');
        panelNews.classList.add('active');
        panelUsers.classList.remove('active');
    }
}

/* ======================================================================
   ПАНЕЛЬ ПОЛЬЗОВАТЕЛЕЙ
   ====================================================================== */

function createUsersPanel() {
    const panel = el('div', { className: 'admin-panel active', id: 'panel-users' });

    const card = createCard({},
        el('h2', { className: 'card-title' }, 'Список пользователей'),
        el('div', { id: 'users-table-container' },
            el('p', { className: 'empty-state' }, 'Загрузка пользователей...')
        )
    );

    panel.appendChild(card);
    return panel;
}

/**
 * Загружает всех пользователей из Firestore и отрисовывает таблицу.
 */
async function loadUsers() {
    try {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        const querySnapshot = await getDocs(collection(db, 'players'));

        allUsers = [];
        querySnapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });

        renderUsers(container);

    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error.message);
        const container = document.getElementById('users-table-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки пользователей: ' + error.message)
            );
        }
    }
}

/**
 * Отрисовывает таблицу пользователей.
 * @param {HTMLElement} container
 */
function renderUsers(container) {
    container.innerHTML = '';

    if (allUsers.length === 0) {
        container.appendChild(el('p', { className: 'empty-state' }, 'Пользователи не найдены'));
        return;
    }

    const table = el('table', { className: 'admin-table' });

    // Заголовок таблицы
    const thead = el('thead');
    thead.appendChild(el('tr', {},
        el('th', {}, 'Аватар'),
        el('th', {}, 'Имя'),
        el('th', {}, 'Email'),
        el('th', {}, 'Роль'),
        el('th', {}, 'Действия')
    ));
    table.appendChild(thead);

    // Тело таблицы
    const tbody = el('tbody');
    allUsers.forEach(user => {
        const avatarUrl = getAvatarUrl(user.username, 32);
        const roleName = getRoleName(user.role);

        const tr = el('tr', { id: 'user-row-' + user.id });

        // Аватар
        tr.appendChild(el('td', {},
            el('img', {
                className: 'admin-avatar',
                src: avatarUrl,
                alt: 'Аватар',
                onerror: function () { this.style.display = 'none'; }
            })
        ));

        // Имя пользователя
        tr.appendChild(el('td', {}, user.username || 'Без имени'));

        // Email
        tr.appendChild(el('td', {}, user.email || '—'));

        // Селект роли
        const roleSelect = el('select', {
            className: 'role-select',
            dataset: { userId: user.id },
            onchange: function () { handleRoleChange(this); }
        },
            el('option', { value: 'player', selected: user.role === 'player' ? 'selected' : null }, 'Игрок'),
            el('option', { value: 'master', selected: user.role === 'master' ? 'selected' : null }, 'Мастер'),
            el('option', { value: 'admin', selected: user.role === 'admin' ? 'selected' : null }, 'Админ')
        );

        tr.appendChild(el('td', {}, roleSelect));

        // Действия (удаление)
        tr.appendChild(el('td', {},
            createButton('Удалить', {
                className: 'btn-danger-small',
                onClick: () => handleDeleteUser(user.id, user.username)
            })
        ));

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    // Информация о количестве пользователей
    container.appendChild(
        el('p', { style: { color: '#6b7280', marginTop: '1rem', fontSize: '0.9rem' } },
            'Всего пользователей: ' + allUsers.length
        )
    );
}

/**
 * Обработчик изменения роли пользователя.
 * @param {HTMLElement} selectElement — элемент select
 */
async function handleRoleChange(selectElement) {
    try {
        const userId = selectElement.dataset.userId;
        const newRole = selectElement.value;

        // Нельзя изменить роль самому себе
        if (userId === currentUser?.uid) {
            showMessage('Вы не можете изменить свою собственную роль', 'error');
            // Возвращаем старое значение
            loadUsers();
            return;
        }

        // Подтверждение действия
        const roleName = getRoleName(newRole);
        const confirmChange = confirm('Изменить роль пользователя на "' + roleName + '"?');

        if (!confirmChange) {
            // Отмена — перезагружаем таблицу
            loadUsers();
            return;
        }

        // Обновляем роль в Firestore
        await updateDoc(doc(db, 'players', userId), { role: newRole });

        showMessage('Роль пользователя изменена на "' + roleName + '"', 'success');

    } catch (error) {
        console.error('Ошибка изменения роли:', error.message);
        showMessage('Ошибка изменения роли: ' + error.message, 'error');
        loadUsers();
    }
}

/**
 * Обработчик удаления пользователя.
 * @param {string} userId — ID пользователя
 * @param {string} username — имя пользователя
 */
async function handleDeleteUser(userId, username) {
    try {
        // Нельзя удалить самого себя
        if (userId === currentUser?.uid) {
            showMessage('Вы не можете удалить свой собственный аккаунт', 'error');
            return;
        }

        const confirmDelete = confirm('Вы уверены, что хотите удалить пользователя "' + username + '"? Это действие нельзя отменить.');

        if (!confirmDelete) return;

        // Удаляем документ пользователя из Firestore
        await deleteDoc(doc(db, 'players', userId));

        showMessage('Пользователь "' + username + '" удалён', 'success');

        // Обновляем таблицу
        loadUsers();

    } catch (error) {
        console.error('Ошибка удаления пользователя:', error.message);
        showMessage('Ошибка удаления пользователя: ' + error.message, 'error');
    }
}

/* ======================================================================
   ПАНЕЛЬ НОВОСТЕЙ
   ====================================================================== */

function createNewsPanel() {
    const panel = el('div', { className: 'admin-panel', id: 'panel-news' });

    // Форма создания новости
    const createCard_ = createCard({},
        el('h2', { className: 'card-title' }, 'Создать новость'),

        el('div', { className: 'form-group' },
            el('label', { className: 'form-label', for: 'news-title' }, 'Заголовок новости'),
            el('input', { className: 'form-input', type: 'text', id: 'news-title', placeholder: 'Введите заголовок' })
        ),

        el('div', { className: 'form-group' },
            el('label', { className: 'form-label', for: 'news-text' }, 'Текст новости'),
            el('textarea', { className: 'form-textarea', id: 'news-text', placeholder: 'Введите текст новости' })
        ),

        createButton('Опубликовать', {
            className: 'btn',
            onClick: handlePublishNews
        }),

        el('div', { id: 'news-publish-message' })
    );

    panel.appendChild(createCard_);

    // Список существующих новостей
    const listCard = createCard({},
        el('h2', { className: 'card-title' }, 'Существующие новости'),
        el('div', { id: 'news-list-container' },
            el('p', { className: 'empty-state' }, 'Загрузка новостей...')
        )
    );

    panel.appendChild(listCard);

    return panel;
}

/**
 * Обработчик публикации новой новости.
 */
async function handlePublishNews() {
    try {
        const titleInput = document.getElementById('news-title');
        const textInput = document.getElementById('news-text');

        if (!titleInput || !textInput) return;

        const title = titleInput.value.trim();
        const text = textInput.value.trim();

        // Проверка заполнения полей
        if (!title) {
            showMessage('Введите заголовок новости', 'error');
            return;
        }

        if (!text) {
            showMessage('Введите текст новости', 'error');
            return;
        }

        // Создаём документ в коллекции news
        await addDoc(collection(db, 'news'), {
            title: title,
            text: text,
            authorId: currentUser?.uid || 'unknown',
            createdAt: serverTimestamp()
        });

        // Очищаем поля формы
        titleInput.value = '';
        textInput.value = '';

        showMessage('Новость опубликована!', 'success');

    } catch (error) {
        console.error('Ошибка публикации новости:', error.message);
        showMessage('Ошибка публикации: ' + error.message, 'error');
    }
}

/**
 * Загружает и отрисовывает список существующих новостей.
 */
async function loadNews() {
    try {
        const container = document.getElementById('news-list-container');
        if (!container) return;

        const newsQuery = query(
            collection(db, 'news'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(newsQuery);

        container.innerHTML = '';

        if (querySnapshot.empty) {
            container.appendChild(el('p', { className: 'empty-state' }, 'Новостей пока нет'));
            return;
        }

        querySnapshot.forEach(docItem => {
            const news = docItem.data();
            const newsId = docItem.id;

            const newsCard = el('div', {
                className: 'news-card',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                }
            });

            // Текст новости (слева)
            const textBlock = el('div', { style: { flex: 1 } },
                el('div', { className: 'news-title' }, news.title || 'Без названия'),
                el('p', { style: { color: '#a78bfa', fontSize: '0.9rem', marginTop: '0.5rem' } },
                    (news.text || '').substring(0, 100) + ((news.text || '').length > 100 ? '...' : '')
                )
            );

            newsCard.appendChild(textBlock);

            // Кнопка удаления (справа)
            newsCard.appendChild(
                createButton('Удалить', {
                    className: 'btn-danger-small',
                    onClick: () => handleDeleteNews(newsId, news.title)
                })
            );

            container.appendChild(newsCard);
        });

    } catch (error) {
        console.error('Ошибка загрузки новостей:', error.message);
        const container = document.getElementById('news-list-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки новостей')
            );
        }
    }
}

/**
 * Удаляет новость.
 * @param {string} newsId — ID новости
 * @param {string} newsTitle — заголовок новости
 */
async function handleDeleteNews(newsId, newsTitle) {
    try {
        const confirmDelete = confirm('Удалить новость "' + (newsTitle || 'Без названия') + '"?');

        if (!confirmDelete) return;

        await deleteDoc(doc(db, 'news', newsId));

        showMessage('Новость удалена', 'success');

        // Обновляем список
        loadNews();

    } catch (error) {
        console.error('Ошибка удаления новости:', error.message);
        showMessage('Ошибка удаления: ' + error.message, 'error');
    }
}

/* ------- Запуск страницы ------- */
initAuth(() => {
    initPage();
});
