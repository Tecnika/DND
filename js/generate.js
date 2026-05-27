import { auth, db } from './firebase-config.js';
import { loadNavigation } from './common.js';
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const races = ['Человек', 'Эльф', 'Дварф', 'Полурослик', 'Драконорожденный', 'Тифлинг'];
const classes = ['Воин', 'Маг', 'Лучник', 'Жрец', 'Плут', 'Друид'];
const names = {
    'Человек': ['Эдвард', 'Элизабет', 'Томас', 'Анна'],
    'Эльф': ['Легалас', 'Арвен', 'Элронд', 'Галадриэль'],
    'Дварф': ['Торин', 'Гимли', 'Брунхильда', 'Оин']
};

function rollStat() { return Math.floor(Math.random() * 16) + 3; }

window.generateCharacter = () => {
    const race = races[Math.floor(Math.random() * races.length)];
    const charClass = classes[Math.floor(Math.random() * classes.length)];
    const nameList = names[race] || ['Герой', 'Искатель'];
    const name = nameList[Math.floor(Math.random() * nameList.length)];
    
    document.getElementById('generatedName').innerHTML = name;
    document.getElementById('generatedRace').innerHTML = race;
    document.getElementById('generatedClass').innerHTML = charClass;
    
    const stats = { strength: rollStat(), dexterity: rollStat(), constitution: rollStat(), intelligence: rollStat(), wisdom: rollStat(), charisma: rollStat() };
    
    for (let stat in stats) {
        const el = document.getElementById(`stat${stat}`);
        if (el) el.innerHTML = stats[stat];
    }
    
    window.currentGenerated = { name, race, class: charClass, stats, level: 1 };
};

window.saveCharacter = async () => {
    if (!auth.currentUser) { alert('Войдите в аккаунт'); window.location.href = '/auth.html'; return; }
    if (!window.currentGenerated) { alert('Сгенерируйте персонажа'); return; }
    
    await addDoc(collection(db, "characters"), { ...window.currentGenerated, uid: auth.currentUser.uid, createdAt: new Date().toISOString() });
    alert('Персонаж сохранён');
    window.location.href = '/profile.html';
};

await loadNavigation();
window.generateCharacter();
