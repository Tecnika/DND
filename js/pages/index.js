/* ==========================================================================
   index.js — Главная страница DnD Картакар
   Отображает: приветствие, ссылки на разделы, ленту новостей.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings, formatDate } from '../common.js';
import { db } from '../firebase-config.js';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Инициализация страницы ------- */
async function initPage() {
    try {
        const app = document.getElementById('app');
        if (!app) throw new Error('Контейнер #app не найден на странице');

        // Загружаем настройки приложения
        await loadSettings();

        // Создаём навигацию и добавляем в начало страницы
        const nav = createNavigation();
        app.appendChild(nav);

        // Создаём основной контейнер с контентом
        const container = el('div', { className: 'page-container' });

        // Приветственный блок
        container.appendChild(createWelcomeCard());

        // Блок с новостями
        const newsSection = await createNewsSection();
        if (newsSection) container.appendChild(newsSection);

        app.appendChild(container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки главной страницы:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ПРИВЕТСТВЕННАЯ КАРТОЧКА С РАЗДЕЛАМИ
   ====================================================================== */

/**
 * Создаёт карточку с приветствием и ссылками на основные разделы.
 * @returns {HTMLElement}
 */
function createWelcomeCard() {
    return createCard({ className: 'welcome-card' },
        // Заголовок
        el('h1', { className: 'card-title-lg' }, 'Добро пожаловать в DnD Картакар!'),

        // Описание
        el('p', {
            style: {
                color: '#a78bfa',
                fontSize: '1.1rem',
                marginBottom: '1.5rem',
                lineHeight: '1.6'
            }
        }, 'Мир, где магия переплетается с реальностью, а древние расы хранят ' +
           'тайны тысячелетий. Исследуй лор, создавай персонажей и находи ' +
           'единомышленников.'),

        // Сетка разделов
        el('div', { className: 'grid' },
            // Карточка "Лор"
            createGameCard({
                title: '📜 Лор мира',
                description: 'Погрузись в историю и мифологию мира Ста Рас.',
                onClick: () => { window.location.href = './lore.html'; }
            }),

            // Карточка "Расы"
            createGameCard({
                title: '🧬 Расы',
                description: 'Изучи все расы мира: от людей до древних духов.',
                onClick: () => { window.location.href = './races.html'; }
            }),

            // Карточка "Генератор"
            createGameCard({
                title: '⚔️ Генератор персонажа',
                description: 'Создай уникального персонажа для своей игры.',
                onClick: () => { window.location.href = './generate.html'; }
            }),

            // Карточка "Сообщество"
            createGameCard({
                title: '👥 Сообщество',
                description: 'Найди других игроков и мастеров.',
                onClick: () => { window.location.href = './user-list.html'; }
            })
        )
    );
}

/* ======================================================================
   НОВОСТИ
   ====================================================================== */

/**
 * Создаёт секцию новостей, загружая данные из Firestore.
 * @returns {Promise<HTMLElement|null>}
 */
async function createNewsSection() {
    try {
        const section = createCard({ className: 'news-section' },
            el('h2', { className: 'card-title' }, '📰 Последние новости')
        );

        // Контейнер для списка новостей
        const newsList = el('div', { id: 'news-container' });
        section.appendChild(newsList);

        // Загружаем новости через лайв-слушатель
        try {
            const newsQuery = query(
                collection(db, 'news'),
                orderBy('createdAt', 'desc')
            );

            // Подписываемся на изменения в реальном времени
            onSnapshot(newsQuery, (snapshot) => {
                try {
                    renderNews(snapshot, newsList);
                } catch (error) {
                    console.error('Ошибка отрисовки новостей:', error.message);
                    newsList.innerHTML = '';
                    newsList.appendChild(
                        el('p', { className: 'empty-state' }, 'Ошибка загрузки новостей')
                    );
                }
            }, (error) => {
                // Ошибка подписки на Firestore
                console.error('Ошибка загрузки новостей из Firestore:', error.message);
                newsList.innerHTML = '';
                newsList.appendChild(
                    el('p', { className: 'empty-state' }, 'Новости временно недоступны')
                );
            });

        } catch (error) {
            console.error('Ошибка создания запроса новостей:', error.message);
            newsList.appendChild(
                el('p', { className: 'empty-state' }, 'Не удалось загрузить новости')
            );
        }

        return section;

    } catch (error) {
        console.error('Ошибка создания секции новостей:', error.message);
        return null;
    }
}

/**
 * Отрисовывает список новостей из данных Firestore.
 * @param {Object} snapshot — снимок данных Firestore
 * @param {HTMLElement} container — контейнер для новостей
 */
function renderNews(snapshot, container) {
    // Очищаем контейнер
    container.innerHTML = '';

    if (snapshot.empty) {
        container.appendChild(
            el('p', { className: 'empty-state' }, 'Новостей пока нет')
        );
        return;
    }

    // Флаг для отслеживания первой загрузки
    let itemsProcessed = 0;

    snapshot.forEach(doc => {
        const news = doc.data();
        const newsId = doc.id;

        // Создаём карточку новости
        const card = el('div', { className: 'news-card', id: 'news-' + newsId });

        // Заголовок новости
        card.appendChild(el('div', { className: 'news-title' }, news.title || 'Без названия'));

        // Мета-информация (автор, дата)
        const meta = el('div', { className: 'news-meta' });

        // Добавляем автора
        if (news.authorId) {
            const authorLink = el('a', {
                href: './profile-page.html?id=' + encodeURIComponent(news.authorId)
            }, 'Загрузка автора...');

            // Загружаем имя автора из Firestore
            getDoc(doc(db, 'players', news.authorId)).then(authorDoc => {
                if (authorDoc.exists()) {
                    authorLink.innerText = authorDoc.data().username || 'Неизвестный';
                } else {
                    authorLink.innerText = 'Неизвестный';
                }
            }).catch(err => {
                console.error('Ошибка загрузки автора:', err.message);
                authorLink.innerText = 'Неизвестный';
            });

            meta.appendChild(el('span', {}, 'Автор: '));
            meta.appendChild(authorLink);
            meta.appendChild(el('span', {}, ' • '));
        }

        // Дата создания (может быть Timestamp, Date или строка)
        let dateValue = 'Дата неизвестна';
        if (news.createdAt) {
            try {
                if (typeof news.createdAt.toDate === 'function') {
                    dateValue = formatDate(news.createdAt.toDate());
                } else if (news.createdAt instanceof Date) {
                    dateValue = formatDate(news.createdAt);
                } else if (typeof news.createdAt === 'string' || typeof news.createdAt === 'number') {
                    dateValue = formatDate(news.createdAt);
                }
            } catch (e) {
                dateValue = 'Дата неизвестна';
            }
        }
        meta.appendChild(el('span', {}, dateValue));

        card.appendChild(meta);

        // Краткий текст (обрезаем до 200 символов)
        const fullText = typeof news.text === 'string' ? news.text : '';
        const shortText = fullText.length > 200
            ? fullText.substring(0, 200) + '...'
            : fullText;

        const shortDiv = el('div', { className: 'news-short' }, shortText);
        card.appendChild(shortDiv);

        // Полный текст (скрыт по умолчанию)
        if (fullText.length > 200) {
            const fullDiv = el('div', { className: 'news-full' }, fullText);
            card.appendChild(fullDiv);

            // Кнопка "Читать дальше"
            const readMoreBtn = el('button', {
                className: 'read-more-btn',
                onclick: function () {
                    card.classList.toggle('expanded');
                    this.textContent = card.classList.contains('expanded')
                        ? 'Свернуть'
                        : 'Читать дальше';
                }
            }, 'Читать дальше');

            card.appendChild(readMoreBtn);
        }

        container.appendChild(card);
        itemsProcessed++;
    });

    // Если новостей не пришло (пустой результат после фильтрации)
    if (itemsProcessed === 0) {
        container.appendChild(
            el('p', { className: 'empty-state' }, 'Новостей пока нет')
        );
    }
}

/* ------- Запуск страницы ------- */

// Инициализируем аутентификацию, затем загружаем страницу
initAuth(async () => {
    await initPage();
});
