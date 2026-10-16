const LOGIC_WIDTH = 1080
const LOGIC_HEIGHT = 1080

const container = document.getElementById('container') as HTMLElement
const app = document.getElementById('app') as HTMLCanvasElement

//
const BORDER_ROWS = 32
const BORDER_COLS = BORDER_ROWS
const CELL_WIDTH = LOGIC_WIDTH / BORDER_COLS
const CELL_HEIGHT = LOGIC_HEIGHT / BORDER_ROWS

const BACKGROUND = 'lightyellow'
const STATE_COLOR = ['#202020', '#ff5050', '#50ff50', '#5050ff']

type Board = number

interface Position {
  x: number
  y: number
}

function createBoard() {
  return Array.from<Board>({ length: BORDER_COLS * BORDER_ROWS }).fill(0)
}

let currentBoard: Board[] = createBoard()
let nextBoard: Board[] = createBoard()

function countNbors(board: Board[], nbors: number[], index: number) {
  const row = Math.floor(index / BORDER_COLS)
  const col = index % BORDER_COLS

  /**
   * 笛卡尔坐标在图形编程里：[x,y] 更常见。
   *
   * [Δrow, Δcol]
   * 但是在算法题、矩阵、棋盘里：[Δrow, Δcol] 更常见。
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
  ]

  for (const [dy, dx] of directions) {
    const nRow = row + dy!
    const nCol = col + dx!

    // 越界
    if (nRow < 0 || nRow >= BORDER_ROWS || nCol < 0 || nCol >= BORDER_COLS) {
      continue
    }

    const nIndex = nRow * BORDER_COLS + nCol
    const state = board[nIndex]
    if (state !== undefined) {
      nbors[state]!++
    }
  }
}

function computeNextBoard(states: number, current: Board[], next: Board[]) {
  const DEAD = 0
  const ALIVE = 1

  for (let index = 0; index < current.length; index++) {
    const nbors = Array(states).fill(0)

    countNbors(current, nbors, index)

    switch (current[index]) {
      case DEAD:
        next[index] = nbors[ALIVE] === 3 ? ALIVE : DEAD
        break

      case ALIVE:
        next[index] = nbors[ALIVE] === 2 || nbors[ALIVE] === 3 ? ALIVE : DEAD
        break
    }
  }
}

if (!container) {
  throw new Error('No container')
}

if (!app) {
  throw new Error('No canvas')
}

const context = app.getContext('2d')

if (!context) {
  throw new Error('No context')
}

const ctx = context

const dpr = window.devicePixelRatio || 1

// -----------------------------
// 设置真实 bitmap 分辨率
// -----------------------------

app.width = LOGIC_WIDTH * dpr
app.height = LOGIC_HEIGHT * dpr

// -----------------------------
// 让绘制坐标仍然使用逻辑坐标
// -----------------------------

ctx.scale(dpr, dpr)

function resizeCanvas() {
  const rect = container.getBoundingClientRect()

  // 计算保持比例的显示尺寸

  const scale = Math.min(rect.width / LOGIC_WIDTH, rect.height / LOGIC_HEIGHT)

  const displayWidth = LOGIC_WIDTH * scale
  const displayHeight = LOGIC_HEIGHT * scale

  // CSS 尺寸
  // 不影响 bitmap 分辨率

  app.style.width = `${displayWidth}px`
  app.style.height = `${displayHeight}px`

  drawScene()
}

function getCellPosition(index: number) {
  const row = Math.floor(index / BORDER_COLS)
  const col = index % BORDER_COLS

  return {
    x: col * CELL_WIDTH,
    y: row * CELL_HEIGHT,
  }
}

function drawScene() {
  // 注意：
  // 这里使用逻辑坐标

  //
  ctx.clearRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT)
  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, LOGIC_WIDTH, LOGIC_HEIGHT)
  //
  currentBoard.forEach((cell, index) => {
    drawCell(index)
  })
}

function drawGrid(index: number) {
  const { x, y } = getCellPosition(index)

  ctx.strokeStyle = 'black'
  ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT)
}

function drawCell(index: number) {
  const { x, y } = getCellPosition(index)

  const state = currentBoard[index]
  if (state === undefined) return

  ctx.fillStyle = STATE_COLOR[state]!

  ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT)

  drawGrid(index)
}

const observer = new ResizeObserver(resizeCanvas)
observer.observe(container)

function screenToLogic(event: MouseEvent) {
  const rect = app.getBoundingClientRect()

  const scale = rect.width / LOGIC_WIDTH

  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
  }
}

function update(point: Position) {
  const col = Math.floor(point.x / CELL_WIDTH)
  const row = Math.floor(point.y / CELL_HEIGHT)

  if (col < 0 || col >= BORDER_COLS || row < 0 || row >= BORDER_ROWS) {
    return
  }

  const index = row * BORDER_COLS + col
  const state = currentBoard[index]

  currentBoard[index] = state === 1 ? 0 : 1
  drawCell(index)
}

app.addEventListener('click', (e) => {
  const point = screenToLogic(e)
  console.log(point)
  //
  update(point)
})

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector)

  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }

  return element
}

const rc = getElement<HTMLDivElement>('#roundCount')
let ROUNDCOUNT = 0
function increaseROUNDCOUNT() {
  ROUNDCOUNT++
  rc.innerHTML = `ROUND COUNT: ${ROUNDCOUNT}`
}
function resetROUNDCOUNT() {
  ROUNDCOUNT = 0
  rc.innerHTML = `ROUND COUNT: ${0}`
}

function updateNextBoard() {
  computeNextBoard(2, currentBoard, nextBoard)
  ;[currentBoard, nextBoard] = [nextBoard, currentBoard]
  drawScene()

  increaseROUNDCOUNT()
}
const next = getElement<HTMLButtonElement>('#next')
next.addEventListener('click', updateNextBoard)

function autoUpdateNextBoard(timestamp: number) {
  // requestAnimationFrame
  updateNextBoard()
  // compute currentBoard Alive cell
  // const aliveCell = currentBoard.filter((cell) => cell)
  // 手动停吧

  if (PLAY) {
    requestAnimationFrame(autoUpdateNextBoard)
  }
}

let PLAY = false
const autoplay = getElement<HTMLButtonElement>('#autoplay')
autoplay.addEventListener('click', () => {
  PLAY = !PLAY
  if (PLAY) {
    autoplay.innerHTML = 'STOP'
    requestAnimationFrame(autoUpdateNextBoard)
  } else {
    autoplay.innerHTML = 'AUTO_PLAY'
  }
})

const clear = getElement<HTMLButtonElement>('#clear')
clear.addEventListener('click', () => {
  PLAY = false
  autoplay.innerHTML = 'AUTO_PLAY'
  currentBoard = currentBoard.map(() => 0)
  resetROUNDCOUNT() // 这里多走一轮，是因为PLAY === false之前的 increaseROUNDCOUNT() 与当前的 resetROUNDCOUNT() 不同步。
  // 当这一整个函数运行完，increaseROUNDCOUNT()才执行。这个原因可能与异步有关。比如正在运行的函数，通过全局变量控制，应该怎么同步。
  // 这是js事件机制需要解决的问题。

  drawScene()
})

// get index by row and col
function gibrac(row: number, col: number) {
  return row * BORDER_COLS + col
}

const testCase = getElement<HTMLButtonElement>('#testCase')
testCase.addEventListener('click', () => {
  const ALIVE = 1
  if (!currentBoard) return

  currentBoard[gibrac(0, 1)] = ALIVE
  currentBoard[gibrac(1, 2)] = ALIVE
  currentBoard[gibrac(2, 2)] = ALIVE
  currentBoard[gibrac(2, 1)] = ALIVE
  currentBoard[gibrac(2, 0)] = ALIVE
  drawScene()
})
