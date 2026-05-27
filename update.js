const fs = require('fs');
const path = require('path');

console.log('🔍 Диагностика структуры репозитория для GitHub Pages...\n');

// Проверяем наличие файлов
const requiredFiles = [
    'index.html',
    'nav.html',
    'auth.html',
    'admin.html',
    'lore.html',
    'master.html',
    'user.html',
    'user-list.html',
    'profile-page.html',
    'css/main.css',
    'js/common.js',
    'js/firebase-config.js',
    'settings/settings.json'
];

let missingFiles = [];

for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - ОТСУТСТВУЕТ`);
        missingFiles.push(file);
    }
}

console.log('\n═══════════════════════════════════════════════════════════');

if (missingFiles.length > 0) {
    console.log('⚠️ ОТСУТСТВУЮТ ФАЙЛЫ:');
    for (const file of missingFiles) {
        console.log(`   - ${file}`);
    }
    console.log('\nЭти файлы нужно добавить в репозиторий!');
} else {
    console.log('✅ Все файлы на месте');
}

// Создаём .nojekyll
const nojekyllPath = path.join(__dirname, '.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
    fs.writeFileSync(nojekyllPath, '');
    console.log('\n✅ Создан файл .nojekyll');
} else {
    console.log('\n✅ .nojekyll уже существует');
}

// Проверяем git status
console.log('\n═══════════════════════════════════════════════════════════');
console.log('ВЫПОЛНИТЕ В ТЕРМИНАЛЕ:');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('  git add .');
console.log('  git add -f .nojekyll');
console.log('  git commit -m "Add all files and .nojekyll"');
console.log('  git push origin main --force');
console.log('');
console.log('После этого подождите 3 минуты и обновите страницу');
console.log('═══════════════════════════════════════════════════════════');