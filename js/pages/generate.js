/* ==========================================================================
   generate.js — Генератор персонажа DnD
   Случайным образом создаёт персонажа: имя, расу, класс, характеристики.
   Позволяет сохранить персонажа в Firestore.
   ========================================================================== */

import { el, createNavigation, createCard, createButton, createStatBlock, createFooter, showMessage } from '../components.js';
import { initAuth, loadSettings, requireAuth, currentUser } from '../common.js';
import { db } from '../firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ------- Данные для генерации ------- */

const RACES = ['Человек', 'Эльф', 'Дварф', 'Орк', 'Гном', 'Полурослик', 'Тифлинг', 'Драконорождённый'];
const CLASSES = ['Воин', 'Маг', 'Лучник', 'Жрец', 'Плут', 'Друид', 'Паладин', 'Бард', 'Варвар', 'Чародей'];
const NAMES_PREFIXES = ['Ара', 'Бэл', 'Вер', 'Гор', 'Даэ', 'Эль', 'Жан', 'Зор', 'Иль', 'Кай'];
const NAMES_SUFFIXES = ['дорн', 'гус', 'лиан', 'мон', 'нар', 'раэль', 'санд', 'тар', 'уин', 'вир'];

/* ------- Состояние ------- */
let currentGenerated = null; // Последний сгенерированный персонаж

/* ------- Инициализация страницы ------- */
async function initPage() {
    try {
        const app = document.getElementById('app');
        if (!app) throw new Error('Контейнер #app не найден');

        // Загружаем настройки
        await loadSettings();

        // Создаём навигацию
        const nav = createNavigation();
        app.appendChild(nav);

        // Основной контейнер
        const container = el('div', { className: 'page-container' });

        // Заголовок
        container.appendChild(
            el('h1', { className: 'card-title-lg' }, '⚔️ Генератор персонажа')
        );

        // Карточка с персонажем
        const charCard = createCard({ className: 'character-card', id: 'character-card' });
        container.appendChild(charCard);

        app.appendChild(container);

        // Автоматически генерируем персонажа
        generateCharacter();

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки генератора:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ======================================================================
   ГЕНЕРАЦИЯ ПЕРСОНАЖА
   ====================================================================== */

/**
 * Бросает кубик: возвращает случайное число от min до max включительно.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Генерирует случайное имя персонажа.
 * @returns {string}
 */
function generateName() {
    const prefix = NAMES_PREFIXES[randomInt(0, NAMES_PREFIXES.length - 1)];
    const suffix = NAMES_SUFFIXES[randomInt(0, NAMES_SUFFIXES.length - 1)];
    return prefix + suffix;
}

/**
 * Бросает 3d6 для характеристики (значение от 3 до 18).
 * @returns {number}
 */
function rollStat() {
    return randomInt(3, 18);
}

/**
 * Генерирует случайного персонажа и отображает его.
 */
function generateCharacter() {
    try {
        const race = RACES[randomInt(0, RACES.length - 1)];
        const charClass = CLASSES[randomInt(0, CLASSES.length - 1)];
        const name = generateName();

        // Характеристики (6 стандартных DnD-статов)
        const stats = {
            strength: rollStat(),
            dexterity: rollStat(),
            constitution: rollStat(),
            intelligence: rollStat(),
            wisdom: rollStat(),
            charisma: rollStat()
        };

        // Сохраняем сгенерированного персонажа
        currentGenerated = { name, race, class: charClass, stats };

        // Отрисовываем
        renderCharacter(currentGenerated);

    } catch (error) {
        console.error('Ошибка генерации персонажа:', error.message);
        showMessage('Не удалось сгенерировать персонажа: ' + error.message, 'error');
    }
}

/**
 * Отрисовывает карточку персонажа на странице.
 * @param {Object} character — объект персонажа
 */
function renderCharacter(character) {
    const card = document.getElementById('character-card');
    if (!card) return;

    // Очищаем карточку
    card.innerHTML = '';

    // Имя персонажа
    card.appendChild(el('h2', {
        className: 'card-title',
        style: { fontSize: '1.8rem' }
    }, character.name));

    // Раса и класс
    const info = el('p', {
        style: {
            color: '#a78bfa',
            fontSize: '1.2rem',
            marginBottom: '1rem'
        }
    }, character.race + ' — ' + character.class);

    card.appendChild(info);

    // Сетка характеристик
    const statsGrid = el('div', { className: 'stats-grid' });
    const statLabels = {
        strength: 'Сила',
        dexterity: 'Ловкость',
        constitution: 'Телосложение',
        intelligence: 'Интеллект',
        wisdom: 'Мудрость',
        charisma: 'Харизма'
    };

    for (const [key, label] of Object.entries(statLabels)) {
        statsGrid.appendChild(createStatBlock(label, character.stats[key] || 0));
    }

    card.appendChild(statsGrid);

    // Кнопки
    const buttonBlock = el('div', {
        style: {
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem',
            flexWrap: 'wrap'
        }
    });

    // Кнопка "Сгенерировать заново"
    buttonBlock.appendChild(
        createButton('🎲 Сгенерировать заново', {
            onClick: generateCharacter
        })
    );

    // Кнопка "Сохранить"
    buttonBlock.appendChild(
        createButton('💾 Сохранить персонажа', {
            className: 'btn btn-secondary',
            onClick: saveCharacter
        })
    );

    card.appendChild(buttonBlock);

    // Контейнер для сообщений
    card.appendChild(el('div', { id: 'generate-message' }));
}

/* ======================================================================
   СОХРАНЕНИЕ ПЕРСОНАЖА
   ====================================================================== */

/**
 * Сохраняет текущего персонажа в Firestore.
 */
async function saveCharacter() {
    try {
        // Проверка авторизации
        if (!currentUser) {
            showMessage('Войдите в систему, чтобы сохранить персонажа', 'error');
            return;
        }

        if (!currentGenerated) {
            showMessage('Сначала сгенерируйте персонажа', 'error');
            return;
        }

        // Сохраняем в коллекцию characters
        await addDoc(collection(db, 'characters'), {
            uid: currentUser.uid,
            name: currentGenerated.name,
            race: currentGenerated.race,
            class: currentGenerated.class,
            strength: currentGenerated.stats.strength,
            dexterity: currentGenerated.stats.dexterity,
            constitution: currentGenerated.stats.constitution,
            intelligence: currentGenerated.stats.intelligence,
            wisdom: currentGenerated.stats.wisdom,
            charisma: currentGenerated.stats.charisma,
            createdAt: new Date()
        });

        showMessage('Персонаж "' + currentGenerated.name + '" сохранён!', 'success');

    } catch (error) {
        console.error('Ошибка сохранения персонажа:', error.message);
        showMessage('Ошибка сохранения: ' + error.message, 'error');
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
