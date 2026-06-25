/* ==========================================================================
   race.js — Страница одной расы
   Загружается по ?id= из параметров URL. Ищет расу в Firestore коллекции
   'species' по ID документа, полю id, или slug-версии названия.
   ========================================================================== */

import { el, createNavigation, createCard, createTag, createTagList, createButton, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings } from '../common.js';
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

        app.appendChild(container);

        // Получаем ID расы из URL
        const urlParams = new URLSearchParams(window.location.search);
        const raceId = urlParams.get('id');

        if (!raceId) {
            container.appendChild(
                createCard({},
                    el('h2', { className: 'card-title' }, 'Раса не указана'),
                    el('p', { className: 'empty-state' }, 'Укажите ID расы в параметре ?id='),
                    el('div', { style: { textAlign: 'center', marginTop: '1rem' } },
                        createButton('← К списку рас', { onClick: () => { window.location.href = './races.html'; } })
                    )
                )
            );
            app.appendChild(createFooter());
            return;
        }

        // Загружаем и отображаем расу
        await loadRace(raceId, container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки страницы расы:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ЗАГРУЗКА И ПОИСК РАСЫ
   ====================================================================== */

/**
 * Загружает расу из Firestore по ID.
 * Поиск осуществляется по: doc ID, полю data.id, или slug-версии названия.
 * @param {string} raceId — ID для поиска
 * @param {HTMLElement} container — контейнер для контента
 */
async function loadRace(raceId, container) {
    const loader = showLoader(container, 'Загрузка информации о расе...');

    try {
        // Получаем все документы из коллекции species
        const querySnapshot = await getDocs(collection(db, 'species'));

        if (loader) hideLoader(loader);

        // Ищем расу: по ID документа, полю id или slug-версии названия
        const searchId = raceId.toLowerCase().replace(/\s+/g, '-');
        let raceData = null;

        querySnapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };

            // Поиск по ID документа
            if (doc.id === raceId) {
                raceData = data;
                return;
            }

            // Поиск по полю id
            if (data.data && data.data.id === raceId) {
                raceData = data;
                return;
            }

            // Поиск по slug-версии названия
            if (data.name) {
                const nameSlug = data.name.toLowerCase().replace(/\s+/g, '-');
                if (nameSlug === searchId) {
                    raceData = data;
                    return;
                }
            }

            // Поиск по _id (если есть)
            if (data._id === raceId) {
                raceData = data;
                return;
            }
        });

        if (!raceData) {
            container.appendChild(
                createCard({},
                    el('h2', { className: 'card-title' }, 'Раса не найдена'),
                    el('p', { className: 'empty-state' }, 'Раса с ID "' + raceId + '" не найдена в базе данных'),
                    el('div', { style: { textAlign: 'center', marginTop: '1rem' } },
                        createButton('← К списку рас', { onClick: () => { window.location.href = './races.html'; } })
                    )
                )
            );
            return;
        }

        // Отрисовываем расу
        renderRace(raceData, container);

    } catch (error) {
        if (loader) hideLoader(loader);
        console.error('Ошибка загрузки расы:', error.message);
        showMessage('Ошибка загрузки данных о расе: ' + error.message, 'error');
    }
}

/* ======================================================================
   ОТРИСОВКА РАСЫ
   ====================================================================== */

/**
 * Отрисовывает детальную карточку расы.
 * @param {Object} race — данные расы из Firestore
 * @param {HTMLElement} container
 */
function renderRace(race, container) {
    // Ссылка "Назад"
    container.appendChild(
        el('a', {
            href: './races.html',
            style: {
                color: '#a78bfa',
                textDecoration: 'none',
                fontSize: '1rem',
                display: 'inline-block',
                marginBottom: '1rem'
            }
        }, '← К списку рас')
    );

    // Основная карточка
    const card = createCard({ className: 'race-detail-card' });

    // Название расы
    card.appendChild(
        el('h1', { className: 'card-title-lg' }, race.name || 'Без названия')
    );

    // Поколение
    if (race.generation !== undefined && race.generation !== null) {
        card.appendChild(
            el('p', {
                style: {
                    color: '#8b5cf6',
                    fontWeight: '600',
                    marginBottom: '1rem'
                }
            }, 'Поколение: ' + race.generation)
        );
    }

    // Описание
    if (race.description) {
        card.appendChild(
            el('p', {
                style: {
                    color: '#d4e0ff',
                    lineHeight: '1.7',
                    fontSize: '1.05rem',
                    marginBottom: '1rem'
                }
            }, race.description)
        );
    }

    // Характеристики (strengths, weaknesses, traits)
    // Нормализуем: поддерживаем как массивы, так и строки через запятую
    const strengths = normalizeArrayField(race.strengths || race.сильные_стороны);
    const weaknesses = normalizeArrayField(race.weaknesses || race.слабые_стороны);
    const traits = normalizeArrayField(race.traits || race.черты);
    const uniqueness = race.uniqueness || race.уникальность;

    // Черты (теги)
    if (traits.length > 0) {
        card.appendChild(el('h3', { className: 'card-title', style: { marginTop: '1.5rem' } }, 'Черты'));
        card.appendChild(createTagList(traits));
    }

    // Сильные стороны
    if (strengths.length > 0) {
        card.appendChild(el('h3', { className: 'card-title', style: { marginTop: '1.5rem' } }, 'Сильные стороны'));
        card.appendChild(createTagList(strengths));
    }

    // Слабые стороны
    if (weaknesses.length > 0) {
        card.appendChild(el('h3', { className: 'card-title', style: { marginTop: '1.5rem' } }, 'Слабые стороны'));
        card.appendChild(createTagList(weaknesses));
    }

    // Уникальность
    if (uniqueness) {
        card.appendChild(el('h3', { className: 'card-title', style: { marginTop: '1.5rem' } }, 'Уникальность'));
        card.appendChild(el('p', { style: { color: '#a78bfa', lineHeight: '1.6' } }, uniqueness));
    }

    // Таблица с источниками (source)
    if (race.source || race.источники) {
        const source = race.source || race.источники;
        card.appendChild(el('h3', { className: 'card-title', style: { marginTop: '1.5rem' } }, 'Источники силы'));

        const table = el('table', { className: 'admin-table', style: { marginTop: '0.5rem' } });
        const thead = el('thead');
        thead.appendChild(el('tr', {},
            el('th', {}, 'Источник'),
            el('th', {}, 'Процент')
        ));
        table.appendChild(thead);

        const tbody = el('tbody');

        if (typeof source === 'object' && !Array.isArray(source)) {
            // source — объект вида { "Магия": 40, "Жизнь": 30 }
            for (const [key, value] of Object.entries(source)) {
                tbody.appendChild(el('tr', {},
                    el('td', {}, key),
                    el('td', {}, String(value) + '%')
                ));
            }
        } else if (Array.isArray(source)) {
            source.forEach(item => {
                if (typeof item === 'object') {
                    const entries = Object.entries(item);
                    if (entries.length >= 2) {
                        tbody.appendChild(el('tr', {},
                            el('td', {}, String(entries[0][1] || entries[0][0])),
                            el('td', {}, String(entries[1][1] || entries[1][0]) + '%')
                        ));
                    }
                }
            });
        }

        table.appendChild(tbody);
        card.appendChild(table);
    }

    container.appendChild(card);
}

/**
 * Нормализует поля: преобразует строки с запятыми в массивы.
 * @param {string|Array} field — поле для нормализации
 * @returns {Array}
 */
function normalizeArrayField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
        return field.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
