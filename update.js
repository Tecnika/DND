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

// ==================== ПРАВИЛЬНЫЙ main.css (относительные пути) ====================
// Файл уже существует, но проверим что он в правильном месте

// ==================== ОБНОВЛЁННЫЙ common.js с правильными путями ====================
const commonJS = `import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export let currentUser = null;
export let currentUserRole = null;
export let currentUsername = null;
export let settings = null;

async function loadSettings() {
    try {
        const response = await fetch('./settings/settings.json?t=' + Date.now());
        if (!response.ok) throw new Error('Settings not found');
        settings = await response.json();
        console.log('Настройки загружены');
    } catch (error) {
        console.error('Ошибка загрузки настроек:', error);
        settings = {
            avatars: { style: 'adventurer', backgroundColor: '6366f1,4c3b9e,8b5cf6', size: 150, radius: 50 }
        };
    }
}

export function getAvatarUrl(username, size = null) {
    if (!username) return 'https://placehold.co/150x150/4c3b9e/white?text=?';
    const avatarSize = size || settings?.avatars?.size || 150;
    const style = settings?.avatars?.style || 'adventurer';
    const colors = settings?.avatars?.backgroundColor || '6366f1,4c3b9e,8b5cf6';
    const radius = settings?.avatars?.radius || 50;
    return \`https://api.dicebear.com/9.x/\${style}/svg?seed=\${encodeURIComponent(username)}&backgroundColor=\${colors}&radius=\${radius}&size=\${avatarSize}\`;
}

export function getRoleName(role) {
    const roles = { admin: 'Администратор', master: 'Мастер', player: 'Игрок' };
    return roles[role] || role || 'Игрок';
}

export async function loadNavigation() {
    await loadSettings();
    
    const navPlaceholder = document.getElementById('nav-placeholder');
    if (!navPlaceholder) return;
    
    try {
        const response = await fetch('./nav.html');
        if (!response.ok) throw new Error('Nav not found');
        const navHtml = await response.text();
        navPlaceholder.innerHTML = navHtml;
    } catch (error) {
        console.error('Nav error:', error);
        navPlaceholder.innerHTML = '<nav class="navbar"><div class="nav-container"><a href="/" class="logo">DnD Картакар</a></div></nav>';
    }
    
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
                adminLink = '<a href="./admin.html" class="user-nav-link">Админ панель</a>';
            }
            if (currentUserRole === 'admin' || currentUserRole === 'master') {
                masterLink = '<a href="./master.html" class="user-nav-link">Мастерская</a>';
            }
            userNav.innerHTML = \`
                <div class="user-nav-block">
                    <img src="\${avatarUrl}" class="user-nav-avatar" alt="avatar" onerror="this.src='https://placehold.co/32x32/4c3b9e/white?text=?'">
                    <a href="./profile-page.html?id=\${currentUser.uid}" class="user-nav-name">\${currentUsername}</a>
                    \${adminLink}
                    \${masterLink}
                    <button class="logout-btn-nav" id="logout-btn-nav">Выйти</button>
                </div>
            \`;
            userNav.style.display = 'block';
            const logoutBtn = document.getElementById('logout-btn-nav');
            if (logoutBtn) {
                logoutBtn.onclick = async () => { await signOut(auth); window.location.href = './index.html'; };
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

export function requireAuth() {
    if (!currentUser) { window.location.href = './auth.html'; return false; }
    return true;
}

export async function requireAdmin() {
    if (!await isAdmin()) { alert('Доступ запрещён'); window.location.href = './index.html'; return false; }
    return true;
}
`;

// ==================== ПРАВИЛЬНЫЙ nav.html ====================
const navHTML = `<nav class="navbar">
    <div class="nav-container">
        <a href="./index.html" class="logo">DnD Картакар</a>
        <div class="nav-links">
            <a href="./index.html">Главная</a>
            <a href="./lore.html">Лор</a>
            <a href="./user-list.html">Сообщество</a>
            <div id="auth-links"><a href="./auth.html">Вход</a></div>
            <div id="user-nav" style="display:none"></div>
        </div>
    </div>
</nav>`;

// ==================== ПРАВИЛЬНЫЙ index.html ====================
const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DnD Картакар</title>
    <link rel="stylesheet" href="./css/main.css">
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="game-card"><h3>Лор мира</h3><p>История и легенды</p><a href="./lore.html" class="btn">Изучить</a></div>
                <div class="game-card"><h3>Сообщество</h3><p>Встречайте других искателей приключений</p><a href="./user-list.html" class="btn">К сообществу</a></div>
            </div>
        </div>
        <div class="card"><h1>Новости мира</h1><div id="newsList"><div class="empty-state">Загрузка...</div></div></div>
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
            if (snapshot.empty) { container.innerHTML = '<div class="empty-state">Новостей пока нет</div>'; return; }
            let html = '';
            for (const docSnap of snapshot.docs) {
                const news = docSnap.data();
                const shortText = news.fullText.substring(0, 200) + (news.fullText.length > 200 ? '...' : '');
                const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString('ru-RU') : 'Дата неизвестна';
                let authorDisplay = news.authorName || 'Админ';
                if (news.authorId) {
                    try {
                        const userDoc = await getDoc(doc(db, "players", news.authorId));
                        if (userDoc.exists()) {
                            authorDisplay = \`<a href="./profile-page.html?id=\${news.authorId}">\${userDoc.data().username}</a>\`;
                        }
                    } catch(e) { console.error('Ошибка получения автора:', e); }
                }
                html += \`<div class="news-card"><div class="news-title">📰 \${news.title}</div><div class="news-meta">📅 \${date} | ✍️ \${authorDisplay}</div><div class="news-short">\${shortText}</div><div class="news-full">\${news.fullText}</div><button class="read-more" onclick="toggleNews(this)">Читать далее</button></div>\`;
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

// ==================== СОЗДАЁМ ПАПКИ И ПЕРЕМЕЩАЕМ ФАЙЛЫ ====================
console.log('🔧 Исправление для GitHub Pages...\n');

// Обновляем файлы с правильными путями
updateFile('js/common.js', commonJS);
updateFile('nav.html', navHTML);
updateFile('index.html', indexHTML);

// Убеждаемся что settings.json существует
const settingsJSON = {
    "avatars": {
        "style": "adventurer",
        "size": 150,
        "smallSize": 32,
        "backgroundColor": "6366f1,4c3b9e,8b5cf6",
        "radius": 50
    },
    "roles": {
        "admin": { "name": "Администратор", "icon": "👑" },
        "master": { "name": "Мастер", "icon": "🎲" },
        "player": { "name": "Игрок", "icon": "🎮" }
    }
};
updateFile('settings/settings.json', JSON.stringify(settingsJSON, null, 2));

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('ТЕПЕРЬ ВЫПОЛНИТЕ В ТЕРМИНАЛЕ:');
console.log('');
console.log('  git add .');
console.log('  git commit -m "Fix GitHub Pages paths"');
console.log('  git push origin main');
console.log('');
console.log('После этого подождите 2 минуты и обновите страницу');
console.log('═══════════════════════════════════════════════════════════');