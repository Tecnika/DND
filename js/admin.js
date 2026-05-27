import { auth, db } from './firebase-config.js';
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { loadNavigation, requireAdmin } from './common.js';

let allUsers = [];

async function loadUsers() {
    const snapshot = await getDocs(collection(db, "players"));
    allUsers = [];
    snapshot.forEach(doc => {
        allUsers.push({ id: doc.id, ...doc.data(), role: doc.data().role || 'player' });
    });
    renderUsers();
}

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (allUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Нет пользователей</td></tr>';
        return;
    }
    
    tbody.innerHTML = allUsers.map(user => {
        const isCurrentUser = auth.currentUser?.uid === user.id;
        return `
            <tr>
                <td>${user.username || 'Без имени'}</td>
                <td>${user.email || '-'}</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}" ${isCurrentUser ? 'disabled' : ''}>
                        <option value="player" ${user.role === 'player' ? 'selected' : ''}>Игрок</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Админ</option>
                        <option value="master" ${user.role === 'master' ? 'selected' : ''}>Мастер</option>
                    </select>
                </td>
                <td>
                    ${!isCurrentUser ? `<button class="btn-danger-small" onclick="deleteUser('${user.id}')">Удалить</button>` : 'Вы'}
                </td>
            </tr>
        `;
    }).join('');
    
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const userId = select.dataset.userId;
            const newRole = select.value;
            if (confirm(`Изменить роль на "${newRole}"?`)) {
                await updateDoc(doc(db, "players", userId), { role: newRole });
                await loadUsers();
            } else {
                const oldUser = allUsers.find(u => u.id === userId);
                select.value = oldUser?.role || 'player';
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

window.switchAdminTab = (tab) => {
    document.getElementById('usersPanel')?.classList.toggle('active', tab === 'users');
};

await loadNavigation();
await requireAdmin();
await loadUsers();
