document.getElementById('tessGridSizePicker').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('tessGridSizePicker').querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tessGridSizePicker').dataset.value = btn.dataset.val;
    });
});

document.getElementById('tessCard').addEventListener('click', () => {
    currentMode = 'tesseract';
    showDifficulty('tessDifficulty');
});
document.getElementById('tessStartBtn').addEventListener('click', startGame);
document.getElementById('timeFlip').addEventListener('click', () => changeTime(currentTime === 0 ? 1 : -1));

registerMode('tesseract', () => {
    is3D = true;
    TIMES = 2;
    currentTime = 0;
    ROWS = COLS = LAYERS = parseInt(document.getElementById('tessGridSizePicker').dataset.value);
    MINES = parseInt(document.getElementById('tessMineCount').value);
    const vminPx = Math.min(window.innerWidth, window.innerHeight) / 100;
    const maxByWidth = 80 / COLS;
    const maxByHeight = (window.innerHeight * 0.55) / ROWS / vminPx;
    const cellSize = Math.min(11, maxByWidth, maxByHeight);
    document.documentElement.style.setProperty('--cell-size', `${cellSize}vmin`);
    document.getElementById('boardWrapper').classList.add('mode3D');
    document.getElementById('layerNav').style.display = 'none';
    document.getElementById('timeNav').style.display = 'flex';
    document.getElementById('timeLabel').textContent = 'Time A';
});