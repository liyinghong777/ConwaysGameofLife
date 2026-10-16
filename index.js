const LOGIC_WIDTH = 1080;
const LOGIC_HEIGHT = 1080;
const container = document.getElementById('container');
const app = document.getElementById('app');
// -----------------------------
// Board
// -----------------------------
const BORDER_ROWS = 64;
const BORDER_COLS = BORDER_ROWS;
const CELL_WIDTH = LOGIC_WIDTH / BORDER_COLS;
const CELL_HEIGHT = LOGIC_HEIGHT / BORDER_ROWS;
const BACKGROUND = 'lightyellow';
const STATE_COLORS = ['#202020', '#ff5050', '#50ff50', '#5050ff'];
const BB = [
    // 0 - Dead
    {
        '026': 1,
        '125': 1,
        '224': 1,
        '323': 1,
        '521': 1,
        '620': 1,
        default: 0,
    },
    // 1 - Live
    {
        default: 2,
    },
    // 2 - Dying
    {
        default: 0,
    },
];
const Seeds = [
    // 0
    {
        '62': 1,
        default: 0,
    },
    // 1
    {
        default: 0,
    },
];
/**
 * row represent DEAD cell
 * column represent ALIVE cell
 * so in DEAD situation, only DEAD cell === 5 and ALIVE cell === 3, it would stay alive.
 * in ALIVE situation, ALIVE cell === 2 or 3. it would stay alive.
 * this is a states table.
 */
const GoL = [
    // 0 DEAD
    {
        '53': 1,
        default: 0,
    },
    // 1 ALIVE
    {
        '62': 1,
        '53': 1,
        default: 0,
    },
];
function createBoard() {
    return Array.from({
        length: BORDER_COLS * BORDER_ROWS,
    }).fill(0);
}
let currentBoard = createBoard();
let nextBoard = createBoard();
// -----------------------------
// Game of Life
// -----------------------------
function countNeighbors(board, neighborCounts, index) {
    const row = Math.floor(index / BORDER_COLS);
    const col = index % BORDER_COLS;
    /*
     * [Δrow, Δcol]
     *
     * 在棋盘、矩阵、算法题中，
     * [row, col] 通常比 [x, y] 更自然。
     */
    const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ];
    for (const [dy, dx] of directions) {
        const nextRow = (row + dy + BORDER_ROWS) % BORDER_ROWS;
        const nextCol = (col + dx + BORDER_COLS) % BORDER_COLS;
        const neighborIndex = nextRow * BORDER_COLS + nextCol;
        const state = board[neighborIndex];
        neighborCounts[state]++;
    }
}
function computeNextBoard(automaton, current, next) {
    for (let index = 0; index < current.length; index++) {
        const neighborCounts = Array(automaton.length).fill(0);
        countNeighbors(current, neighborCounts, index);
        const state = current[index];
        const transition = automaton[state];
        const key = neighborCounts.join('');
        next[index] = transition[key] ?? transition.default;
        // switch (current[index]) {
        //   case DEAD:
        //     next[index] = neighborCounts[ALIVE] === 3 ? ALIVE : DEAD
        //     break
        //   case ALIVE:
        //     next[index] = neighborCounts[ALIVE] === 2 || neighborCounts[ALIVE] === 3 ? ALIVE : DEAD
        //     break
        // }
    }
}
// -----------------------------
// DOM
// -----------------------------
if (!container) {
    throw new Error('No container');
}
if (!app) {
    throw new Error('No canvas');
}
const context = app.getContext('2d');
if (!context) {
    throw new Error('No context');
}
const ctx = context;
// -----------------------------
// Canvas
// -----------------------------
const dpr = window.devicePixelRatio || 1;
app.width = LOGIC_WIDTH * dpr;
app.height = LOGIC_HEIGHT * dpr;
// 绘制坐标继续使用逻辑坐标
ctx.scale(dpr, dpr);
function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    // 保持 1:1 比例
    const scale = Math.min(rect.width / LOGIC_WIDTH, rect.height / LOGIC_HEIGHT);
    const displayWidth = LOGIC_WIDTH * scale;
    const displayHeight = LOGIC_HEIGHT * scale;
    // CSS 尺寸
    // 不影响 bitmap 分辨率
    app.style.width = `${displayWidth}px`;
    app.style.height = `${displayHeight}px`;
    drawScene();
}
// -----------------------------
// Drawing
// -----------------------------
function getCellPosition(index) {
    const row = Math.floor(index / BORDER_COLS);
    const col = index % BORDER_COLS;
    return {
        x: col * CELL_WIDTH,
        y: row * CELL_HEIGHT,
    };
}
function drawScene() {
    ctx.clearRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT);
    currentBoard.forEach((_, index) => {
        drawCell(index);
    });
}
function drawGrid(index) {
    const { x, y } = getCellPosition(index);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
}
function drawCell(index) {
    const { x, y } = getCellPosition(index);
    const state = currentBoard[index];
    if (state === undefined) {
        return;
    }
    ctx.fillStyle = STATE_COLORS[state];
    ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
    drawGrid(index);
}
// -----------------------------
// ResizeObserver
// -----------------------------
const observer = new ResizeObserver(resizeCanvas);
observer.observe(container);
// -----------------------------
// Mouse
// -----------------------------
function screenToLogic(event) {
    const rect = app.getBoundingClientRect();
    const scale = rect.width / LOGIC_WIDTH;
    return {
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale,
    };
}
function updateCell(point) {
    const col = Math.floor(point.x / CELL_WIDTH);
    const row = Math.floor(point.y / CELL_HEIGHT);
    if (col < 0 || col >= BORDER_COLS || row < 0 || row >= BORDER_ROWS) {
        return;
    }
    const index = row * BORDER_COLS + col;
    const state = currentBoard[index];
    currentBoard[index] = state === 1 ? 0 : 1;
    drawCell(index);
}
app.addEventListener('click', (event) => {
    const point = screenToLogic(event);
    updateCell(point);
});
// -----------------------------
// Utility
// -----------------------------
function getElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Missing element: ${selector}`);
    }
    return element;
}
function getIndex(row, col) {
    return row * BORDER_COLS + col;
}
function getRC(index) {
    return {
        row: Math.floor(index / BORDER_COLS),
        col: index % BORDER_COLS,
    };
}
// -----------------------------
// Generation
// -----------------------------
const generationDisplay = getElement('#generationDisplay');
let generation = 0;
function updateGenerationDisplay() {
    generationDisplay.innerHTML = `GENERATION: ${generation}`;
}
// -----------------------------
// Next Generation
// -----------------------------
function updateNextBoard() {
    computeNextBoard(BB, currentBoard, nextBoard);
    [currentBoard, nextBoard] = [nextBoard, currentBoard];
    generation++;
    updateGenerationDisplay();
    drawScene();
}
const nextButton = getElement('#next');
nextButton.addEventListener('click', updateNextBoard);
// -----------------------------
// Auto Play
// -----------------------------
let isPlaying = false;
let animationFrameId = null;
const STEP_INTERVAL = 200;
let lastStepTime = 0;
function autoUpdate(timestamp) {
    // 即使 RAF 已经排队，
    // 也必须在真正执行时再次检查状态。
    if (!isPlaying) {
        return;
    }
    if (timestamp - lastStepTime >= STEP_INTERVAL) {
        updateNextBoard();
        lastStepTime = timestamp;
    }
    animationFrameId = requestAnimationFrame(autoUpdate);
}
const autoPlayButton = getElement('#autoplay');
autoPlayButton.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
        autoPlayButton.innerHTML = 'STOP';
        lastStepTime = performance.now();
        animationFrameId = requestAnimationFrame(autoUpdate);
        return;
    }
    autoPlayButton.innerHTML = 'AUTO';
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});
// -----------------------------
// Clear
// -----------------------------
const clearButton = getElement('#clear');
clearButton.addEventListener('click', () => {
    isPlaying = false;
    autoPlayButton.innerHTML = 'AUTO';
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    currentBoard = createBoard();
    nextBoard = createBoard();
    generation = 0;
    updateGenerationDisplay();
    drawScene();
});
// -----------------------------
// Test Case
// -----------------------------
const testCaseButton = getElement('#testCase');
testCaseButton.addEventListener('click', () => {
    const ALIVE = 1;
    currentBoard[getIndex(0, 1)] = ALIVE;
    currentBoard[getIndex(1, 2)] = ALIVE;
    currentBoard[getIndex(2, 2)] = ALIVE;
    currentBoard[getIndex(2, 1)] = ALIVE;
    currentBoard[getIndex(2, 0)] = ALIVE;
    drawScene();
});
// -----------------------------
// Test random Case
// -----------------------------
function randomTestCase() {
    currentBoard = createBoard();
    const centerRow = Math.floor(BORDER_ROWS / 2);
    const centerCol = Math.floor(BORDER_COLS / 2);
    const size = 20;
    for (let row = -size; row <= size; row++) {
        for (let col = -size; col <= size; col++) {
            if (Math.random() < 0.25) {
                const r = centerRow + row;
                const c = centerCol + col;
                if (r >= 0 && r < BORDER_ROWS && c >= 0 && c < BORDER_COLS) {
                    currentBoard[getIndex(r, c)] = 1;
                }
            }
        }
    }
    drawScene();
}
export {};
// randomTestCase()
//# sourceMappingURL=index.js.map