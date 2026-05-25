const games = {
  sudoku: {
    title: "数独9宫格",
    desc: "参考移动端数独界面，点格子后用底部数字键填入 1-9。",
    note: "红心代表可犯错次数；错误会标红，提示会自动补一个正确数字。",
  },
  rush: {
    title: "通关大师",
    desc: "选择车辆，用方向键或按钮移动，把红车从右侧出口开出去。",
    note: "车辆只能沿自己的方向移动，红车开出出口后会弹出胜利界面。",
  },
  slide: {
    title: "拼来拼去",
    desc: "9宫格塔罗牌拼图，点击空位旁边的牌，把 1-8 排回顺序。",
    note: "右下角留空即完成；每张牌都有独立塔罗风格图案。",
  },
  water: {
    title: "倒水解谜",
    desc: "木纹桌面上的试管倒水玩法，把同色液体整理到同一支试管。",
    note: "先点来源试管，再点目标试管。只能倒到空管或同色液体上。",
  },
};

const sudokuLevels = [
  {
    puzzle: "070008601480031072003502000040209013000804000800050460901006080604100795700900020",
    solution: "275498631486731572193562847547629813369814257812357469921576384634281795758943126",
  },
  {
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179",
  },
];

const rushLevels = [
  [
    { id: "R", x: 0, y: 2, len: 2, dir: "h", color: "hero" },
    { id: "A", x: 0, y: 0, len: 2, dir: "v", color: "blue" },
    { id: "B", x: 2, y: 0, len: 2, dir: "v", color: "green" },
    { id: "C", x: 3, y: 1, len: 3, dir: "v", color: "yellow" },
    { id: "D", x: 4, y: 0, len: 2, dir: "h", color: "gray" },
    { id: "E", x: 0, y: 3, len: 2, dir: "h", color: "green" },
    { id: "F", x: 0, y: 4, len: 2, dir: "h", color: "blue" },
    { id: "G", x: 5, y: 3, len: 3, dir: "v", color: "yellow" },
  ],
  [
    { id: "R", x: 0, y: 2, len: 2, dir: "h", color: "hero" },
    { id: "A", x: 0, y: 0, len: 2, dir: "h", color: "blue" },
    { id: "B", x: 2, y: 0, len: 2, dir: "v", color: "green" },
    { id: "C", x: 3, y: 2, len: 2, dir: "v", color: "yellow" },
    { id: "D", x: 4, y: 0, len: 2, dir: "h", color: "gray" },
    { id: "E", x: 1, y: 4, len: 3, dir: "h", color: "green" },
    { id: "F", x: 4, y: 3, len: 2, dir: "v", color: "blue" },
    { id: "G", x: 5, y: 3, len: 3, dir: "v", color: "yellow" },
  ],
];

const tarotCards = [
  ["☀", "太阳"], ["☾", "月亮"], ["★", "星辰"], ["♕", "女皇"],
  ["⚔", "宝剑"], ["♆", "海潮"], ["✦", "命运"], ["♜", "高塔"],
];

const state = {
  current: "sudoku",
  moves: 0,
  sudokuLevel: 0,
  rushLevel: 0,
  slideLevel: 0,
  waterLevel: 0,
  sudokuValues: [],
  selectedSudoku: null,
  mistakes: 0,
  seconds: 0,
  timer: null,
  rushCars: [],
  selectedCar: "R",
  slideTiles: [],
  selectedTube: null,
  tubes: [],
};

const tabs = document.querySelectorAll(".tab");
const boardWrap = document.getElementById("boardWrap");
const titleEl = document.getElementById("gameTitle");
const descEl = document.getElementById("gameDesc");
const noteEl = document.getElementById("gameNote");
const moveEl = document.getElementById("moveCount");
const statusEl = document.getElementById("gameStatus");
const newGameBtn = document.getElementById("newGameBtn");
const resetBtn = document.getElementById("resetBtn");
const hintBtn = document.getElementById("hintBtn");
const winModal = document.getElementById("winModal");
const winText = document.getElementById("winText");
const winCloseBtn = document.getElementById("winCloseBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

function setMoves(value = 0) {
  state.moves = value;
  moveEl.textContent = `步数 ${state.moves}`;
}

function addMove() {
  setMoves(state.moves + 1);
}

function showWin(message) {
  winText.textContent = message;
  winModal.hidden = false;
  boardWrap.classList.add("success");
  setTimeout(() => boardWrap.classList.remove("success"), 550);
}

function hideWin() {
  winModal.hidden = true;
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function startTimer() {
  stopTimer();
  state.seconds = 0;
  state.timer = setInterval(() => {
    state.seconds += 1;
    const timeEl = document.getElementById("sudokuTime");
    if (timeEl) timeEl.textContent = formatTime(state.seconds);
  }, 1000);
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

function switchGame(game) {
  state.current = game;
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.game === game));
  titleEl.textContent = games[game].title;
  descEl.textContent = games[game].desc;
  noteEl.textContent = games[game].note;
  hintBtn.textContent = game === "sudoku" ? "提示" : "检查";
  resetCurrent();
}

function resetCurrent() {
  hideWin();
  stopTimer();
  setMoves(0);
  state.selectedTube = null;
  if (state.current === "sudoku") renderSudoku();
  if (state.current === "rush") renderRush();
  if (state.current === "slide") renderSlide(true);
  if (state.current === "water") renderWater();
}

function newCurrent() {
  if (state.current === "sudoku") state.sudokuLevel = (state.sudokuLevel + 1) % sudokuLevels.length;
  if (state.current === "rush") state.rushLevel = (state.rushLevel + 1) % rushLevels.length;
  if (state.current === "slide") state.slideLevel += 1;
  if (state.current === "water") state.waterLevel += 1;
  resetCurrent();
}

function runHintOrCheck() {
  if (state.current === "sudoku") fillSudokuHint();
  if (state.current === "rush") checkRushWin(true);
  if (state.current === "slide") checkSlideWin();
  if (state.current === "water") checkWaterWin();
}

function renderSudoku() {
  const level = sudokuLevels[state.sudokuLevel];
  state.sudokuValues = level.puzzle.split("");
  state.selectedSudoku = null;
  state.mistakes = 0;
  boardWrap.innerHTML = `
    <div class="sudoku-app">
      <div class="sudoku-hud">
        <span>普通</span>
        <span>错误：<b class="sudoku-hearts" id="sudokuHearts">♥♥♥</b></span>
        <span class="sudoku-time">◷ <b id="sudokuTime">00:00</b> Ⅱ</span>
      </div>
      <div class="sudoku-board" id="sudokuBoard"></div>
      <div class="sudoku-tools">
        <button class="tool-btn" type="button" data-tool="undo"><span>↩</span><b>撤销</b></button>
        <button class="tool-btn" type="button" data-tool="erase"><span>▱</span><b>擦除</b></button>
        <button class="tool-btn" type="button" data-tool="note"><span>✎</span><b>笔记</b></button>
        <button class="tool-btn" type="button" data-tool="auto"><span>▣</span><b>一键笔记</b></button>
        <button class="tool-btn" type="button" data-tool="hint"><span>💡</span><b>提示</b></button>
      </div>
      <div class="number-pad" id="numberPad"></div>
    </div>`;
  const board = document.getElementById("sudokuBoard");
  state.sudokuValues.forEach((value, index) => {
    const input = document.createElement("input");
    input.className = "sudoku-cell";
    input.maxLength = 1;
    input.inputMode = "numeric";
    input.dataset.index = String(index);
    if (value !== "0") {
      input.value = value;
      input.disabled = true;
      input.classList.add("given");
    }
    input.addEventListener("focus", () => selectSudokuCell(index));
    input.addEventListener("input", () => enterSudokuNumber(input.value, index));
    board.appendChild(input);
  });
  const pad = document.getElementById("numberPad");
  for (let n = 1; n <= 9; n += 1) {
    const button = document.createElement("button");
    button.className = "num-btn";
    button.type = "button";
    button.innerHTML = `<strong>${n}</strong><small>${countRemaining(n)}</small>`;
    button.addEventListener("click", () => enterSudokuNumber(String(n)));
    pad.appendChild(button);
  }
  document.querySelector('[data-tool="erase"]').addEventListener("click", eraseSudokuCell);
  document.querySelector('[data-tool="hint"]').addEventListener("click", fillSudokuHint);
  document.querySelector('[data-tool="undo"]').addEventListener("click", eraseSudokuCell);
  setStatus(`第 ${state.sudokuLevel + 1} 题`);
  startTimer();
}

function selectSudokuCell(index) {
  state.selectedSudoku = index;
  document.querySelectorAll(".sudoku-cell").forEach((cell) => cell.classList.remove("selected"));
  const cell = document.querySelector(`[data-index="${index}"]`);
  if (cell && !cell.disabled) cell.classList.add("selected");
}

function enterSudokuNumber(value, forcedIndex) {
  const index = forcedIndex ?? state.selectedSudoku;
  if (index === null || index === undefined) return;
  const input = document.querySelector(`[data-index="${index}"]`);
  if (!input || input.disabled) return;
  const clean = String(value).replace(/[^1-9]/g, "").slice(0, 1);
  input.value = clean;
  state.sudokuValues[index] = clean || "0";
  addMove();
  markSudokuConflicts();
  refreshNumberPad();
  if (clean && clean !== sudokuLevels[state.sudokuLevel].solution[index]) {
    state.mistakes = Math.min(3, state.mistakes + 1);
    updateHearts();
  }
  checkSudokuWin();
}

function eraseSudokuCell() {
  if (state.selectedSudoku === null) return;
  const input = document.querySelector(`[data-index="${state.selectedSudoku}"]`);
  if (!input || input.disabled) return;
  input.value = "";
  state.sudokuValues[state.selectedSudoku] = "0";
  addMove();
  markSudokuConflicts();
  refreshNumberPad();
}

function updateHearts() {
  const hearts = document.getElementById("sudokuHearts");
  if (hearts) hearts.textContent = "♥".repeat(Math.max(0, 3 - state.mistakes)) || "×";
}

function countRemaining(n) {
  const used = state.sudokuValues.filter((value) => value === String(n)).length;
  return Math.max(0, 9 - used);
}

function refreshNumberPad() {
  document.querySelectorAll(".num-btn").forEach((button, index) => {
    button.querySelector("small").textContent = countRemaining(index + 1);
  });
}

function markSudokuConflicts() {
  document.querySelectorAll(".sudoku-cell").forEach((cell) => cell.classList.remove("invalid"));
  for (let index = 0; index < 81; index += 1) {
    const value = state.sudokuValues[index];
    if (value === "0") continue;
    if (value !== sudokuLevels[state.sudokuLevel].solution[index]) {
      document.querySelector(`[data-index="${index}"]`).classList.add("invalid");
    }
  }
}

function fillSudokuHint() {
  const level = sudokuLevels[state.sudokuLevel];
  const empty = state.sudokuValues.findIndex((value, index) => value === "0" || value !== level.solution[index]);
  if (empty === -1) {
    checkSudokuWin();
    return;
  }
  state.sudokuValues[empty] = level.solution[empty];
  const input = document.querySelector(`[data-index="${empty}"]`);
  input.value = level.solution[empty];
  input.classList.add("given");
  input.classList.remove("invalid");
  input.disabled = true;
  addMove();
  refreshNumberPad();
  checkSudokuWin();
}

function checkSudokuWin() {
  const solved = state.sudokuValues.join("") === sudokuLevels[state.sudokuLevel].solution;
  setStatus(solved ? "数独完成" : "继续思考");
  if (solved) {
    stopTimer();
    showWin(`数独完成，用时 ${formatTime(state.seconds)}。`);
  }
}

function renderRush() {
  state.rushCars = rushLevels[state.rushLevel].map((car) => ({ ...car }));
  state.selectedCar = "R";
  boardWrap.innerHTML = '<div><div class="rush-board" id="rushBoard"></div><div class="arrow-pad"><button data-dir="up">↑</button><button data-dir="left">←</button><button data-dir="right">→</button><button data-dir="down">↓</button></div></div>';
  const board = document.getElementById("rushBoard");
  for (let i = 0; i < 36; i += 1) {
    const cell = document.createElement("div");
    cell.className = "rush-cell";
    board.appendChild(cell);
  }
  drawCars();
  document.querySelectorAll(".arrow-pad button").forEach((button) => {
    button.addEventListener("click", () => moveSelectedCar(button.dataset.dir));
  });
  setStatus(`第 ${state.rushLevel + 1} 关`);
}

function drawCars() {
  const board = document.getElementById("rushBoard");
  board.querySelectorAll(".car").forEach((car) => car.remove());
  const boardSize = board.clientWidth || 540;
  const cell = (boardSize - 16 - 30) / 6;
  const gap = 6;
  state.rushCars.forEach((car) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `car ${car.color} ${state.selectedCar === car.id ? "selected" : ""}`;
    el.textContent = car.id;
    el.style.left = `${8 + car.x * cell + car.x * gap}px`;
    el.style.top = `${8 + car.y * cell + car.y * gap}px`;
    el.style.width = `${car.dir === "h" ? car.len * cell + (car.len - 1) * gap : cell}px`;
    el.style.height = `${car.dir === "v" ? car.len * cell + (car.len - 1) * gap : cell}px`;
    el.addEventListener("click", () => {
      state.selectedCar = car.id;
      drawCars();
    });
    board.appendChild(el);
  });
}

function occupiedCells(skipId) {
  const cells = new Set();
  state.rushCars.forEach((car) => {
    if (car.id === skipId) return;
    for (let i = 0; i < car.len; i += 1) {
      const x = car.x + (car.dir === "h" ? i : 0);
      const y = car.y + (car.dir === "v" ? i : 0);
      cells.add(`${x},${y}`);
    }
  });
  return cells;
}

function moveSelectedCar(dir) {
  const car = state.rushCars.find((item) => item.id === state.selectedCar);
  if (!car) return;
  const horizontal = dir === "left" || dir === "right";
  if ((car.dir === "h") !== horizontal) return;
  const dx = dir === "left" ? -1 : dir === "right" ? 1 : 0;
  const dy = dir === "up" ? -1 : dir === "down" ? 1 : 0;
  const nextX = car.x + dx;
  const nextY = car.y + dy;
  const tailX = nextX + (car.dir === "h" ? car.len - 1 : 0);
  const tailY = nextY + (car.dir === "v" ? car.len - 1 : 0);
  if (nextX < 0 || nextY < 0 || tailY > 5 || tailX > 5) {
    if (car.id === "R" && dir === "right" && car.y === 2 && car.x + car.len - 1 === 5) winRush();
    return;
  }
  const cells = occupiedCells(car.id);
  if (cells.has(`${nextX},${nextY}`) || cells.has(`${tailX},${tailY}`)) return;
  car.x = nextX;
  car.y = nextY;
  addMove();
  drawCars();
  checkRushWin(false);
}

function checkRushWin(manual) {
  const red = state.rushCars.find((car) => car.id === "R");
  const ready = red.y === 2 && red.x + red.len - 1 === 5;
  setStatus(ready ? "出口就在前方" : manual ? "还没到出口" : "继续移动");
}

function winRush() {
  setStatus("通关成功");
  showWin(`通关大师完成，共移动 ${state.moves} 步。`);
}

function renderSlide(shuffle = false) {
  const solved = Array.from({ length: 8 }, (_, index) => index + 1).concat(0);
  state.slideTiles = shuffle ? shuffleSlide(solved, 44 + state.slideLevel * 5) : solved;
  drawSlide();
  setStatus(`第 ${state.slideLevel + 1} 局`);
}

function shuffleSlide(tiles, times) {
  const current = [...tiles];
  for (let i = 0; i < times; i += 1) {
    const empty = current.indexOf(0);
    const moves = slideNeighbors(empty);
    const pick = moves[Math.floor(Math.random() * moves.length)];
    [current[empty], current[pick]] = [current[pick], current[empty]];
  }
  return current;
}

function slideNeighbors(index) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  return [
    row > 0 ? index - 3 : null,
    row < 2 ? index + 3 : null,
    col > 0 ? index - 1 : null,
    col < 2 ? index + 1 : null,
  ].filter((value) => value !== null);
}

function drawSlide() {
  boardWrap.innerHTML = '<div class="slide-stage"><div class="slide-board" id="slideBoard"></div></div>';
  const board = document.getElementById("slideBoard");
  state.slideTiles.forEach((value, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `tile ${value === 0 ? "empty" : ""}`;
    if (value) {
      const card = tarotCards[value - 1];
      tile.dataset.symbol = card[0];
      tile.innerHTML = `<span class="tile-number">${value}</span><span class="tile-name">${card[1]}</span>`;
    }
    tile.addEventListener("click", () => moveSlide(index));
    board.appendChild(tile);
  });
}

function moveSlide(index) {
  const empty = state.slideTiles.indexOf(0);
  if (!slideNeighbors(empty).includes(index)) return;
  [state.slideTiles[empty], state.slideTiles[index]] = [state.slideTiles[index], state.slideTiles[empty]];
  addMove();
  drawSlide();
  checkSlideWin();
}

function checkSlideWin() {
  const solved = state.slideTiles.every((value, index) => value === (index === 8 ? 0 : index + 1));
  setStatus(solved ? "塔罗拼图完成" : "继续拼");
  if (solved) showWin(`塔罗9宫格拼好了，共移动 ${state.moves} 步。`);
}

function renderWater() {
  const levels = [
    [
      ["c-green", "c-lime", "c-pink", "c-green"],
      ["c-pink", "c-purple", "c-green", "c-red"],
      ["c-lime", "c-gray", "c-purple", "c-pink"],
      ["c-blue", "c-purple", "c-gray", "c-green"],
      ["c-red", "c-purple", "c-lime", "c-purple"],
      ["c-purple", "c-green", "c-lime", "c-gray"],
      [],
      ["c-blue", "c-green", "c-gray"],
      ["c-purple", "c-red", "c-red"],
      ["c-red", "c-lime"],
      ["c-pink", "c-gray", "c-purple"],
      ["c-blue", "c-lime", "c-purple"],
      ["c-pink", "c-purple"],
      ["c-green", "c-blue", "c-green"],
      ["c-gray", "c-green"],
      ["c-purple", "c-gray", "c-blue"],
      ["c-lime", "c-blue"],
      [],
    ],
    [
      ["c-red", "c-blue", "c-green", "c-lime"],
      ["c-lime", "c-green", "c-blue", "c-red"],
      ["c-purple", "c-gray", "c-pink", "c-blue"],
      ["c-blue", "c-red", "c-lime", "c-green"],
      ["c-pink", "c-purple", "c-gray", "c-red"],
      ["c-gray", "c-lime", "c-purple", "c-pink"],
      [],
      [],
    ],
  ];
  state.tubes = levels[state.waterLevel % levels.length].map((tube) => [...tube]);
  drawWater();
  setStatus(`第 ${(state.waterLevel % levels.length) + 1} 关`);
}

function drawWater() {
  boardWrap.innerHTML = `
    <div class="water-scene">
      <div class="water-top"><span>‹</span><span class="water-level-pill">关卡${(state.waterLevel % 2) + 1}</span><span class="water-gear">⚙</span></div>
      <div class="water-area" id="waterArea"></div>
      <div class="water-tools"><button class="water-tool" type="button">↝ 1</button><button class="water-tool" type="button">↶ +5</button><button class="water-tool" type="button">试管 +1</button></div>
    </div>`;
  const area = document.getElementById("waterArea");
  state.tubes.forEach((tube, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tube ${state.selectedTube === index ? "selected" : ""}`;
    button.setAttribute("aria-label", `瓶子 ${index + 1}`);
    tube.forEach((color) => {
      const water = document.createElement("span");
      water.className = `water ${color}`;
      button.appendChild(water);
    });
    button.addEventListener("click", () => selectTube(index));
    area.appendChild(button);
  });
}

function selectTube(index) {
  if (state.selectedTube === null) {
    if (state.tubes[index].length) state.selectedTube = index;
    drawWater();
    return;
  }
  if (state.selectedTube === index) {
    state.selectedTube = null;
    drawWater();
    return;
  }
  pourWater(state.selectedTube, index);
  state.selectedTube = null;
  drawWater();
  checkWaterWin();
}

function pourWater(from, to) {
  const source = state.tubes[from];
  const target = state.tubes[to];
  if (!source.length || target.length >= 4) return;
  const color = source[source.length - 1];
  if (target.length && target[target.length - 1] !== color) return;
  let moved = 0;
  while (source[source.length - 1] === color && target.length < 4) {
    target.push(source.pop());
    moved += 1;
  }
  if (moved) addMove();
}

function checkWaterWin() {
  const solved = state.tubes.every((tube) => tube.length === 0 || (tube.length === 4 && tube.every((color) => color === tube[0])));
  setStatus(solved ? "倒水完成" : "继续倒");
  if (solved) showWin(`倒水解谜完成，共操作 ${state.moves} 次。`);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => switchGame(tab.dataset.game));
});

newGameBtn.addEventListener("click", newCurrent);
resetBtn.addEventListener("click", resetCurrent);
hintBtn.addEventListener("click", runHintOrCheck);
winCloseBtn.addEventListener("click", hideWin);

window.addEventListener("keydown", (event) => {
  if (state.current === "rush") {
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (map[event.key]) {
      event.preventDefault();
      moveSelectedCar(map[event.key]);
    }
  }
});

window.addEventListener("resize", () => {
  if (state.current === "rush") drawCars();
});

switchGame("sudoku");
