wireSizePicker('gridSizePicker', 'mineCount');

document.getElementById('classicCard').addEventListener('click', () => {
    currentMode = 'classic';
    showDifficulty('difficulty');
});
document.getElementById('classicStartBtn').addEventListener('click', startGame);

registerMode('classic', () => {
    is3D = false;
    LAYERS = 1;
    document.getElementById('boardWrapper').classList.remove('mode3D');
    document.getElementById('layerNav').style.display = 'none';
    ROWS = COLS = parseInt(document.getElementById('gridSizePicker').dataset.value);
    MINES = parseInt(document.getElementById('mineCount').value);
    const vminPx = Math.min(window.innerWidth, window.innerHeight) / 100;
    const maxByWidth = 95 / COLS;
    const maxByHeight = (window.innerHeight * 0.85) / ROWS / vminPx;
    const cellSize = Math.min(12, maxByWidth, maxByHeight);
    document.documentElement.style.setProperty('--cell-size', `${cellSize}vmin`);
    document.getElementById('board').style.gridTemplateColumns = `repeat(${COLS}, var(--cell-size))`;
});