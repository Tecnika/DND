/* ==========================================================================
   lore.js — Страница лора мира
   Содержит ссылки на различные разделы лора: расы, классы, историю мира.
   ========================================================================== */

import { el, createNavigation, createCard, createGameCard, createFooter, showMessage } from '../components.js';
import { initAuth, loadSettings } from '../common.js';

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
            el('h1', { className: 'card-title-lg' }, '📜 Лор мира')
        );

        // Описание
        container.appendChild(
            el('p', {
                style: {
                    color: '#a78bfa',
                    fontSize: '1.1rem',
                    marginBottom: '1.5rem',
                    lineHeight: '1.6'
                }
            }, 'Мир "Ста Рас" — это огромная вселенная, где переплетаются судьбы ' +
               'восьми первостихий. Изучите историю, расы и тайны этого мира.')
        );

        // Сетка разделов
        const grid = el('div', { className: 'grid' });

        // Расы
        grid.appendChild(createGameCard({
            title: '🧬 Расы',
            description: 'Изучи все расы мира Ста Рас: от людей до древних духов стихий.',
            onClick: () => { window.location.href = './races.html'; }
        }));

        // Классы (заглушка)
        grid.appendChild(createGameCard({
            title: '⚔️ Классы',
            description: 'Раздел находится в разработке. Здесь будут описания всех игровых классов.'
        }));

        // История (заглушка)
        grid.appendChild(createGameCard({
            title: '📖 История мира',
            description: 'Раздел находится в разработке. Летопись событий мира Ста Рас.'
        }));

        container.appendChild(grid);
        app.appendChild(container);

        // Подвал
        app.appendChild(createFooter());

    } catch (error) {
        console.error('Ошибка загрузки страницы лора:', error.message);
        showMessage('Не удалось загрузить страницу: ' + error.message, 'error');
    }
}

/* ------- Запуск страницы ------- */
initAuth(() => {
    initPage();
});
