const fs = require('fs');
const path = require('path');

function updateFile(filePath, content) {
    const fullPath = path.join(__dirname, filePath);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}`);
}

// ==================== ИСПРАВЛЕННЫЙ races.html ====================
const racesHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Расы мира - DnD Картакар</title>
    <link rel="stylesheet" href="./css/main.css">
    <style>
        .races-controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
            align-items: center;
        }
        .generation-filter {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        .gen-btn {
            background: rgba(99, 102, 241, 0.2);
            border: none;
            padding: 0.4rem 1rem;
            border-radius: 20px;
            cursor: pointer;
            color: #c4b5fd;
            transition: all 0.3s;
        }
        .gen-btn.active {
            background: linear-gradient(135deg, #6366f1, #4c3b9e);
            color: white;
        }
        .gen-btn:hover {
            background: #4c3b9e;
            color: white;
        }
        .races-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .race-card {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 1rem;
            transition: all 0.3s;
            border-left: 3px solid #8b5cf6;
            cursor: pointer;
        }
        .race-card:hover {
            transform: translateY(-2px);
            background: rgba(0, 0, 0, 0.4);
        }
        .race-name {
            font-size: 1.2rem;
            color: #c4b5fd;
            margin-bottom: 0.3rem;
        }
        .race-generation {
            font-size: 0.7rem;
            color: #8b5cf6;
            margin-bottom: 0.5rem;
        }
        .race-description {
            font-size: 0.85rem;
            color: #d4e0ff;
            line-height: 1.4;
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #8b5cf6;
        }
        .world-info {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            padding: 0.8rem;
            margin-bottom: 1rem;
            font-size: 0.85rem;
        }
        .error-message {
            color: #fca5a5;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <h1>Расы мира</h1>
            <div id="worldInfo" class="world-info"></div>
            
            <div class="races-controls">
                <div class="generation-filter" id="generationFilter"></div>
            </div>
            
            <div id="racesList" class="races-grid">
                <div class="loading">Загрузка рас...</div>
            </div>
        </div>
    </div>
    
    <script type="module">
        import { loadNavigation } from './js/common.js';
        import { db } from './js/firebase-config.js';
        import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        
        loadNavigation();
        
        let allRaces = [];
        let currentGeneration = 'all';
        let generations = [];
        
        function normalizeArray(value) {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
            return [];
        }
        
        async function loadRaces() {
            const container = document.getElementById('racesList');
            container.innerHTML = '<div class="loading">Загрузка рас...</div>';
            
            try {
                const snapshot = await getDocs(collection(db, "species"));
                
                if (snapshot.empty) {
                    container.innerHTML = '<div class="loading">Нет данных о расах</div>';
                    return;
                }
                
                allRaces = [];
                const genSet = new Set();
                
                snapshot.forEach(docSnap => {
                    const race = docSnap.data();
                    // Нормализуем массивы
                    race.traits = normalizeArray(race.traits);
                    race.strengths = normalizeArray(race.strengths);
                    race.weaknesses = normalizeArray(race.weaknesses);
                    
                    allRaces.push({ id: docSnap.id, ...race });
                    if (race.generation) genSet.add(race.generation);
                });
                
                allRaces.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                generations = Array.from(genSet).sort();
                
                const worldInfoDiv = document.getElementById('worldInfo');
                if (generations.length > 0) {
                    worldInfoDiv.innerHTML = \`📚 Всего рас: \${allRaces.length} | Поколения: \${generations.join(', ')}\`;
                } else {
                    worldInfoDiv.innerHTML = \`📚 Всего рас: \${allRaces.length}\`;
                }
                
                const genFilter = document.getElementById('generationFilter');
                let genHtml = '<button class="gen-btn active" data-gen="all">📚 Все расы</button>';
                generations.forEach(gen => {
                    genHtml += \`<button class="gen-btn" data-gen="\${gen}">📜 \${gen}</button>\`;
                });
                genFilter.innerHTML = genHtml;
                
                document.querySelectorAll('.gen-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.gen-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentGeneration = btn.dataset.gen;
                        renderRaces();
                    });
                });
                
                renderRaces();
                
            } catch (error) {
                console.error('Ошибка загрузки рас:', error);
                container.innerHTML = \`<div class="error-message">Ошибка загрузки: \${error.message}</div>\`;
            }
        }
        
        function renderRaces() {
            const container = document.getElementById('racesList');
            let filteredRaces = allRaces;
            
            if (currentGeneration !== 'all') {
                filteredRaces = allRaces.filter(race => race.generation === currentGeneration);
            }
            
            if (filteredRaces.length === 0) {
                container.innerHTML = '<div class="loading">Нет рас в этом поколении</div>';
                return;
            }
            
            let html = '';
            for (const race of filteredRaces) {
                const generation = race.generation || 'Не указано';
                const description = race.description || 'Описание отсутствует';
                const shortDesc = description.length > 120 ? description.substring(0, 120) + '...' : description;
                const raceId = race.id || race.name?.toLowerCase().replace(/ /g, '_');
                
                html += \`
                    <div class="race-card" onclick="window.location.href='./race.html?id=\${raceId}'">
                        <div class="race-name">✨ \${race.name || 'Без имени'}</div>
                        <div class="race-generation">📜 \${generation}</div>
                        <div class="race-description">\${shortDesc}</div>
                    </div>
                \`;
            }
            container.innerHTML = html;
        }
        
        loadRaces();
    </script>
</body>
</html>`;

// ==================== ИСПРАВЛЕННЫЙ race.html ====================
const raceHTML = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Раса - DnD Картакар</title>
    <link rel="stylesheet" href="./css/main.css">
    <style>
        .race-detail {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            padding: 1.5rem;
        }
        .race-header {
            border-bottom: 2px solid #8b5cf6;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
        }
        .race-name {
            font-size: 2rem;
            color: #c4b5fd;
            margin-bottom: 0.3rem;
        }
        .race-generation {
            color: #8b5cf6;
            font-size: 0.9rem;
        }
        .info-section {
            margin-bottom: 1.5rem;
        }
        .info-section h3 {
            color: #a78bfa;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            overflow: hidden;
        }
        .info-table th, .info-table td {
            padding: 0.6rem;
            text-align: left;
            border-bottom: 1px solid #4c3b9e;
        }
        .info-table th {
            background: #1a1a4e;
            color: #a78bfa;
            width: 30%;
        }
        .traits-list, .strengths-list, .weaknesses-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .trait-tag {
            background: #4c3b9e;
            color: #c4b5fd;
            padding: 0.2rem 0.6rem;
            border-radius: 15px;
            font-size: 0.8rem;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 1rem;
            color: #a78bfa;
            text-decoration: none;
        }
        .back-link:hover {
            color: #c4b5fd;
            text-decoration: underline;
        }
        .error-message {
            color: #fca5a5;
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div id="nav-placeholder"></div>
    <div class="container">
        <div class="card">
            <a href="./races.html" class="back-link">← Назад к списку рас</a>
            <div id="raceContent" class="race-detail">
                <div class="loading">Загрузка...</div>
            </div>
        </div>
    </div>
    
    <script type="module">
        import { loadNavigation } from './js/common.js';
        import { db } from './js/firebase-config.js';
        import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
        
        loadNavigation();
        
        const urlParams = new URLSearchParams(window.location.search);
        const raceId = urlParams.get('id');
        
        function normalizeArray(value) {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(s => s);
            return [];
        }
        
        async function loadRace() {
            if (!raceId) {
                document.getElementById('raceContent').innerHTML = '<div class="error-message">Не указана раса</div>';
                return;
            }
            
            try {
                const snapshot = await getDocs(collection(db, "species"));
                let race = null;
                
                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    if (docSnap.id === raceId || data.id === raceId || data.name?.toLowerCase().replace(/ /g, '_') === raceId) {
                        race = data;
                        break;
                    }
                }
                
                if (!race) {
                    document.getElementById('raceContent').innerHTML = '<div class="error-message">Раса не найдена</div>';
                    return;
                }
                
                // Нормализуем массивы
                const traits = normalizeArray(race.traits);
                const strengths = normalizeArray(race.strengths);
                const weaknesses = normalizeArray(race.weaknesses);
                
                let traitsHtml = '';
                if (traits.length > 0) {
                    traitsHtml = \`
                        <div class="info-section">
                            <h3>Особенности</h3>
                            <div class="traits-list">
                                \${traits.map(t => \`<span class="trait-tag">\${t}</span>\`).join('')}
                            </div>
                        </div>
                    \`;
                }
                
                let strengthsHtml = '';
                if (strengths.length > 0) {
                    strengthsHtml = \`
                        <div class="info-section">
                            <h3>Сильные стороны</h3>
                            <div class="strengths-list">
                                \${strengths.map(s => \`<span class="trait-tag">✨ \${s}</span>\`).join('')}
                            </div>
                        </div>
                    \`;
                }
                
                let weaknessesHtml = '';
                if (weaknesses.length > 0) {
                    weaknessesHtml = \`
                        <div class="info-section">
                            <h3>Слабые стороны</h3>
                            <div class="weaknesses-list">
                                \${weaknesses.map(w => \`<span class="trait-tag">⚠️ \${w}</span>\`).join('')}
                            </div>
                        </div>
                    \`;
                }
                
                let statsHtml = '';
                if (race.stats && typeof race.stats === 'object' && Object.keys(race.stats).length > 0) {
                    statsHtml = \`
                        <div class="info-section">
                            <h3>Характеристики</h3>
                            <table class="info-table">
                                \${Object.entries(race.stats).map(([key, val]) => \`
                                    <tr><th>\${key}</th><td>\${val}</td><tr>
                                \`).join('')}
                            </table>
                        </div>
                    \`;
                }
                
                const html = \`
                    <div class="race-header">
                        <div class="race-name">✨ \${race.name || 'Без имени'}</div>
                        <div class="race-generation">📜 Поколение: \${race.generation || 'Не указано'}</div>
                    </div>
                    <div class="info-section">
                        <h3>Описание</h3>
                        <p>\${race.description || 'Описание отсутствует'}</p>
                    </div>
                    \${traitsHtml}
                    \${strengthsHtml}
                    \${weaknessesHtml}
                    \${statsHtml}
                \`;
                
                document.getElementById('raceContent').innerHTML = html;
                
            } catch (error) {
                console.error('Ошибка:', error);
                document.getElementById('raceContent').innerHTML = \`<div class="error-message">Ошибка загрузки: \${error.message}</div>\`;
            }
        }
        
        loadRace();
    </script>
</body>
</html>`;

// ==================== ЗАПИСЬ ФАЙЛОВ ====================
console.log('🔧 Финальное исправление страниц рас...\n');

updateFile('races.html', racesHTML);
updateFile('race.html', raceHTML);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Что исправлено:');
console.log('- strengths, weaknesses, traits теперь корректно обрабатываются (строки → массивы)');
console.log('- Сортировка по поколениям восстановлена');
console.log('- Кнопки поколений отображаются корректно');
console.log('');
console.log('ТЕПЕРЬ ВЫПОЛНИТЕ:');
console.log('');
console.log('  git add races.html race.html');
console.log('  git commit -m "Final fix: normalize arrays and restore generation filter"');
console.log('  git push origin main');
console.log('');
console.log('Обновите страницу и проверьте');
console.log('═══════════════════════════════════════════════════════════');