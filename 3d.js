document.getElementById('cubeGridSizePicker').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('cubeGridSizePicker').querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('cubeGridSizePicker').dataset.value = btn.dataset.val;
    });
});

document.getElementById('cubeCard').addEventListener('click', () => {
    currentMode = 'cube';
    showDifficulty('cubeDifficulty');
});
document.getElementById('cubeStartBtn').addEventListener('click', startGame);

registerMode('cube', () => {
    is3D = true;
    ROWS = COLS = LAYERS = parseInt(document.getElementById('cubeGridSizePicker').dataset.value);
    MINES = parseInt(document.getElementById('cubeMineCount').value);
    const vminPx = Math.min(window.innerWidth, window.innerHeight) / 100;
    const maxByWidth = 80 / COLS;
    const maxByHeight = (window.innerHeight * 0.55) / ROWS / vminPx;
    const cellSize = Math.min(11, maxByWidth, maxByHeight);
    document.documentElement.style.setProperty('--cell-size', `${cellSize}vmin`);
    document.getElementById('boardWrapper').classList.add('mode3D');
    document.getElementById('layerNav').style.display = 'flex';
    document.getElementById('layerLabel').textContent = `Floor 1/${LAYERS}`;
});