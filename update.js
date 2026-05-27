const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = __dirname;

function updateFile(filePath, content) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Обновлён: ${filePath}`);
}

// ==================== 1. profile.html (DiceBear) ====================
const profileHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мой профиль - DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .profile-container { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }
        .profile-sidebar { background: rgba(45, 27, 78, 0.85); border-radius: 25px; padding: 1.5rem; text-align: center; }
        .avatar-img { width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 1rem; display: block; background: #2d1b4e; object-fit: cover; }
        .profile-info p { margin: 0.5rem 0; }
        .profile-label { color: #a78bfa; font-weight: 600; }
        .profile-content { background: rgba(45, 27, 78, 0.85); border-radius: 25px; padding: 1.5rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .game-card { background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 1rem; border-left: 3px solid #7c3aed; }
        .empty-state { text-align: center; padding: 2rem; color: #a78bfa; }
        .btn { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 40px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block; }
        @media (max-width: 768px) { .profile-container { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div id="profileContent" class="profile-container"><div class="empty-state">Загрузка...</div></div>
    </div>
    <script type="module">
        import { auth, db } from './js/firebase-config.js';
        import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { loadNavigation, requireAuth } from './js/common.js';
        
        await loadNavigation();
        requireAuth();
        
        async function loadProfile() {
            if (!auth.currentUser) return;
            const userDoc = await getDoc(doc(db, "players", auth.currentUser.uid));
            if (!userDoc.exists()) return;
            
            const userData = userDoc.data();
            const username = userData.username || 'Игрок';
            const role = userData.role === 'admin' ? 'Администратор' : (userData.role === 'master' ? 'Мастер' : 'Игрок');
            const regDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно';
            
            // DiceBear URL (стиль "micah" — геометрический, похож на beam)
            const avatarUrl = \`https://api.dicebear.com/9.x/micah/svg?seed=\${encodeURIComponent(username)}&backgroundColor=7c3aed,a78bfa,4c1d95,8b5cf6,c4b5fd&radius=50\`;
            
            const profileHTML = \`
                <div class="profile-sidebar">
                    <img src="\${avatarUrl}" alt="Avatar" class="avatar-img" onerror="this.src='https://placehold.co/150x150/7c3aed/white?text=?'">
                    <div class="profile-info">
                        <p><span class="profile-label">Логин:</span> \${username}</p>
                        <p><span class="profile-label">Роль:</span> \${role}</p>
                        <p><span class="profile-label">Дата регистрации:</span> \${regDate}</p>
                    </div>
                </div>
                <div class="profile-content">
                    <h2>Мои персонажи</h2>
                    <div id="charactersList" class="grid"><div class="empty-state">Загрузка персонажей...</div></div>
                    <a href="/generate.html" class="btn" style="margin-top: 1rem;">Создать персонажа</a>
                </div>
            \`;
            document.getElementById('profileContent').innerHTML = profileHTML;
            
            const q = query(collection(db, "characters"), where("uid", "==", auth.currentUser.uid));
            const snapshot = await getDocs(q);
            const container = document.getElementById('charactersList');
            if (snapshot.empty) {
                container.innerHTML = '<div class="empty-state">У вас пока нет персонажей</div>';
            } else {
                let charsHtml = '';
                snapshot.forEach(docSnap => {
                    const char = docSnap.data();
                    charsHtml += \`<div class="game-card"><h3>\${char.name}</h3><p>\${char.race || '?'} | \${char.class || '?'} | Уровень \${char.level || 1}</p></div>\`;
                });
                container.innerHTML = charsHtml;
            }
        }
        loadProfile();
    </script>
</body>
</html>`;

// ==================== 2. user.html (DiceBear) ====================
const userHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль пользователя - DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .profile-container { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; }
        .profile-sidebar { background: rgba(45, 27, 78, 0.85); border-radius: 25px; padding: 1.5rem; text-align: center; }
        .avatar-img { width: 150px; height: 150px; border-radius: 50%; margin: 0 auto 1rem; display: block; background: #2d1b4e; object-fit: cover; }
        .profile-info p { margin: 0.5rem 0; }
        .profile-label { color: #a78bfa; font-weight: 600; }
        .profile-content { background: rgba(45, 27, 78, 0.85); border-radius: 25px; padding: 1.5rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .game-card { background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 1rem; border-left: 3px solid #7c3aed; }
        .empty-state { text-align: center; padding: 2rem; color: #a78bfa; }
        @media (max-width: 768px) { .profile-container { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div id="profileContent" class="profile-container"><div class="empty-state">Загрузка...</div></div>
    </div>
    <script type="module">
        import { db } from './js/firebase-config.js';
        import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { loadNavigation } from './js/common.js';
        
        await loadNavigation();
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
        
        if (!userId) {
            document.getElementById('profileContent').innerHTML = '<div class="empty-state">Не указан ID пользователя</div>';
        } else {
            try {
                const userDoc = await getDoc(doc(db, "players", userId));
                if (!userDoc.exists()) {
                    document.getElementById('profileContent').innerHTML = '<div class="empty-state">Пользователь не найден</div>';
                } else {
                    const userData = userDoc.data();
                    const username = userData.username || 'Без имени';
                    const role = userData.role === 'admin' ? 'Администратор' : (userData.role === 'master' ? 'Мастер' : 'Игрок');
                    const regDate = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно';
                    
                    const avatarUrl = \`https://api.dicebear.com/9.x/micah/svg?seed=\${encodeURIComponent(username)}&backgroundColor=7c3aed,a78bfa,4c1d95,8b5cf6,c4b5fd&radius=50\`;
                    
                    const profileHTML = \`
                        <div class="profile-sidebar">
                            <img src="\${avatarUrl}" alt="Avatar" class="avatar-img" onerror="this.src='https://placehold.co/150x150/7c3aed/white?text=?'">
                            <div class="profile-info">
                                <p><span class="profile-label">Логин:</span> \${username}</p>
                                <p><span class="profile-label">Роль:</span> \${role}</p>
                                <p><span class="profile-label">Дата регистрации:</span> \${regDate}</p>
                            </div>
                        </div>
                        <div class="profile-content">
                            <h2>Персонажи</h2>
                            <div id="charactersList" class="grid"><div class="empty-state">Загрузка персонажей...</div></div>
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
                            charsHtml += \`<div class="game-card"><h3>\${char.name}</h3><p>\${char.race || '?'} | \${char.class || '?'} | Уровень \${char.level || 1}</p></div>\`;
                        });
                        container.innerHTML = charsHtml;
                    }
                }
            } catch (error) {
                console.error('Ошибка:', error);
                document.getElementById('profileContent').innerHTML = '<div class="empty-state">Ошибка загрузки профиля</div>';
            }
        }
    </script>
</body>
</html>`;

// ==================== 3. admin.html (DiceBear мини-аватарки) ====================
const adminHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ панель - DnD Картакар</title>
    <link rel="stylesheet" href="/css/main.css">
    <style>
        .admin-tabs { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .tab-btn-admin { background: rgba(124, 58, 237, 0.2); border: none; padding: 0.7rem 1.5rem; border-radius: 25px; cursor: pointer; color: #c4b5fd; font-weight: 600; }
        .tab-btn-admin.active { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; }
        .admin-panel { display: none; }
        .admin-panel.active { display: block; }
        .admin-table { width: 100%; border-collapse: collapse; background: rgba(0, 0, 0, 0.3); border-radius: 15px; overflow: hidden; }
        .admin-table th, .admin-table td { padding: 0.8rem; text-align: left; border-bottom: 1px solid #7c3aed; vertical-align: middle; }
        .admin-table th { background: #2d1b4e; color: #a78bfa; }
        .avatar-small { width: 32px; height: 32px; border-radius: 50%; vertical-align: middle; background: #2d1b4e; }
        .role-select { padding: 0.3rem 0.6rem; border-radius: 20px; border: 1px solid #7c3aed; background: #1a0a2e; color: #c4b5fd; cursor: pointer; }
        .btn-danger-small { background: #dc2626; border: none; padding: 0.3rem 0.6rem; border-radius: 15px; cursor: pointer; color: white; }
        .news-card { background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 1rem; margin-bottom: 1rem; }
        .news-title { font-size: 1.2rem; color: #c4b5fd; margin-bottom: 0.5rem; }
        .news-meta { font-size: 0.8rem; color: #a78bfa; margin-bottom: 0.5rem; }
        .news-form { background: rgba(0, 0, 0, 0.2); padding: 1.5rem; border-radius: 15px; margin-bottom: 2rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.3rem; color: #a78bfa; }
        .form-control { width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid #7c3aed; background: rgba(0,0,0,0.3); color: white; }
        .btn { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <h1>Админ панель</h1>
            <div class="admin-tabs">
                <button class="tab-btn-admin active" id="usersTab">Пользователи</button>
                <button class="tab-btn-admin" id="newsTab">Новости</button>
            </div>
            <div id="usersPanel" class="admin-panel active">
                <table class="admin-table">
                    <thead><tr><th>Аватар</th><th>Логин</th><th>Email</th><th>Роль</th><th>Действия</th></tr></thead>
                    <tbody id="usersTableBody"></tbody>
                </table>
            </div>
            <div id="newsPanel" class="admin-panel">
                <div class="news-form">
                    <h3>Создать новость</h3>
                    <div class="form-group"><label>Заголовок</label><input type="text" id="newsTitle" class="form-control" placeholder="Введите заголовок"></div>
                    <div class="form-group"><label>Текст (можно использовать HTML)</label><textarea id="newsText" rows="6" class="form-control" placeholder="Введите текст новости..."></textarea></div>
                    <button class="btn" id="publishBtn">Опубликовать</button>
                </div>
                <h3>Существующие новости</h3>
                <div id="newsList"></div>
            </div>
        </div>
    </div>
    <script type="module">
        import { auth, db } from './js/firebase-config.js';
        import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        import { loadNavigation, requireAdmin } from './js/common.js';
        
        await loadNavigation();
        await requireAdmin();
        
        let allUsers = [];
        
        function getAvatarUrl(username) {
            return \`https://api.dicebear.com/9.x/micah/svg?seed=\${encodeURIComponent(username)}&backgroundColor=7c3aed,a78bfa,4c1d95,8b5cf6,c4b5fd&radius=50&size=32\`;
        }
        
        async function loadUsers() {
            const snapshot = await getDocs(collection(db, "players"));
            allUsers = [];
            snapshot.forEach(doc => allUsers.push({ id: doc.id, ...doc.data(), role: doc.data().role || 'player' }));
            const tbody = document.getElementById('usersTableBody');
            if (!tbody) return;
            if (allUsers.length === 0) { tbody.innerHTML = '<tr><td colspan="5">Нет пользователей</td></tr>'; return; }
            tbody.innerHTML = allUsers.map(user => {
                const isCurrentUser = auth.currentUser?.uid === user.id;
                const avatarUrl = getAvatarUrl(user.username || user.id);
                return \`
                    <tr>
                        <td><img src="\${avatarUrl}" class="avatar-small" alt="avatar" onerror="this.src='https://placehold.co/32x32/7c3aed/white?text=?'"></td>
                        <td>\${user.username || 'Без имени'}</td>
                        <td>\${user.email || '-'}</td>
                        <td><select class="role-select" data-user-id="\${user.id}" \${isCurrentUser ? 'disabled' : ''}>
                            <option value="player" \${user.role === 'player' ? 'selected' : ''}>Игрок</option>
                            <option value="admin" \${user.role === 'admin' ? 'selected' : ''}>Админ</option>
                            <option value="master" \${user.role === 'master' ? 'selected' : ''}>Мастер</option>
                        </select></td>
                        <td>\${!isCurrentUser ? \`<button class="btn-danger-small" onclick="deleteUser('\${user.id}')">Удалить</button>\` : 'Вы'}</td>
                    </tr>
                \`;
            }).join('');
            document.querySelectorAll('.role-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const userId = select.dataset.userId;
                    const newRole = select.value;
                    if (confirm(\`Изменить роль на "\${newRole}"?\`)) {
                        await updateDoc(doc(db, "players", userId), { role: newRole });
                        await loadUsers();
                    }
                });
            });
        }
        
        window.deleteUser = async (userId) => {
            if (confirm('Удалить пользователя?')) {
                await deleteDoc(doc(db, "players", userId));
                await loadUsers();
            }
        };
        
        async function loadNews() {
            const container = document.getElementById('newsList');
            if (!container) return;
            try {
                const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                if (snapshot.empty) { container.innerHTML = '<div class="empty-state">Нет новостей</div>'; return; }
                let html = '';
                for (const docSnap of snapshot.docs) {
                    const news = docSnap.data();
                    const date = news.createdAt ? new Date(news.createdAt).toLocaleDateString('ru-RU') : 'Дата неизвестна';
                    const authorName = news.authorName || 'Админ';
                    html += \`<div class="news-card"><div class="news-title">\${news.title}</div><div class="news-meta">\${date} | \${authorName}</div><div>\${news.fullText.substring(0, 100)}...</div><button class="btn-danger-small" onclick="deleteNews('\${docSnap.id}')" style="margin-top:0.5rem">Удалить</button></div>\`;
                }
                container.innerHTML = html;
            } catch (error) { console.error('Ошибка:', error); container.innerHTML = '<div class="message error">Ошибка загрузки новостей</div>'; }
        }
        
        window.createNews = async () => {
            const title = document.getElementById('newsTitle').value.trim();
            const fullText = document.getElementById('newsText').value.trim();
            if (!title) { alert('Введите заголовок'); return; }
            if (!fullText) { alert('Введите текст'); return; }
            const currentUser = auth.currentUser;
            if (!currentUser) { alert('Не авторизован'); return; }
            try {
                await addDoc(collection(db, "news"), {
                    title: title, fullText: fullText, createdAt: new Date().toISOString(),
                    authorId: currentUser.uid, authorName: document.getElementById('username-span')?.textContent || 'Админ'
                });
                document.getElementById('newsTitle').value = '';
                document.getElementById('newsText').value = '';
                await loadNews();
                alert('Новость опубликована!');
            } catch (error) { console.error('Ошибка:', error); alert('Ошибка: ' + error.message); }
        };
        
        window.deleteNews = async (newsId) => {
            if (confirm('Удалить новость?')) {
                await deleteDoc(doc(db, "news", newsId));
                await loadNews();
            }
        };
        
        document.getElementById('usersTab').addEventListener('click', () => {
            document.getElementById('usersTab').classList.add('active');
            document.getElementById('newsTab').classList.remove('active');
            document.getElementById('usersPanel').classList.add('active');
            document.getElementById('newsPanel').classList.remove('active');
        });
        document.getElementById('newsTab').addEventListener('click', async () => {
            document.getElementById('newsTab').classList.add('active');
            document.getElementById('usersTab').classList.remove('active');
            document.getElementById('newsPanel').classList.add('active');
            document.getElementById('usersPanel').classList.remove('active');
            await loadNews();
        });
        document.getElementById('publishBtn').addEventListener('click', () => window.createNews());
        await loadUsers();
    </script>
</body>
</html>`;

// ==================== 4. Обновляем CSS (добавляем стили для аватарок) ====================
const cssPath = path.join(PROJECT_ROOT, 'css', 'main.css');
let cssContent = '';
if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, 'utf8');
}
if (!cssContent.includes('avatar-img')) {
    cssContent += `

/* Стили для аватарок DiceBear */
.avatar-img {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
}

.avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    vertical-align: middle;
}
`;
    updateFile('css/main.css', cssContent);
} else {
    console.log('⏭️ css/main.css уже содержит стили для аватарок');
}

// ==================== ЗАПИСЬ ФАЙЛОВ ====================
console.log('\n🔧 Установка DiceBear Avatars...\n');

updateFile('profile.html', profileHTML);
updateFile('user.html', userHTML);
updateFile('admin.html', adminHTML);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('✅ DiceBear Avatars успешно подключён');
console.log('✅ Больше нет ошибок к неработающим API');
console.log('');
console.log('Обновите страницу (Ctrl+Shift+R) — аватарки появятся');
console.log('═══════════════════════════════════════════════════════════');