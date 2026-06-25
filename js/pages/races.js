/* ==========================================================================
   races.js — Список всех рас мира
   Загружает расы из Firestore коллекции 'species', отображает карточки
   с фильтрацией по поколениям.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createButton, createFooter, showMessage, showLoader, hideLoader } from '../components.js';
import { initAuth, loadSettings } from '../common.js';
import { db } from '../firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Состояние ------- */
let allRaces = [];      // Все расы
let allGenerations = []; // Уникальные поколения
let activeFilter = 'all'; // Активный фильтр

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

        // Заголовок
        container.appendChild(
            el('h1', { className: 'card-title-lg' }, '🧬 Расы мира')
        );

        // Контейнер для фильтров
        const filtersContainer = el('div', { id: 'filters-container' });
        container.appendChild(filtersContainer);

        // Контейнер для списка рас
        const racesContainer = el('div', { id: 'races-container' });
        container.appendChild(racesContainer);

        app.appendChild(container);
        app.appendChild(createFooter());

        // Загружаем расы
        await loadRaces(container);

    } catch (error) {
        console.error('Ошибка загрузки страницы рас:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ЗАГРУЗКА РАС
   ====================================================================== */

/**
 * Загружает все расы из Firestore.
 * @param {HTMLElement} container — контейнер страницы
 */
async function loadRaces(container) {
    try {
        const racesContainer = document.getElementById('races-container');
        const filtersContainer = document.getElementById('filters-container');

        if (!racesContainer || !filtersContainer) return;

        const loader = showLoader(racesContainer, 'Загрузка рас...');

        const querySnapshot = await getDocs(collection(db, 'species'));

        if (loader) hideLoader(loader);

        allRaces = [];

        querySnapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            // Берём данные из data.data или из корня документа
            const raceData = data.data || data;
            raceData._docId = doc.id;
            allRaces.push(raceData);
        });

        // Извлекаем уникальные поколения и сортируем
        const genSet = new Set();
        allRaces.forEach(race => {
            if (race.generation !== undefined && race.generation !== null) {
                genSet.add(race.generation);
            }
        });
        allGenerations = Array.from(genSet).sort((a, b) => a - b);

        if (allRaces.length === 0) {
            racesContainer.innerHTML = '';
            racesContainer.appendChild(
                el('p', { className: 'empty-state' }, 'Расы не найдены. Возможно, база данных пуста.')
            );
            return;
        }

        // Создаём фильтры
        filtersContainer.innerHTML = '';
        filtersContainer.appendChild(createFilters());

        // Отрисовываем расы
        renderRaces(racesContainer);

    } catch (error) {
        console.error('Ошибка загрузки рас:', error.message);
        const racesContainer = document.getElementById('races-container');
        if (racesContainer) {
            racesContainer.innerHTML = '';
            racesContainer.appendChild(
                el('p', { className: 'empty-state' }, 'Ошибка загрузки рас: ' + error.message)
            );
        }
    }
}

/* ======================================================================
   ФИЛЬТРЫ ПО ПОКОЛЕНИЯМ
   ====================================================================== */

/**
 * Создаёт кнопки фильтрации по поколениям.
 * @returns {HTMLElement}
 */
function createFilters() {
    const container = el('div', { className: 'filter-buttons' });

    // Кнопка "Все"
    container.appendChild(el('button', {
        className: 'filter-btn active',
        dataset: { generation: 'all' },
        onclick: function () { setFilter('all', container); }
    }, 'Все (' + allRaces.length + ')'));

    // Кнопки для каждого поколения
    allGenerations.forEach(gen => {
        const count = allRaces.filter(r => r.generation === gen).length;
        container.appendChild(el('button', {
            className: 'filter-btn',
            dataset: { generation: String(gen) },
            onclick: function () { setFilter(gen, container); }
        }, gen + '-е поколение (' + count + ')'));
    });

    return container;
}

/**
 * Устанавливает активный фильтр.
 * @param {string|number} generation — поколение или 'all'
 * @param {HTMLElement} filterContainer — контейнер кнопок фильтрации
 */
function setFilter(generation, filterContainer) {
    activeFilter = generation;

    // Обновляем активный класс кнопок
    const buttons = filterContainer.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (String(btn.dataset.generation) === String(generation)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Перерисовываем список рас
    const racesContainer = document.getElementById('races-container');
    if (racesContainer) {
        renderRaces(racesContainer);
    }
}

/* ======================================================================
   ОТРИСОВКА СПИСКА РАС
   ====================================================================== */

/**
 * Отрисовывает карточки рас с учётом активного фильтра.
 * @param {HTMLElement} container
 */
function renderRaces(container) {
    container.innerHTML = '';

    let filteredRaces = allRaces;

    // Применяем фильтр по поколению
    if (activeFilter !== 'all') {
        filteredRaces = allRaces.filter(race => race.generation === Number(activeFilter));
    }

    if (filteredRaces.length === 0) {
        container.appendChild(
            el('p', { className: 'empty-state' }, 'Нет рас в этом поколении')
        );
        return;
    }

    // Статистика
    container.appendChild(
        el('p', {
            style: {
                color: '#8b5cf6',
                marginBottom: '1rem',
                fontSize: '0.95rem'
            }
        }, 'Показано рас: ' + filteredRaces.length + ' из ' + allRaces.length +
           ' | Поколений: ' + allGenerations.join(', '))
    );

    // Сетка с карточками
    const grid = el('div', { className: 'grid' });

    filteredRaces.forEach(race => {
        const raceName = race.name || 'Без названия';
        const raceId = race.id || race._docId || raceName;

        // Slug для URL (если нет id)
        const urlId = race.id || race._docId || raceName.toLowerCase().replace(/\s+/g, '-');

        // Краткое описание (первые 150 символов)
        const desc = race.shortDescription || race.краткое_описание || race.description || '';
        const shortDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;

        // Поколение
        const genText = race.generation !== undefined
            ? race.generation + '-е поколение'
            : '';

        grid.appendChild(
            createGameCard({
                title: raceName,
                subtitle: genText,
                description: shortDesc,
                onClick: () => {
                    window.location.href = './race.html?id=' + encodeURIComponent(urlId);
                }
            })
        );
    });

    container.appendChild(grid);
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
