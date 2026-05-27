const fs = require('fs');
const path = require('path');

function updateFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}`);
}

// ==================== ОБНОВЛЁННЫЙ common.js (удалена ссылка на profile.html) ====================
const commonJS = `import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export let currentUser = null;
export let currentUserRole = null;
export let currentUsername = null;
export let settings = null;

async function loadSettings() {
    try {
        const response = await fetch('/settings/settings.json?t=' + Date.now());
        settings = await response.json();
        console.log('Настройки загружены, стиль аватарок:', settings?.avatars?.style);
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        settings = {
            avatars: { style: 'adventurer', colors: ['6366f1', '4c3b9e', '8b5cf6'], size: 150, radius: 50 }
        };
    }
}

export function getAvatarUrl(username, size = null) {
    if (!username) return settings?.avatars?.fallbackImage || 'https://placehold.co/150x150/4c3b9e/white?text=?';
    
    const avatarSize = size || settings?.avatars?.size || 150;
    const style = settings?.avatars?.style || 'adventurer';
    const colors = settings?.avatars?.backgroundColor || '6366f1,4c3b9e,8b5cf6';
    const radius = settings?.avatars?.radius || 50;
    
    return \`https://api.dicebear.com/9.x/\${style}/svg?seed=\${encodeURIComponent(username)}&backgroundColor=\${colors}&radius=\${radius}&size=\${avatarSize}\`;
}

export function getRoleName(role) {
    return settings?.roles?.[role]?.name || role || 'Игрок';
}

export function getRoleIcon(role) {
    return settings?.roles?.[role]?.icon || '🎮';
}

export async function loadNavigation() {
    await loadSettings();
    
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (!navPlaceholder) return;
    
    const response = await fetch('/nav.html');
    const navHtml = await response.text();
    navPlaceholder.innerHTML = navHtml;
    
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            currentUser = user;
            
            if (user) {
                const userDoc = await getDoc(doc(db, "players", user.uid));
                if (userDoc.exists()) {
                    currentUserRole = userDoc.data().role;
                    currentUsername = userDoc.data().username;
                } else {
                    currentUsername = user.email.split('@')[0];
                    currentUserRole = 'player';
                }
            }
            
            await updateNavigationUI();
            resolve();
        });
    });
}

async function updateNavigationUI() {
    const authLinks = document.getElementById('auth-links');
    const userNav = document.getElementById('user-nav');
    
    if (currentUser) {
        if (authLinks) authLinks.style.display = 'none';
        if (userNav) {
            const avatarUrl = getAvatarUrl(currentUsername, 32);
            
            let adminLink = '';
            let masterLink = '';
            
            if (currentUserRole === 'admin') {
                adminLink = '<a href="/admin.html" class="user-nav-link">Админ панель</a>';
            }
            if (currentUserRole === 'admin' || currentUserRole === 'master') {
                masterLink = '<a href="/master.html" class="user-nav-link">Мастерская</a>';
            }
            
            userNav.innerHTML = \`
                <div class="user-nav-block">
                    <img src="\${avatarUrl}" class="user-nav-avatar" alt="avatar" onerror="this.src='\${settings?.avatars?.fallbackImage}'">
                    <a href="/profile-page.html?id=\${currentUser.uid}" class="user-nav-name" style="text-decoration: none;">\${currentUsername}</a>
                    \${adminLink}
                    \${masterLink}
                    <button class="logout-btn-nav" id="logout-btn-nav">Выйти</button>
                </div>
            \`;
            userNav.style.display = 'block';
            
            const logoutBtn = document.getElementById('logout-btn-nav');
            if (logoutBtn) {
                logoutBtn.onclick = async () => {
                    await signOut(auth);
                    window.location.href = '/index.html';
                };
            }
        }
    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }
}

export async function isAdmin() {
    if (!currentUser) return false;
    if (currentUserRole === 'admin') return true;
    const userDoc = await getDoc(doc(db, "players", currentUser.uid));
    return userDoc.exists() && userDoc.data().role === 'admin';
}

export async function isMaster() {
    if (!currentUser) return false;
    if (currentUserRole === 'admin' || currentUserRole === 'master') return true;
    const userDoc = await getDoc(doc(db, "players", currentUser.uid));
    const role = userDoc.exists() ? userDoc.data().role : 'player';
    return role === 'admin' || role === 'master';
}

export function requireAuth() {
    if (!currentUser) { window.location.href = '/auth.html'; return false; }
    return true;
}

export async function requireAdmin() {
    if (!await isAdmin()) { alert('Доступ запрещён'); window.location.href = '/index.html'; return false; }
    return true;
}
`;

// ==================== ОБНОВЛЁННЫЙ index.html (убрана ссылка на profile.html) ====================
const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="game-card">
                    <h3>Лор мира</h3>
                    <p>История и легенды</p>
                    <a href="/lore.html" class="btn">Изучить</a>
                </div>
                <div class="game-card">
                    <h3>Сообщество</h3>
                    <p>Встречайте других искателей приключений</p>
                    <a href="/user.html" class="btn">К сообществу</a>
                </div>
            </div>
        </div>
        <div class="card">
            <h1>Новости мира</h1>
            <div id="newsList"><div class="empty-state">Загрузка...</div></div>
        </div>
    </div>
    <script type="module">
        import { loadNavigation } from './js/common.js';
        import { db } from './js/firebase-config.js';
        import { collection, query, orderBy, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        
        loadNavigation();
        
        async function loadNews() {
            const container = document.getElementById('newsList');
            const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state">Новостей пока нет</div>';
                return;
            }
            
            let html = '';
            for (const docSnap of snapshot.docs) {
                const news = docSnap.data();
                const shortText = news.fullText.substring(0, 200) + (news.fullText.length > 200 ? '...' : '');
                const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString('ru-RU') : 'Дата неизвестна';
                
                let authorDisplay = news.authorName || 'Админ';
                if (news.authorId) {
                    const userDoc = await getDoc(doc(db, "players", news.authorId));
                    if (userDoc.exists()) {
                        authorDisplay = \`<a href="/profile-page.html?id=\${news.authorId}">\${userDoc.data().username}</a>\`;
                    }
                }
                
                html += \`
                    <div class="news-card">
                        <div class="news-title">📰 \${news.title}</div>
                        <div class="news-meta">📅 \${date} | ✍️ \${authorDisplay}</div>
                        <div class="news-short">\${shortText}</div>
                        <div class="news-full">\${news.fullText}</div>
                        <button class="read-more" onclick="toggleNews(this)">Читать далее</button>
                    </div>
                \`;
            }
            container.innerHTML = html;
        }
        
        window.toggleNews = (btn) => {
            const card = btn.closest('.news-card');
            card.classList.toggle('expanded');
            btn.textContent = card.classList.contains('expanded') ? 'Свернуть' : 'Читать далее';
        };
        
        loadNews();
    </script>
</body>
</html>`;

// ==================== СОЗДАЁМ СТРАНИЦУ СООБЩЕСТВА user-list.html ====================
const userListHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Сообщество - DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .users-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        .user-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 1.2rem;
            text-align: center;
            transition: all 0.3s;
        }
        .user-card:hover {
            transform: translateY(-3px);
            background: rgba(0, 0, 0, 0.4);
        }
        .user-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 0.8rem;
            display: block;
        }
        .user-name {
            font-size: 1.1rem;
            color: #c4b5fd;
            margin-bottom: 0.3rem;
        }
        .user-role {
            font-size: 0.8rem;
            color: #8b5cf6;
        }
        .user-quote {
            font-size: 0.8rem;
            color: #a78bfa;
            font-style: italic;
            margin-top: 0.5rem;
            padding: 0.5rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <h1>Сообщество</h1>
            <p>Все искатели приключений</p>
            <div id="usersList" class="users-grid"><div class="empty-state">Загрузка...</div></div>
        </div>
    </div>
    <script type="module">
        import { db } from './js/firebase-config.js';
        import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { loadNavigation, getAvatarUrl, getRoleName, settings } from './js/common.js';
        
        await loadNavigation();
        
        async function loadUsers() {
            const container = document.getElementById('usersList');
            const snapshot = await getDocs(collection(db, "players"));
            
            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state">Пользователей пока нет</div>';
                return;
            }
            
            let html = '';
            for (const docSnap of snapshot.docs) {
                const user = docSnap.data();
                const username = user.username || 'Без имени';
                const role = getRoleName(user.role);
                const quote = user.quote || '';
                const avatarUrl = getAvatarUrl(username, 80);
                
                html += \`
                    <div class="user-card">
                        <img src="\${avatarUrl}" class="user-avatar" onerror="this.src='\${settings?.avatars?.fallbackImage}'">
                        <div class="user-name">
                            <a href="/profile-page.html?id=\${docSnap.id}" style="color: #c4b5fd; text-decoration: none;">\${username}</a>
                        </div>
                        <div class="user-role">\${role}</div>
                        \${quote ? \`<div class="user-quote">"\${quote.substring(0, 60)}\${quote.length > 60 ? '...' : ''}"</div>\` : ''}
                    </div>
                \`;
            }
            container.innerHTML = html;
        }
        
        loadUsers();
    </script>
</body>
</html>`;

// ==================== ЗАПИСЬ ФАЙЛОВ ====================
console.log('🗑️ Удаление всех ссылок на profile.html...\n');

// Обновляем файлы
updateFile('js/common.js', commonJS);
updateFile('index.html', indexHTML);
updateFile('user-list.html', userListHTML);

// Удаляем старый profile.html если существует
const profilePath = path.join(__dirname, 'profile.html');
if (fs.existsSync(profilePath)) {
    fs.unlinkSync(profilePath);
    console.log('🗑️ Удалён profile.html');
}

// Обновляем nav.html (убираем ссылку на Мои игры)
const navHTML = `<nav class="navbar">
    <div class="nav-container">
        <a href="/index.html" class="logo">DnD Картакар</a>
        <div class="nav-links">
            <a href="/index.html">Главная</a>
            <a href="/lore.html">Лор</a>
            <a href="/user-list.html">Сообщество</a>
            <div id="auth-links"><a href="/auth.html">Вход</a></div>
            <div id="user-nav" style="display:none"></div>
        </div>
    </div>
</nav>`;

updateFile('nav.html', navHTML);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Что сделано:');
console.log('- Удалены все ссылки на profile.html');
console.log('- В меню добавлена ссылка "Сообщество" (user-list.html)');
console.log('- На главной странице кнопки: "Лор мира" и "Сообщество"');
console.log('- В блоке профиля в навигации: имя → profile-page.html, админка, мастерская');
console.log('');
console.log('Новая структура:');
console.log('- Главная → Лор / Сообщество');
console.log('- Сообщество → список всех пользователей');
console.log('- Клик по пользователю → profile-page.html');
console.log('- Клик по своему имени в навигации → своя страница');
console.log('');
console.log('Обновите страницу (Ctrl+Shift+R)');
console.log('═══════════════════════════════════════════════════════════');