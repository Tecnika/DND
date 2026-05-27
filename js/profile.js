import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadNavigation, currentUsername } from './common.js';

async function loadCharacters() {
    if (!auth.currentUser) return;
    
    const q = query(collection(db, "characters"), where("uid", "==", auth.currentUser.uid));
    const snapshot = await getDocs(q);
    const characters = [];
    snapshot.forEach(doc => characters.push({ id: doc.id, ...doc.data() }));
    
    const container = document.getElementById('charactersList');
    if (!container) return;
    
    if (characters.length === 0) {
        container.innerHTML = '<div class="empty-state">У вас пока нет персонажей</div>';
        return;
    }
    
    container.innerHTML = characters.map(char => `
        <div class="game-card">
            <h3>${char.name}</h3>
            <p>${char.race || '?'} | ${char.class || '?'} | Уровень ${char.level || 1}</p>
            <button class="btn-danger-small" onclick="deleteCharacter('${char.id}')">Удалить</button>
        </div>
    `).join('');
}

window.deleteCharacter = async (id) => {
    if (confirm('Удалить персонажа?')) {
        await deleteDoc(doc(db, "characters", id));
        await loadCharacters();
    }
};

document.getElementById('usernameDisplay') && (document.getElementById('usernameDisplay').textContent = currentUsername);

onAuthStateChanged(auth, async (user) => {
    if (!user && window.location.pathname.includes('index.html')) {
        window.location.href = '/auth.html';
        return;
    }
    await loadNavigation();
    if (user) await loadCharacters();
});
