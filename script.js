let ROWS, COLS, LAYERS = 1, currentLayer = 0;
let MINES;
let board = [];
let gameOver = false;
let timer = 0, timerInterval;
let streak = parseInt(localStorage.getItem('minesStreak') || '0');
let firstClick = true;
let is3D = false;
let rotX = 35, rotY = -25;
let DEPTH_GAP = 55;
let currentMode = 'classic';
const modeConfigs = {};
let cubeZoom = 1;
let TIMES = 1, currentTime = 0;
let shiftHeld = false;
let holdTouchActive = false;
let flagMode = false;   
window.addEventListener('keydown', (e) => { if (e.key === 'Shift') shiftHeld = true; });
window.addEventListener('keyup', (e) => { if (e.key === 'Shift') shiftHeld = false; });

document.addEventListener('touchstart', (e) => {
    if (e.touches.length >= 1) holdTouchActive = true;
}, {passive:true});
document.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) holdTouchActive = false;
}, {passive:true});

function registerMode(name, fn) { modeConfigs[name] = fn; }

function wireSizePicker(id, mineInputId) {
    const picker = document.getElementById(id);
    const mineInput = document.getElementById(mineInputId);
    picker.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            picker.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            picker.dataset.value = btn.dataset.val;
            const size = parseInt(btn.dataset.val);
            mineInput.value = Math.round(size * size * 0.3);
        });
    });
    mineInput.value = Math.round(parseInt(picker.dataset.value) ** 2 * 0.3);
}

const sounds = {
    click: new Audio('sounds/click.mp3'),
    flag: new Audio('sounds/flag.mp3'),
    boom: new Audio('sounds/boom.mp3'),
    win: new Audio('sounds/win.mp3')
};
function playSound(name) { sounds[name].currentTime = 0; sounds[name].play().catch(()=>{}); }

document.getElementById('menuBtn').addEventListener('click', () => location.reload());
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('flagModeBtn')?.addEventListener('click', (e) => {
    flagMode = !flagMode;
    e.target.classList.toggle('active', flagMode);
    e.target.textContent = flagMode ? '🚩 On' : '🚩 Off';
});
const globalBack = document.getElementById('globalBackBtn');

globalBack.addEventListener('click', () => {
    if (document.getElementById('gameArea').classList.contains('show')) {
        location.reload();
        return;
    }
    if (document.getElementById('difficulty').style.display === 'flex' ||
        document.getElementById('bigDifficulty').style.display === 'flex' ||
        document.getElementById('cubeDifficulty').style.display === 'flex' ||
        document.getElementById('tessDifficulty').style.display === 'flex') {
        document.getElementById('difficulty').style.display = 'none';
        document.getElementById('bigDifficulty').style.display = 'none';
        document.getElementById('cubeDifficulty').style.display = 'none';
        document.getElementById('tessDifficulty').style.display = 'none';
        document.getElementById('modeSelect').style.display = 'flex';
    } else if (document.getElementById('modeSelect').style.display === 'flex') {
        document.getElementById('modeSelect').style.display = 'none';
        document.querySelector('header').style.display = 'block';
        document.getElementById('playbtn').style.display = 'inline-block';
        globalBack.style.display = 'none';
    }
});

document.getElementById('playbtn').addEventListener('click', () => {
    document.getElementById('modeSelect').style.display = 'flex';
    document.getElementById('playbtn').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    globalBack.style.display = 'block';
});

function showDifficulty(panelId) {
    document.getElementById('modeSelect').style.display = 'none';
    document.getElementById(panelId).style.display = 'flex';
}

function startGame() {
    globalBack.style.display = 'block';
    firstClick = true;
    currentLayer = 0;
    rotX = 35; rotY = -25;
    document.getElementById('streak').textContent = `🔥 ${streak}`;

    modeConfigs[currentMode]();

    gameOver = false;
    timer = 0;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        const m = Math.floor(timer/60), s = timer%60;
        document.getElementById('timer').textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
    }, 1000);

    document.getElementById('minesLeft').textContent = `💣 ${MINES}`;
    document.getElementById('message').classList.remove('show');
    document.querySelector('header').style.display = 'none';
    document.getElementById('difficulty').style.display = 'none';
    document.getElementById('bigDifficulty').style.display = 'none';
    document.getElementById('cubeDifficulty').style.display = 'none';
    document.getElementById('tessDifficulty').style.display = 'none';
    document.getElementById('modeSelect').style.display = 'none';
    document.querySelector('#playbtn').style.display = 'none';
    document.getElementById('board').style.transform = 'translate(0px, 0px)';
    document.getElementById('gameArea').classList.add('show');
    board = Array(ROWS*COLS*LAYERS).fill(0).map(() => ({mine:false, revealed:false, count:0}));
    renderBoard();
}

function placeMines(exclude) {
    const total = ROWS*COLS*LAYERS;
    let minePositions = new Set();
    while (minePositions.size < MINES) {
        const pos = Math.floor(Math.random() * total);
        if (!exclude.has(pos)) minePositions.add(pos);
    }
    minePositions.forEach(i => board[i].mine = true);
    board.forEach((cell, i) => {
        if (cell.mine) return;
        cell.count = getNeighbors(i).filter(n => board[n].mine).length;
    });
}

function getNeighbors(i) {
    const per = ROWS*COLS;
    const layer = Math.floor(i / per);
    const rem = i % per;
    const row = Math.floor(rem / COLS);
    const col = rem % COLS;
    let neighbors = [];
    for (let dl = -1; dl <= 1; dl++) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dl === 0 && dr === 0 && dc === 0) continue;
                const l = layer+dl, r = row+dr, c = col+dc;
                if (l >= 0 && l < LAYERS && r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                    neighbors.push(l*per + r*COLS + c);
                }
            }
        }
    }
    return neighbors;
}

function chord(i) {
    if (gameOver) return;
    const neighbors = getNeighbors(i);
    if (neighbors.filter(n => board[n].flagged).length === board[i].count) {
        neighbors.forEach(n => { if (!board[n].flagged) revealCellData(n); });
        renderBoard();
        checkWin();
    }
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const per = ROWS*COLS;
    const gridCols = document.documentElement.style.getPropertyValue('--cell-size') ?
        `repeat(${COLS}, var(--cell-size))` : `repeat(${COLS}, 80px)`;

    if (!is3D) {
        boardEl.style.gridTemplateColumns = gridCols;
        boardEl.style.display = 'grid';
        for (let i = 0; i < per; i++) buildCell(boardEl, i);
        return;
    }

    boardEl.style.display = 'block';
    const firstLayer = document.createElement('div');
    firstLayer.className = 'layerGrid';
    firstLayer.style.gridTemplateColumns = gridCols;
    for (let domI = 0; domI < per; domI++) buildCell(firstLayer, domI);
    boardEl.appendChild(firstLayer);
    DEPTH_GAP = firstLayer.querySelector('.cell').offsetWidth;

    const centerOffset = ((LAYERS-1) * DEPTH_GAP) / 2;
    firstLayer.style.transform = `translateZ(${-centerOffset}px)`;
    for (let l = 1; l < LAYERS; l++) {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layerGrid';
        layerDiv.style.gridTemplateColumns = gridCols;
        const z = l * DEPTH_GAP - centerOffset;
        layerDiv.style.transform = `translateZ(${z}px)`;
        for (let domI = 0; domI < per; domI++) buildCell(layerDiv, l*per + domI);
        boardEl.appendChild(layerDiv);
    }
    applyCubeRotation();
}

function buildCell(container, i) {
    const cell = board[i];
    const div = document.createElement('div');
    div.className = 'cell';
    if (cell.revealed) div.classList.add('revealed');
    if (cell.flagged) div.classList.add('flagged');
    let content = '';
    if (cell.revealed && cell.mine) content = '💣';
    else if (cell.revealed && cell.count > 0) content = cell.count;
    else if (!cell.revealed && cell.flagged) content = '🚩';
    if (cell.revealed && cell.count > 0) div.dataset.n = cell.count;
    if (is3D) {
        ['front','back','left','right','top','bottom'].forEach(face => {
            const f = document.createElement('div');
            f.className = `cubeFace face-${face}`;
            f.textContent = content;
            if (content && cell.revealed && cell.count > 0) f.dataset.n = cell.count;
            div.appendChild(f);
        });
    } else {
        div.textContent = content;
        if (cell.revealed && cell.count > 0) div.dataset.n = cell.count;
    }
    div.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(i); });
    let pressTimer, longPressed = false;
    div.addEventListener('touchstart', (e) => {
        if (e.touches.length >= 2) { toggleFlag(i); longPressed = true; return; }
        longPressed = false;
        pressTimer = setTimeout(() => { toggleFlag(i); longPressed = true; }, 450);
    });
    div.addEventListener('touchend', () => clearTimeout(pressTimer));
    div.addEventListener('click', () => {
        if (longPressed) { longPressed = false; return; }
        if (flagMode || shiftHeld) { toggleFlag(i); return; }
        if (board[i].revealed && board[i].count > 0) chord(i);
        else { revealCellData(i); renderBoard(); checkWin(); }
    });
    container.appendChild(div);
}

function applyCubeRotation() {
    document.getElementById('board').style.transform = `scale3d(${cubeZoom}, ${cubeZoom}, ${cubeZoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
}

function toggleFlag(i) {
    if (board[i].revealed || gameOver) return;
    board[i].flagged = !board[i].flagged;
    playSound('flag');
    document.getElementById('minesLeft').textContent = `💣 ${MINES - board.filter(c => c.flagged).length}`;
    renderBoard();
}

function revealCellData(i) {
    if (board[i].revealed || board[i].flagged || gameOver) return;
    if (firstClick) {
        firstClick = false;
        placeMines(new Set([i, ...getNeighbors(i)]));
    }
    board[i].revealed = true;
    playSound('click');
    if (board[i].mine) {
        playSound('boom');
        streak = 0;
        localStorage.setItem('minesStreak', streak);
        document.getElementById('streak').textContent = `🔥 ${streak}`;
        gameOver = true;
        board.forEach(c => { if (c.mine) c.revealed = true; });
        showMessage('💥 Game Over!');
        return;
    } else if (board[i].count === 0) {
        getNeighbors(i).forEach(n => revealCellData(n));
    }
}

function checkWin() {
    if (gameOver) return;
    const safeCells = board.filter(c => !c.mine).length;
    const revealedSafe = board.filter(c => !c.mine && c.revealed).length;
    if (revealedSafe === safeCells) {
        gameOver = true;
        streak++;
        localStorage.setItem('minesStreak', streak);
        document.getElementById('streak').textContent = `🔥 ${streak}`;
        board.forEach(c => { if (c.mine) c.flagged = true; });
        renderBoard();
        showMessage('🎉 You Win!');
        playSound('win');
    }
}

function showMessage(text) {
    clearInterval(timerInterval);
    document.getElementById('messageText').textContent = text;
    document.getElementById('message').classList.add('show');
}

function changeLayer(dir) {
    if (!is3D || gameOver) return;
    currentLayer = Math.max(0, Math.min(LAYERS-1, currentLayer + dir));
    document.getElementById('layerLabel').textContent = `Floor ${currentLayer+1}/${LAYERS}`;
    renderBoard();
}

function enablePan() {
    const wrapper = document.getElementById('boardWrapper');
    const boardEl = document.getElementById('board');
    let isDown = false, startX, startY, scrollX = 0, scrollY = 0;

    wrapper.addEventListener('wheel', (e) => {
        if (!is3D) return;
        e.preventDefault();
        cubeZoom = Math.max(0.4, Math.min(2.5, cubeZoom - e.deltaY * 0.001));
        applyCubeRotation();
    });

    wrapper.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDown = true;
        wrapper.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
    });
    window.addEventListener('mouseup', () => { isDown = false; wrapper.classList.remove('dragging'); });
    window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        if (is3D) {
            rotY += dx * 0.4;
            rotX -= dy * 0.4;
            rotX = Math.max(-80, Math.min(80, rotX));
            applyCubeRotation();
        } else {
            scrollX += dx;
            scrollY += dy;
            boardEl.style.transform = `translate(${scrollX}px, ${scrollY}px)`;
        }
    });
    let touchX, touchY, pinchDist = 0;
    wrapper.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        } else {
            touchX = e.touches[0].clientX;
            touchY = e.touches[0].clientY;
        }
    });
    wrapper.addEventListener('touchmove', (e) => {
        if (is3D && e.touches.length === 2) {
            e.preventDefault();
            const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
            cubeZoom = Math.max(0.4, Math.min(2.5, cubeZoom * (newDist / pinchDist)));
            pinchDist = newDist;
            applyCubeRotation();
            return;
        }
        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchX;
        const dy = e.touches[0].clientY - touchY;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        if (is3D) {
            rotY += dx * 0.4;
            rotX -= dy * 0.4;
            rotX = Math.max(-80, Math.min(80, rotX));
            applyCubeRotation();
        } else {
            scrollX += dx;
            scrollY += dy;
            boardEl.style.transform = `translate(${scrollX}px, ${scrollY}px)`;
        }
    });
}
enablePan();
