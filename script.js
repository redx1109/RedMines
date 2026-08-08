let ROWS, COLS, MINES;
let board = [];
let gameOver = false;
let timer = 0, timerInterval;
let streak = parseInt(localStorage.getItem('minesStreak') || '0');
let firstClick = true;
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
wireSizePicker('gridSizePicker', 'mineCount');
wireSizePicker('bigGridSizePicker', 'bigMineCount');

const sounds = {
    click: new Audio('sounds/click.mp3'),
    flag: new Audio('sounds/flag.mp3'),
    boom: new Audio('sounds/boom.mp3'),
    win: new Audio('sounds/win.mp3')
};
function playSound(name) { sounds[name].currentTime = 0; sounds[name].play().catch(()=>{}); }

document.getElementById('menuBtn').addEventListener('click', () => location.reload());
document.getElementById('restartBtn').addEventListener('click', startGame);
const globalBack = document.getElementById('globalBackBtn');

globalBack.addEventListener('click', () => {
    if (document.getElementById('gameArea').classList.contains('show')) {
        location.reload();
        return;
    }
    if (document.getElementById('difficulty').style.display === 'flex' ||
        document.getElementById('bigDifficulty').style.display === 'flex') {
        document.getElementById('difficulty').style.display = 'none';
        document.getElementById('bigDifficulty').style.display = 'none';
        document.getElementById('modeSelect').style.display = 'flex';
    } else if (document.getElementById('modeSelect').style.display === 'flex') {
        document.getElementById('modeSelect').style.display = 'none';
        document.querySelector('header').style.display = 'block';
        document.getElementById('playbtn').style.display = 'inline-block';
        globalBack.style.display = 'none';
    }
});

let bigWorld = false;

document.getElementById('playbtn').addEventListener('click', () => {
    document.getElementById('modeSelect').style.display = 'flex';
    document.getElementById('playbtn').style.display = 'none';
    document.querySelector('header').style.display = 'none';    
    globalBack.style.display = 'block';
});

document.getElementById('classicCard').addEventListener('click', () => {
    bigWorld = false;
    document.getElementById('modeSelect').style.display = 'none';
    document.getElementById('difficulty').style.display = 'flex';
});

document.getElementById('bigWorldCard').addEventListener('click', () => {
    bigWorld = true;
    document.getElementById('modeSelect').style.display = 'none';
    document.getElementById('bigDifficulty').style.display = 'flex';
});

document.getElementById('classicStartBtn').addEventListener('click', startGame);
document.getElementById('bigStartBtn').addEventListener('click', startGame);

function startGame() {
    globalBack.style.display = 'block';
    globalBack.dataset.mode = 'game';
    firstClick = true;
    document.getElementById('streak').textContent = `🔥 ${streak}`;
    if (bigWorld) {
        ROWS = COLS = parseInt(document.getElementById('bigGridSizePicker').dataset.value);
        MINES = parseInt(document.getElementById('bigMineCount').value);
        document.getElementById('board').style.gridTemplateColumns = `repeat(${COLS}, 80px)`;
        document.getElementById('board').style.setProperty('--cell-size', '80px');
    } else {
        ROWS = COLS = parseInt(document.getElementById('gridSizePicker').dataset.value);
        MINES = parseInt(document.getElementById('mineCount').value);
        const vminPx = Math.min(window.innerWidth, window.innerHeight) / 100;
        const maxByWidth = 95 / COLS;
        const maxByHeight = (window.innerHeight * 0.85) / ROWS / vminPx;
        const cellSize = Math.min(12, maxByWidth, maxByHeight);
        document.documentElement.style.setProperty('--cell-size', `${cellSize}vmin`);
        document.getElementById('board').style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
    }

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
    document.getElementById('modeSelect').style.display = 'none';
    document.querySelector('#playbtn').style.display = 'none';
    document.getElementById('board').innerHTML = '';
    document.getElementById('board').style.transform = 'translate(0px, 0px)';
    document.getElementById('gameArea').classList.add('show');
    board = Array(ROWS*COLS).fill(0).map(() => ({mine:false, revealed:false, count:0}));
    renderBoard();
}

function placeMines(exclude) {
    let minePositions = new Set();
    while (minePositions.size < MINES) {
        const pos = Math.floor(Math.random() * ROWS * COLS);
        if (!exclude.has(pos)) minePositions.add(pos);
    }
    minePositions.forEach(i => board[i].mine = true);
    board.forEach((cell, i) => {
        if (cell.mine) return;
        cell.count = getNeighbors(i).filter(n => board[n].mine).length;
    });
}

function getNeighbors(i) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    let neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                neighbors.push(r * COLS + c);
            }
        }
    }
    return neighbors;
}

function chord(i) {
    if (gameOver) return;
    const neighbors = getNeighbors(i);
    if (neighbors.filter(n => board[n].flagged).length === board[i].count) {
        neighbors.forEach(n => { if (!board[n].flagged) revealCell(n); });
    }
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    board.forEach((cell, i) => {
        const div = document.createElement('div');
        div.className = 'cell';

        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFlag(i, div);
        });
        let pressTimer, longPressed = false;
        div.addEventListener('touchstart', () => {
            longPressed = false;
            pressTimer = setTimeout(() => { toggleFlag(i, div); longPressed = true; }, 450);
        });
        div.addEventListener('touchend', () => clearTimeout(pressTimer));
        div.addEventListener('click', () => {
            if (longPressed) { longPressed = false; return; }
            if (board[i].revealed && board[i].count > 0) chord(i);
            else revealCell(i);
        });

        boardEl.appendChild(div);
    });
}

function toggleFlag(i, div) {
    if (board[i].revealed || gameOver) return;
    board[i].flagged = !board[i].flagged;
    playSound('flag');
    document.getElementById('minesLeft').textContent = `💣 ${MINES - board.filter(c => c.flagged).length}`;
    div.textContent = board[i].flagged ? '🚩' : '';
    div.classList.toggle('flagged', board[i].flagged);
}

function revealCell(i) {
    if (board[i].revealed || board[i].flagged || gameOver) return;
    if (firstClick) {
        firstClick = false;
        placeMines(new Set([i, ...getNeighbors(i)]));
    }
    board[i].revealed = true;
    playSound('click');
    const div = document.querySelectorAll('.cell')[i];
    div.classList.add('revealed');
    if (board[i].mine) {
        playSound('boom');
        streak = 0;
        localStorage.setItem('minesStreak', streak);
        document.getElementById('streak').textContent = `🔥 ${streak}`;
        div.textContent = '💣';
        gameOver = true;
        revealAllMines();
        showMessage('💥 Game Over!');
        return;
    } else if (board[i].count > 0) {
        div.textContent = board[i].count;
        div.dataset.n = board[i].count;
    } else {
        div.textContent = '';
        getNeighbors(i).forEach(n => revealCell(n));
    }

    checkWin();
}

function revealAllMines() {
    board.forEach((cell, i) => {
        if (cell.mine) {
            document.querySelectorAll('.cell')[i].textContent = '💣';
        }
    });
}

function checkWin() {
    const safeCells = board.filter(c => !c.mine).length;
    const revealedSafe = board.filter(c => !c.mine && c.revealed).length;
    if (revealedSafe === safeCells) {
        gameOver = true;
        streak++;
        localStorage.setItem('minesStreak', streak);
        document.getElementById('streak').textContent = `🔥 ${streak}`;
        board.forEach((cell,i) => {
            if (cell.mine) document.querySelectorAll('.cell')[i].textContent = '🚩';
        });
        showMessage('🎉 You Win!');
        playSound('win');
    }
}

function showMessage(text) {
    clearInterval(timerInterval);
    document.getElementById('messageText').textContent = text;
    document.getElementById('message').classList.add('show');
}

function enablePan() {
    const wrapper = document.getElementById('boardWrapper');
    const boardEl = document.getElementById('board');
    let isDown = false, startX, startY, scrollX = 0, scrollY = 0;

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
        scrollX += e.clientX - startX;
        scrollY += e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        boardEl.style.transform = `translate(${scrollX}px, ${scrollY}px)`;
    });

    let touchX, touchY;
    wrapper.addEventListener('touchstart', (e) => {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
    });
    wrapper.addEventListener('touchmove', (e) => {
        const dx = e.touches[0].clientX - touchX;
        const dy = e.touches[0].clientY - touchY;
        scrollX += dx;
        scrollY += dy;
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        boardEl.style.transform = `translate(${scrollX}px, ${scrollY}px)`;
    });
}
enablePan();