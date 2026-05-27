const fs = require('fs');
const path = require('path');

function fixFile(filePath, replacements) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`❌ Файл не найден: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    for (const [from, to] of replacements) {
        if (content.includes(from)) {
            content = content.replaceAll(from, to);
            changed = true;
            console.log(`  Заменено: ${from} -> ${to}`);
        }
    }
    
    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Обновлён: ${filePath}`);
    }
}

console.log('🔧 Исправление путей для GitHub Pages...\n');

// Файлы для исправления и замены
const files = [
    'index.html',
    'auth.html',
    'admin.html',
    'lore.html',
    'master.html',
    'user.html',
    'user-list.html',
    'profile-page.html',
    'nav.html'
];

// Замены (относительные пути вместо абсолютных)
const replacements = [
    ['href="/css/', 'href="css/'],
    ['href="/js/', 'href="js/'],
    ['src="/js/', 'src="js/'],
    ['src="/css/', 'src="css/'],
    ['href="/settings/', 'href="settings/'],
    ['href="/favicon', 'href="favicon'],
    ['href="/index.html', 'href="index.html'],
    ['href="/auth.html', 'href="auth.html'],
    ['href="/admin.html', 'href="admin.html'],
    ['href="/lore.html', 'href="lore.html'],
    ['href="/master.html', 'href="master.html'],
    ['href="/user.html', 'href="user.html'],
    ['href="/user-list.html', 'href="user-list.html'],
    ['href="/profile-page.html', 'href="profile-page.html'],
    ['fetch("/settings/', 'fetch("settings/'],
    ['fetch("/nav.html', 'fetch("nav.html'],
    ['fetch("/js/', 'fetch("js/'],
    ['action="/', 'action="']
];

for (const file of files) {
    fixFile(file, replacements);
}

// Исправляем common.js отдельно (import пути)
const commonJSPath = path.join(__dirname, 'js', 'common.js');
if (fs.existsSync(commonJSPath)) {
    let content = fs.readFileSync(commonJSPath, 'utf8');
    content = content.replaceAll("fetch('/settings/", "fetch('settings/");
    content = content.replaceAll("fetch('/nav.html", "fetch('nav.html");
    fs.writeFileSync(commonJSPath, content);
    console.log(`✅ Обновлён: js/common.js`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ВАЖНО: Теперь нужно пересобрать сайт для GitHub Pages');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Выполните следующие команды в терминале:');
console.log('');
console.log('  git add .');
console.log('  git commit -m "Fix paths for GitHub Pages"');
console.log('  git push origin main');
console.log('');
console.log('После этого подождите 2-3 минуты и обновите страницу');
console.log('═══════════════════════════════════════════════════════════');