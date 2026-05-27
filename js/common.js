import { auth, db } from './firebase-config.js';
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
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(username)}&backgroundColor=${colors}&radius=${radius}&size=${avatarSize}`;
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
            userNav.innerHTML = `
                <div class="user-nav-block">
                    <img src="${avatarUrl}" class="user-nav-avatar" alt="avatar" onerror="this.src='https://placehold.co/32x32/4c3b9e/white?text=?'">
                    <a href="./profile-page.html?id=${currentUser.uid}" class="user-nav-name">${currentUsername}</a>
                    ${adminLink}
                    ${masterLink}
                    <button class="logout-btn-nav" id="logout-btn-nav">Выйти</button>
                </div>
            `;
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
