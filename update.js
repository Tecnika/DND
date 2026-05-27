const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;

function createFile(filePath, content) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}`);
}

// ==================== user.html ====================
const userHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль пользователя - DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .profile-container {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 1.5rem;
        }
        .profile-sidebar {
            background: rgba(45, 27, 78, 0.85);
            border-radius: 25px;
            padding: 1.5rem;
            text-align: center;
        }
        .avatar-placeholder {
            width: 150px;
            height: 150px;
            background: linear-gradient(135deg, #7c3aed, #4c1d95);
            border-radius: 50%;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
        }
        .profile-info p { margin: 0.5rem 0; }
        .profile-label { color: #a78bfa; font-weight: 600; }
        .profile-content {
            background: rgba(45, 27, 78, 0.85);
            border-radius: 25px;
            padding: 1.5rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .game-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 1rem;
            border-left: 3px solid #7c3aed;
        }
        .empty-state { text-align: center; padding: 2rem; color: #a78bfa; }
        @media (max-width: 768px) {
            .profile-container { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    
    <div class="container">
        <div id="profileContent" class="profile-container">
            <div class="empty-state">Загрузка...</div>
        </div>
    </div>

    <script type="module">
        import { db } from './js/firebase-config.js';
        import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { loadNavigation } from './js/common.js';
        
        await loadNavigation();
        
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        
        if (!userId) {
            document.getElementById('profileContent').innerHTML = '<div class="card"><div class="empty-state">Не указан ID пользователя</div></div>';
        } else {
            try {
                const userDoc = await getDoc(doc(db, "players", userId));
                
                if (!userDoc.exists()) {
                    document.getElementById('profileContent').innerHTML = '<div class="card"><div class="empty-state">Пользователь не найден</div></div>';
                } else {
                    const userData = userDoc.data();
                    
                    const profileHTML = \`
                        <div class="profile-sidebar">
                            <div class="avatar-placeholder">🎲</div>
                            <div class="profile-info">
                                <p><span class="profile-label">Логин:</span> \${userData.username || 'Без имени'}</p>
                                <p><span class="profile-label">Дата регистрации:</span> \${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                                <p><span class="profile-label">Роль:</span> \${userData.role === 'admin' ? 'Администратор' : (userData.role === 'master' ? 'Мастер' : 'Игрок')}</p>
                            </div>
                        </div>
                        <div class="profile-content">
                            <h2>Персонажи</h2>
                            <div id="charactersList" class="grid">
                                <div class="empty-state">Загрузка персонажей...</div>
                            </div>
                        </div>
                    \`;
                    document.getElementById('profileContent').innerHTML = profileHTML;
                    
                    const q = query(collection(db, "characters"), where("uid", "==", userId));
                    const snapshot = await getDocs(q);
                    const container = document.getElementById('charactersList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = '<div class="empty-state">У пользователя нет персонажей</div>';
                    } else {
                        let charsHtml = '';
                        snapshot.forEach(docSnap => {
                            const char = docSnap.data();
                            charsHtml += \`
                                <div class="game-card">
                                    <h3>\${char.name}</h3>
                                    <p>\${char.race || '?'} | \${char.class || '?'} | Уровень \${char.level || 1}</p>
                                </div>
                            \`;
                        });
                        container.innerHTML = charsHtml;
                    }
                }
            } catch (error) {
                console.error('Ошибка:', error);
                document.getElementById('profileContent').innerHTML = '<div class="card"><div class="empty-state">Ошибка загрузки профиля</div></div>';
            }
        }
    </script>
</body>
</html>`;

// ==================== index.html с логами ====================
const indexHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .news-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 1.2rem;
            margin-bottom: 1rem;
        }
        .news-title { font-size: 1.3rem; color: #c4b5fd; margin-bottom: 0.5rem; }
        .news-meta { font-size: 0.8rem; color: #a78bfa; margin-bottom: 1rem; }
        .news-meta a { color: #ffaa00; text-decoration: underline; }
        .news-meta a:hover { color: #ffcc44; }
        .news-short { color: #d4c5e8; line-height: 1.5; }
        .news-full { display: none; margin-top: 1rem; line-height: 1.6; }
        .news-card.expanded .news-full { display: block; }
        .news-card.expanded .news-short { display: none; }
        .read-more {
            background: none;
            border: none;
            color: #a78bfa;
            cursor: pointer;
            margin-top: 0.5rem;
        }
        .debug-panel {
            background: #1a0a2e;
            border: 1px solid #7c3aed;
            border-radius: 10px;
            padding: 1rem;
            margin-top: 1rem;
            font-family: monospace;
            font-size: 0.8rem;
            max-height: 250px;
            overflow: auto;
        }
        .debug-panel h4 { color: #ffaa00; margin-bottom: 0.5rem; }
        .debug-log { color: #86efac; }
        .debug-error { color: #fca5a5; }
        .debug-warning { color: #fde047; }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="game-card"><h3>Мои игры</h3><p>Ваши персонажи и приключения</p><a href="/profile.html" class="btn">Перейти</a></div>
                <div class="game-card"><h3>Лор мира</h3><p>История и легенды</p><a href="/lore.html" class="btn">Изучить</a></div>
            </div>
        </div>
        <div class="card">
            <h1>Новости мира</h1>
            <div id="newsList" class="news-grid"><div class="empty-state">Загрузка...</div></div>
        </div>
        <div class="debug-panel">
            <h4>📋 Лог загрузки новостей</h4>
            <div id="debugLog"></div>
        </div>
    </div>
    <script type="module">
        import { loadNavigation } from './js/common.js';
        import { db } from './js/firebase-config.js';
        import { collection, query, orderBy, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        
        loadNavigation();
        
        function addDebugLog(message, type = 'log') {
            const debugDiv = document.getElementById('debugLog');
            const time = new Date().toLocaleTimeString();
            let colorClass = 'debug-log';
            if (type === 'error') colorClass = 'debug-error';
            if (type === 'warning') colorClass = 'debug-warning';
            debugDiv.innerHTML += \`<div class="\${colorClass}">[\${time}] \${message}</div>\`;
            debugDiv.scrollTop = debugDiv.scrollHeight;
            console.log(message);
        }
        
        async function loadNews() {
            addDebugLog('Начинаем загрузку новостей...');
            const container = document.getElementById('newsList');
            
            try {
                const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                
                addDebugLog(\`Получено новостей: \${snapshot.size}\`);
                
                if (snapshot.empty) {
                    container.innerHTML = '<div class="empty-state">Новостей пока нет</div>';
                    addDebugLog('Новостей нет');
                    return;
                }
                
                let html = '';
                let newsCount = 0;
                
                for (const docSnap of snapshot.docs) {
                    newsCount++;
                    const news = docSnap.data();
                    addDebugLog(\`--- Новость \${newsCount}: "\${news.title}" ---\`);
                    addDebugLog(\`  authorId: \${news.authorId || 'ОТСУТСТВУЕТ'}\`);
                    addDebugLog(\`  authorName: \${news.authorName || 'ОТСУТСТВУЕТ'}\`);
                    
                    const shortText = news.fullText.substring(0, 200) + (news.fullText.length > 200 ? '...' : '');
                    const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString('ru-RU') : 'Дата неизвестна';
                    
                    let authorDisplay = news.authorName || 'Админ';
                    
                    if (news.authorId) {
                        addDebugLog(\`  Ищем пользователя по ID: \${news.authorId}\`);
                        try {
                            const userDoc = await getDoc(doc(db, "players", news.authorId));
                            if (userDoc.exists()) {
                                const username = userDoc.data().username;
                                authorDisplay = \`<a href="/user.html?id=\${news.authorId}" style="color: #ffaa00; text-decoration: underline;">\${username}</a>\`;
                                addDebugLog(\`  Найден пользователь: \${username}, ссылка создана\`);
                            } else {
                                addDebugLog(\`  Пользователь с ID \${news.authorId} не найден\`, 'error');
                            }
                        } catch (err) {
                            addDebugLog(\`  Ошибка: \${err.message}\`, 'error');
                        }
                    } else {
                        addDebugLog(\`  Нет authorId, ссылка не будет создана\`, 'warning');
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
                addDebugLog(\`Загружено \${newsCount} новостей\`);
                
            } catch (error) {
                addDebugLog(\`ОШИБКА: \${error.message}\`, 'error');
                container.innerHTML = '<div class="empty-state">Ошибка загрузки новостей</div>';
            }
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

// ==================== СОЗДАЁМ ФАЙЛЫ ====================
console.log('Создание файлов...\n');

createFile('user.html', userHTML);
createFile('index.html', indexHTML);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Созданы файлы:');
console.log('- user.html (страница профиля пользователя)');
console.log('- index.html (главная страница с панелью логов)');
console.log('');
console.log('Обновите страницу (Ctrl+Shift+R)');
console.log('Внизу появится панель с логами');
console.log('Скопируйте сюда содержимое панели логов');
console.log('═══════════════════════════════════════════════════════════');