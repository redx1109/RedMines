wireSizePicker('bigGridSizePicker', 'bigMineCount');

document.getElementById('bigWorldCard').addEventListener('click', () => {
    currentMode = 'big';
    showDifficulty('bigDifficulty');
});
document.getElementById('bigStartBtn').addEventListener('click', startGame);

registerMode('big', () => {
    is3D = false;
    LAYERS = 1;
    document.getElementById('boardWrapper').classList.remove('mode3D');
    document.getElementById('layerNav').style.display = 'none';
    ROWS = COLS = parseInt(document.getElementById('bigGridSizePicker').dataset.value);
    MINES = parseInt(document.getElementById('bigMineCount').value);
    document.getElementById('board').style.gridTemplateColumns = `repeat(${COLS}, 80px)`;
    document.getElementById('board').style.setProperty('--cell-size', '80px');
});