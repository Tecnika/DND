import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export let currentUser = null;
export let currentUserRole = null;
export let currentUsername = null;

export async function loadNavigation() {
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
                }
            }
            
            updateNavigationUI();
            resolve();
        });
    });
}

function updateNavigationUI() {
    const userInfoSpan = document.getElementById('user-info-span');
    const usernameSpan = document.getElementById('username-span');
    const adminLink = document.getElementById('admin-link');
    const masterLink = document.getElementById('master-link');
    const logoutBtn = document.getElementById('logout-btn-nav');
    const authLinks = document.getElementById('auth-links');
    const userLinks = document.getElementById('user-links');
    
    if (currentUser) {
        if (userInfoSpan) userInfoSpan.style.display = 'flex';
        if (usernameSpan) usernameSpan.textContent = currentUsername;
        if (authLinks) authLinks.style.display = 'none';
        if (userLinks) userLinks.style.display = 'flex';
        if (adminLink) adminLink.style.display = currentUserRole === 'admin' ? 'inline-block' : 'none';
        if (masterLink) masterLink.style.display = (currentUserRole === 'admin' || currentUserRole === 'master') ? 'inline-block' : 'none';
        if (logoutBtn) logoutBtn.onclick = async () => { await signOut(auth); window.location.href = '/index.html'; };
    } else {
        if (userInfoSpan) userInfoSpan.style.display = 'none';
        if (authLinks) authLinks.style.display = 'flex';
        if (userLinks) userLinks.style.display = 'none';
    }
}

export async function isAdmin() {
    if (!currentUser) return false;
    if (currentUserRole === 'admin') return true;
    const userDoc = await getDoc(doc(db, "players", currentUser.uid));
    return userDoc.exists() && userDoc.data().role === 'admin';
}

export function requireAuth() {
    if (!currentUser) { window.location.href = '/auth.html'; return false; }
    return true;
}

export async function requireAdmin() {
    if (!await isAdmin()) { alert('Доступ запрещён'); window.location.href = '/index.html'; return false; }
    return true;
}
