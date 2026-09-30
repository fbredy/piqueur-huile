// State
let lists = {};
let activeList = 'List 1';
let isSpinning = false;
let currentRotation = 0;

// DOM Elements
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const spinBtn = document.getElementById('spinBtn');
const restartBtn = document.getElementById('restartBtn');
const themeToggle = document.getElementById('themeToggle');
const listSelect = document.getElementById('listSelect');
const newListBtn = document.getElementById('newListBtn');
const deleteListBtn = document.getElementById('deleteListBtn');
const namesList = document.getElementById('namesList');
const resultPopup = document.getElementById('resultPopup');
const resultName = document.getElementById('resultName');
const overlay = document.getElementById('overlay');
const keepBtn = document.getElementById('keepBtn');
const hideBtn = document.getElementById('hideBtn');

let selectedName = null;

// Helper to get current list names
function getCurrentNames() {
    return lists[activeList] || [];
}

// Colors for wheel segments
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#F06292', '#7986CB'
];

// Initialize
loadFromStorage();
loadTheme();
renderListSelector();
drawWheel();
renderNamesList();

// Event Listeners
addBtn.addEventListener('click', addName);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});
spinBtn.addEventListener('click', spinWheel);
restartBtn.addEventListener('click', restartAll);
themeToggle.addEventListener('click', toggleTheme);
listSelect.addEventListener('change', switchList);
newListBtn.addEventListener('click', createNewList);
deleteListBtn.addEventListener('click', deleteCurrentList);
keepBtn.addEventListener('click', () => closeResultPopup(false));
hideBtn.addEventListener('click', () => closeResultPopup(true));

// Functions
function loadFromStorage() {
    const stored = localStorage.getItem('pickerWheelData');
    if (stored) {
        const data = JSON.parse(stored);
        lists = data.lists;
        activeList = data.activeList;
    } else {
        // Migrate old data if exists
        const oldStored = localStorage.getItem('pickerWheelNames');
        if (oldStored) {
            lists = { 'List 1': JSON.parse(oldStored) };
            activeList = 'List 1';
            saveToStorage();
            localStorage.removeItem('pickerWheelNames');
        } else {
            lists = { 'List 1': [] };
            activeList = 'List 1';
        }
    }
}

function saveToStorage() {
    localStorage.setItem('pickerWheelData', JSON.stringify({ lists, activeList }));
}

function loadTheme() {
    const theme = localStorage.getItem('pickerWheelTheme') || 'light';
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('pickerWheelTheme', isDark ? 'dark' : 'light');
}

function renderListSelector() {
    listSelect.innerHTML = '';
    Object.keys(lists).forEach(listName => {
        const option = document.createElement('option');
        option.value = listName;
        option.textContent = listName;
        option.selected = listName === activeList;
        listSelect.appendChild(option);
    });
}

function switchList() {
    activeList = listSelect.value;
    saveToStorage();
    drawWheel();
    renderNamesList();
}

function createNewList() {
    const listName = prompt('Enter new list name:');
    if (!listName || !listName.trim()) return;

    const trimmedName = listName.trim();
    if (lists[trimmedName]) {
        alert('List already exists!');
        return;
    }

    lists[trimmedName] = [];
    activeList = trimmedName;
    saveToStorage();
    renderListSelector();
    drawWheel();
    renderNamesList();
}

function deleteCurrentList() {
    if (Object.keys(lists).length === 1) {
        alert('Cannot delete the last list!');
        return;
    }

    if (!confirm(`Delete list "${activeList}"?`)) return;

    delete lists[activeList];
    activeList = Object.keys(lists)[0];
    saveToStorage();
    renderListSelector();
    drawWheel();
    renderNamesList();
}

function addName() {
    const name = nameInput.value.trim();
    if (name) {
        lists[activeList].push({ text: name, hidden: false });
        nameInput.value = '';
        saveToStorage();
        drawWheel();
        renderNamesList();
    }
}

function removeName(index) {
    lists[activeList].splice(index, 1);
    saveToStorage();
    drawWheel();
    renderNamesList();
}

function unhideName(index) {
    lists[activeList][index].hidden = false;
    saveToStorage();
    drawWheel();
    renderNamesList();
}

function hideName(index) {
    lists[activeList][index].hidden = true;
    saveToStorage();
    drawWheel();
    renderNamesList();
}

function restartAll() {
    lists[activeList].forEach(name => name.hidden = false);
    saveToStorage();
    drawWheel();
    renderNamesList();
}

function renderNamesList() {
    namesList.innerHTML = '';
    const currentNames = getCurrentNames();

    if (currentNames.length === 0) {
        namesList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No names yet. Add some above!</p>';
        return;
    }

    currentNames.forEach((name, index) => {
        const item = document.createElement('div');
        item.className = `name-item ${name.hidden ? 'hidden' : ''}`;

        const text = document.createElement('span');
        text.className = 'name-text';
        text.textContent = name.text;

        item.appendChild(text);

        if (name.hidden) {
            const showBtn = document.createElement('button');
            showBtn.className = 'show-btn';
            showBtn.textContent = 'Show';
            showBtn.onclick = () => unhideName(index);
            item.appendChild(showBtn);
        } else {
            const hideBtn = document.createElement('button');
            hideBtn.className = 'hide-name-btn';
            hideBtn.textContent = 'Hide';
            hideBtn.onclick = () => hideName(index);
            item.appendChild(hideBtn);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeName(index);

        item.appendChild(removeBtn);
        namesList.appendChild(item);
    });
}

function drawWheel() {
    const currentNames = getCurrentNames();
    const visibleNames = currentNames.filter(n => !n.hidden);
    const numSegments = visibleNames.length;

    if (numSegments === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(200, 200, 192, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#666';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add names to spin!', 200, 200);
        spinBtn.disabled = true;
        return;
    }

    spinBtn.disabled = false;

    const anglePerSegment = (Math.PI * 2) / numSegments;
    const centerX = 200;
    const centerY = 200;
    const radius = 192;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    visibleNames.forEach((name, i) => {
        const startAngle = i * anglePerSegment;
        const endAngle = startAngle + anglePerSegment;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + anglePerSegment / 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(name.text, radius * 0.65, 5);
        ctx.restore();
    });
}

function spinWheel() {
    const currentNames = getCurrentNames();
    const visibleNames = currentNames.filter(n => !n.hidden);
    if (visibleNames.length === 0 || isSpinning) return;

    isSpinning = true;
    spinBtn.disabled = true;

    // Random spins (5-8 full rotations + random angle)
    const spins = 5 + Math.random() * 3;
    const extraDegrees = Math.random() * 360;
    const totalRotation = spins * 360 + extraDegrees;

    currentRotation += totalRotation;

    canvas.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        selectWinner();
        isSpinning = false;
        spinBtn.disabled = false;
    }, 2000);
}

function selectWinner() {
    const currentNames = getCurrentNames();
    const visibleNames = currentNames.filter(n => !n.hidden);
    if (visibleNames.length === 0) return;

    const numSegments = visibleNames.length;
    const degreesPerSegment = 360 / numSegments;

    // Normalize rotation
    const normalizedRotation = currentRotation % 360;

    // Pointer is at top (270 degrees in canvas coordinates)
    // After rotation, find which segment is now at top
    const pointerAngle = (270 - normalizedRotation + 360) % 360;
    const winnerIndex = Math.floor(pointerAngle / degreesPerSegment);

    selectedName = visibleNames[winnerIndex];

    resultName.textContent = selectedName.text;
    overlay.classList.add('show');
    resultPopup.classList.add('show');
}

function closeResultPopup(hideWinner) {
    if (hideWinner && selectedName) {
        const currentNames = getCurrentNames();
        const nameObj = currentNames.find(n => n.text === selectedName.text);
        if (nameObj) {
            nameObj.hidden = true;
            saveToStorage();
            drawWheel();
            renderNamesList();
        }
    }

    overlay.classList.remove('show');
    resultPopup.classList.remove('show');
    selectedName = null;
}
