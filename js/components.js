/* ==========================================================================
   components.js — Переиспользуемые компоненты интерфейса
   Все DOM-элементы создаются через document.createElement().
   Никакого innerHTML — только программное создание узлов.
   ========================================================================== */

import {
    currentUser, currentUserRole, currentUsername, appSettings,
    getAvatarUrl, getRoleName, getRoleIcon, logout, isMasterOrAdmin
} from './common.js';

/* ======================================================================
   ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ ЭЛЕМЕНТОВ
   Упрощает создание DOM-узлов с атрибутами и дочерними элементами.
   
   Пример:
     el('div', { className: 'card' },
       el('h2', {}, 'Заголовок'),
       el('p', {}, 'Текст')
     )
   ====================================================================== */

/**
 * Создаёт DOM-элемент с заданными атрибутами и содержимым.
 * @param {string} tag — HTML-тег (например, 'div', 'span', 'button')
 * @param {Object} attrs — атрибуты элемента (className, id, style, onclick и т.д.)
 * @param {...(string|Node|Array)} children — дочерние узлы или текст
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
    // Проверка входных данных
    if (!tag || typeof tag !== 'string') {
        throw new Error('el(): тег должен быть непустой строкой');
    }

    const element = document.createElement(tag);

    // Установка атрибутов
    for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue; // пропускаем null/false

        if (key.startsWith('on') && typeof value === 'function') {
            // Обработчики событий: onClick, onSubmit и т.д.
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else if (key === 'innerText') {
            element.textContent = value;
        } else {
            element.setAttribute(key, String(value));
        }
    }

    // Добавление дочерних элементов
    appendChildren(element, children);

    return element;
}

/**
 * Рекурсивно добавляет дочерние элементы к родителю.
 * @param {HTMLElement} parent — родительский элемент
 * @param {Array} children — массив дочерних узлов
 */
function appendChildren(parent, children) {
    for (const child of children) {
        if (child == null || child === false || child === undefined) continue;

        if (Array.isArray(child)) {
            // Рекурсивная обработка вложенных массивов
            appendChildren(parent, child);
        } else if (child instanceof Node) {
            parent.appendChild(child);
        } else if (typeof child === 'string' || typeof child === 'number') {
            parent.appendChild(document.createTextNode(String(child)));
        } else if (child && child.nodeType) {
            parent.appendChild(child);
        } else {
            // Попытка преобразовать в строку
            parent.appendChild(document.createTextNode(String(child)));
        }
    }
}

/* ======================================================================
   НАВИГАЦИЯ
   ====================================================================== */

/**
 * Создаёт и возвращает элемент навигации.
 * Навигация строится динамически с учётом статуса авторизации.
 * @returns {HTMLElement} — элемент <nav>
 */
export function createNavigation() {
    const nav = el('nav', { className: 'navbar', id: 'main-nav' });

    const container = el('div', { className: 'nav-container' },
        // Логотип
        el('a', { className: 'logo', href: './index.html' }, 'DnD Картакар'),

        // Ссылки навигации
        el('div', { className: 'nav-links' },
            el('a', { href: './index.html' }, 'Главная'),
            el('a', { href: './lore.html' }, 'Лор'),
            el('a', { href: './races.html' }, 'Расы'),
            el('a', { href: './generate.html' }, 'Генератор'),
            el('a', { href: './user-list.html' }, 'Сообщество'),

            // Блок для неавторизованных пользователей
            createAuthLinks(),

            // Блок для авторизованных пользователей (скрыт по умолчанию)
            createUserNavBlock()
        )
    );

    nav.appendChild(container);
    return nav;
}

/**
 * Создаёт ссылки для неавторизованных пользователей (вход/регистрация).
 * @returns {HTMLElement}
 */
function createAuthLinks() {
    const block = el('span', { id: 'auth-links-block', style: { display: 'none' } },
        el('a', { href: './auth.html' }, 'Войти')
    );
    return block;
}

/**
 * Создаёт блок авторизованного пользователя (аватар, имя, ссылки, выход).
 * @returns {HTMLElement}
 */
function createUserNavBlock() {
    const block = el('span', { id: 'user-nav-block', style: { display: 'none' } });

    // Этот блок будет обновляться динамически через updateNavigationUI
    return block;
}

/**
 * Обновляет состояние навигации в зависимости от авторизации.
 * Вызывается при каждом изменении статуса входа.
 */
export function updateNavigationUI() {
    const authLinksBlock = document.getElementById('auth-links-block');
    const userNavBlock = document.getElementById('user-nav-block');

    if (!authLinksBlock || !userNavBlock) return;

    if (currentUser) {
        // Пользователь авторизован
        authLinksBlock.style.display = 'none';
        userNavBlock.style.display = 'inline';

        // Строим блок пользователя
        const avatarUrl = getAvatarUrl(currentUsername, 32);
        const roleName = getRoleName(currentUserRole);

        // Ссылки для админа и мастера
        const extraLinks = [];
        if (currentUserRole === 'admin') {
            extraLinks.push(el('a', { className: 'user-nav-link', href: './admin.html' }, 'Админ'));
        }
        if (isMasterOrAdmin()) {
            extraLinks.push(el('a', { className: 'user-nav-link', href: './master.html' }, 'Мастерская'));
        }

        userNavBlock.innerHTML = '';
        userNavBlock.appendChild(
            el('div', { className: 'user-nav-block' },
                // Аватар
                el('img', {
                    className: 'user-nav-avatar',
                    src: avatarUrl,
                    alt: 'Аватар',
                    onerror: function () { this.src = 'https://placehold.co/32x32/4c3b9e/white?text=?'; }
                }),
                // Имя пользователя (ссылка на профиль)
                el('a', {
                    className: 'user-nav-name',
                    href: './profile-page.html?id=' + encodeURIComponent(currentUser.uid)
                }, currentUsername),
                // Дополнительные ссылки (админ, мастер)
                ...extraLinks,
                // Кнопка выхода
                el('button', {
                    className: 'logout-btn-nav',
                    onclick: logout
                }, 'Выйти')
            )
        );
    } else {
        // Пользователь не авторизован
        authLinksBlock.style.display = 'inline';
        userNavBlock.style.display = 'none';
    }
}

/* ======================================================================
   КАРТОЧКИ
   ====================================================================== */

/**
 * Создаёт стандартную карточку.
 * @param {Object} options — настройки карточки
 * @param {string} [options.className] — дополнительный CSS-класс
 * @param {Array} options.children — содержимое карточки
 * @returns {HTMLElement}
 */
export function createCard(options = {}) {
    const { className = '', children = [] } = options;

    return el('div', { className: 'card ' + className.trim() }, children);
}

/**
 * Создаёт игровую карточку (для рас, персонажей и т.д.).
 * @param {Object} options — настройки
 * @param {string} options.title — заголовок
 * @param {string} [options.subtitle] — подзаголовок
 * @param {string} [options.description] — описание
 * @param {Function} [options.onClick] — обработчик клика
 * @param {Array} [options.children] — дополнительные элементы
 * @returns {HTMLElement}
 */
export function createGameCard(options = {}) {
    const { title, subtitle, description, onClick, children = [] } = options;

    const card = el('div', {
        className: 'game-card',
        onclick: onClick || null
    });

    if (title) {
        card.appendChild(el('h3', { className: 'card-title' }, title));
    }

    if (subtitle) {
        card.appendChild(el('div', {
            className: 'news-meta',
            style: { marginBottom: '0.5rem' }
        }, subtitle));
    }

    if (description) {
        card.appendChild(el('p', { style: { color: '#a78bfa', fontSize: '0.9rem' } }, description));
    }

    children.forEach(child => {
        if (child instanceof Node) card.appendChild(child);
    });

    return card;
}

/* ======================================================================
   КНОПКИ
   ====================================================================== */

/**
 * Создаёт кнопку.
 * @param {string} text — текст кнопки
 * @param {Object} [options] — настройки
 * @param {string} [options.className] — CSS-класс
 * @param {string} [options.type] — type атрибут ('button', 'submit')
 * @param {Function} [options.onClick] — обработчик клика
 * @returns {HTMLElement}
 */
export function createButton(text, options = {}) {
    const { className = 'btn', type = 'button', onClick } = options;

    return el('button', {
        className,
        type,
        onclick: onClick || null
    }, text);
}

/* ======================================================================
   СООБЩЕНИЯ
   ====================================================================== */

/**
 * Показывает уведомление на странице (авто-скрытие через 5 секунд).
 * @param {string} text — текст сообщения
 * @param {string} type — тип: 'success', 'error', 'info'
 * @param {HTMLElement} [container] — контейнер для сообщения (по умолчанию #app)
 * @returns {HTMLElement} — элемент сообщения
 */
export function showMessage(text, type = 'info', container = null) {
    if (!text) return null;

    const messageClass = 'message message-' + type;

    const msgEl = el('div', { className: messageClass }, text);

    const parent = container || document.getElementById('app');
    if (parent) {
        parent.insertBefore(msgEl, parent.firstChild);
    }

    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (msgEl.parentNode) {
            msgEl.style.transition = 'opacity 0.3s';
            msgEl.style.opacity = '0';
            setTimeout(() => {
                if (msgEl.parentNode) msgEl.remove();
            }, 300);
        }
    }, 5000);

    return msgEl;
}

/* ======================================================================
   АВАТАР ИЗОБРАЖЕНИЕ
   ====================================================================== */

/**
 * Создаёт элемент изображения аватара.
 * @param {string} username — имя пользователя
 * @param {number} [size] — размер аватара
 * @param {string} [className] — CSS-класс
 * @returns {HTMLElement}
 */
export function createAvatarImage(username, size, className = 'avatar-img') {
    const url = getAvatarUrl(username, size);

    const img = el('img', {
        className,
        src: url,
        alt: 'Аватар ' + (username || ''),
        onerror: function () {
            this.src = 'https://placehold.co/' + (size || 150) + 'x' + (size || 150) + '/4c3b9e/white?text=?';
        }
    });

    return img;
}

/* ======================================================================
   СТАТИСТИКИ (для генератора персонажа)
   ====================================================================== */

/**
 * Создаёт блок для отображения одной характеристики (статы).
 * @param {string} label — название характеристики
 * @param {number|string} value — значение
 * @returns {HTMLElement}
 */
export function createStatBlock(label, value) {
    return el('div', { className: 'stat-block' },
        el('div', { className: 'stat-label' }, label),
        el('div', { className: 'stat-value' }, String(value))
    );
}

/* ======================================================================
   ПОЛЯ ВВОДА
   ====================================================================== */

/**
 * Создаёт поле ввода с меткой.
 * @param {Object} options — настройки
 * @param {string} options.label — текст метки
 * @param {string} options.type — тип поля ('text', 'password', 'email')
 * @param {string} options.id — ID поля
 * @param {string} options.placeholder — подсказка
 * @param {string} options.value — значение
 * @returns {HTMLElement} — группа: label + input
 */
export function createInput(options = {}) {
    const { label, type = 'text', id, placeholder, value } = options;

    const group = el('div', { className: 'form-group' });

    if (label) {
        group.appendChild(el('label', { className: 'form-label', for: id }, label));
    }

    group.appendChild(el('input', {
        className: 'form-input',
        type,
        id,
        placeholder: placeholder || '',
        value: value || ''
    }));

    return group;
}

/**
 * Создаёт текстовое поле (textarea) с меткой.
 * @param {Object} options
 * @returns {HTMLElement}
 */
export function createTextarea(options = {}) {
    const { label, id, placeholder, value } = options;

    const group = el('div', { className: 'form-group' });

    if (label) {
        group.appendChild(el('label', { className: 'form-label', for: id }, label));
    }

    group.appendChild(el('textarea', {
        className: 'form-textarea',
        id,
        placeholder: placeholder || '',
        innerText: value || ''
    }));

    return group;
}

/**
 * Создаёт выпадающий список (select) с меткой.
 * @param {Object} options
 * @param {Array<{value: string, label: string}>} options.options — список вариантов
 * @returns {HTMLElement}
 */
export function createSelect(options = {}) {
    const { label, id, options: items = [], value: selectedValue } = options;

    const group = el('div', { className: 'form-group' });

    if (label) {
        group.appendChild(el('label', { className: 'form-label', for: id }, label));
    }

    const select = el('select', { className: 'form-select', id });

    items.forEach(item => {
        const opt = el('option', {
            value: item.value,
            selected: item.value === selectedValue ? 'selected' : null
        }, item.label);
        select.appendChild(opt);
    });

    group.appendChild(select);
    return group;
}

/* ======================================================================
   ПОДВАЛ (FOOTER)
   ====================================================================== */

/**
 * Создаёт подвал страницы.
 * @returns {HTMLElement}
 */
export function createFooter() {
    return el('footer', {
        style: {
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            fontSize: '0.85rem',
            borderTop: '1px solid rgba(76, 59, 158, 0.3)',
            marginTop: '3rem'
        }
    }, '© ' + new Date().getFullYear() + ' DnD Картакар. Все права защищены.');
}

/* ======================================================================
   ТЕГИ
   ====================================================================== */

/**
 * Создаёт элемент-тег (для списка характеристик, способностей и т.д.).
 * @param {string} text — текст тега
 * @returns {HTMLElement}
 */
export function createTag(text) {
    return el('span', { className: 'tag' }, text);
}

/**
 * Создаёт контейнер с тегами.
 * @param {string[]} tags — массив строк для тегов
 * @returns {HTMLElement}
 */
export function createTagList(tags = []) {
    const container = el('div', { className: 'trait-list' });

    tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
            container.appendChild(createTag(tag.trim()));
        }
    });

    return container;
}

/* ======================================================================
   ЗАГРУЗЧИК (ЛОАДЕР)
   ====================================================================== */

/**
 * Создаёт или находит контейнер лоадера
 * @param {HTMLElement} container — контейнер для лоадера
 * @param {string} [text] — текст загрузки
 * @returns {HTMLElement}
 */
export function showLoader(container, text = 'Загрузка...') {
    if (!container) return null;

    const loader = el('div', {
        className: 'empty-state',
        id: 'loader-' + Date.now()
    }, text);

    container.appendChild(loader);
    return loader;
}

/**
 * Удаляет лоадер.
 * @param {HTMLElement} loader — элемент лоадера
 */
export function hideLoader(loader) {
    if (loader && loader.parentNode) {
        loader.remove();
    }
}

/* ======================================================================
   ПУСТОЕ СОСТОЯНИЕ
   ====================================================================== */

/**
 * Создаёт сообщение о пустом состоянии (нет данных).
 * @param {string} text — текст сообщения
 * @returns {HTMLElement}
 */
export function createEmptyState(text) {
    return el('div', { className: 'empty-state' }, text);
}
