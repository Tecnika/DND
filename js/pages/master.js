/* ==========================================================================
   master.js — Страница мастерской
   Раздел для Dungeon Masters, где они могут управлять игровыми сессиями.
   В настоящее время находится в разработке.
   ========================================================================== */

import { el, createNavigation, createCard, createFooter, showMessage } from '../components.js';
import { initAuth, loadSettings, isMasterOrAdmin, currentUserRole } from '../common.js';

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
            el('h1', { className: 'card-title-lg' }, '🎲 Мастерская')
        );

        // Карточка с информацией о статусе
        const card = createCard({ className: 'master-card' },
            el('h2', { className: 'card-title' }, 'Раздел в разработке'),

            el('p', {
                style: {
                    color: '#a78bfa',
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    marginTop: '1rem'
                }
            }, 'Мастерская — это место, где Dungeon Masters могут создавать и ' +
               'управлять игровыми сессиями, создавать NPC, локации и квесты. ' +
               'Следите за обновлениями!'),

            el('div', {
                className: 'empty-state',
                style: { marginTop: '1rem' }
            }, '🔨 Раздел активно разрабатывается')
        );

        container.appendChild(card);

        app.appendChild(container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки мастерской:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ------- Запуск страницы ------- */
initAuth(async () => {
    await initPage();
});
