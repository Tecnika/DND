const fs = require('fs');
const path = require('path');

const authJSPath = path.join(__dirname, 'js', 'auth.js');

const correctAuthJS = `import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function usernameToEmail(username) {
    const clean = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    return \`\${clean}@dnd-local.com\`;
}

window.switchTab = (tab) => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const btns = document.querySelectorAll('.tab-btn');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
};

// РЕГИСТРАЦИЯ
document.getElementById('register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const messageDiv = document.getElementById('message');
    
    if (!username) { messageDiv.innerHTML = '<div class="message error">Введите логин</div>'; return; }
    if (password.length < 6) { messageDiv.innerHTML = '<div class="message error">Пароль минимум 6 символов</div>'; return; }
    
    const email = usernameToEmail(username);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "players", userCredential.user.uid), {
            username: username,
            role: "player",
            flg_active: true,
            createdAt: new Date().toISOString()
        });
        messageDiv.innerHTML = '<div class="message success">Регистрация успешна</div>';
        // РЕДИРЕКТ НА ГЛАВНУЮ СТРАНИЦУ
        setTimeout(() => window.location.href = './index.html', 1500);
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            messageDiv.innerHTML = '<div class="message error">Логин занят</div>';
        } else {
            messageDiv.innerHTML = '<div class="message error">Ошибка: ' + error.message + '</div>';
        }
    }
});

// ВХОД
document.getElementById('login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('message');
    
    if (!username) { messageDiv.innerHTML = '<div class="message error">Введите логин</div>'; return; }
    
    const email = usernameToEmail(username);
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        messageDiv.innerHTML = '<div class="message success">Вход выполнен</div>';
        // РЕДИРЕКТ НА ГЛАВНУЮ СТРАНИЦУ
        setTimeout(() => window.location.href = './index.html', 1000);
    } catch (error) {
        messageDiv.innerHTML = '<div class="message error">Неверный логин или пароль</div>';
    }
});

// Проверка авторизации - редирект на главную, а не на profile.html
onAuthStateChanged(auth, (user) => {
    if (user && window.location.pathname.includes('auth.html')) {
        window.location.href = './index.html';
    }
});
`;

fs.writeFileSync(authJSPath, correctAuthJS, 'utf8');
console.log('✅ Исправлен js/auth.js');
console.log('   - Редирект после логина теперь на index.html');
console.log('   - Редирект после регистрации теперь на index.html');
console.log('   - Проверка авторизации теперь на index.html');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ГОТОВО');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('ТЕПЕРЬ ВЫПОЛНИТЕ:');
console.log('');
console.log('  git add js/auth.js');
console.log('  git commit -m "Fix redirect from profile.html to index.html"');
console.log('  git push origin main');
console.log('');
console.log('После этого обновите страницу и войдите снова');
console.log('═══════════════════════════════════════════════════════════');