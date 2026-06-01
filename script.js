const DIFFICULTIES = {
  easy: { label: "简单版", count: 500, blanks: 36 },
  normal: { label: "普通版", count: 500, blanks: 46 },
  master: { label: "大师版", count: 500, blanks: 56 },
};

const ZODIACS = [
  ["白羊座", "♈"], ["金牛座", "♉"], ["双子座", "♊"], ["巨蟹座", "♋"],
  ["狮子座", "♌"], ["处女座", "♍"], ["天秤座", "♎"], ["天蝎座", "♏"],
  ["射手座", "♐"], ["摩羯座", "♑"], ["水瓶座", "♒"], ["双鱼座", "♓"],
];

const PAGE_SIZE = 50;
const STORAGE_KEY = "zodiac-sudoku-progress-v1";
const BASE_GRID = "123456789456789123789123456234567891567891234891234567345678912678912345912345678";

const els = {
  totalSolved: document.getElementById("totalSolved"),
  masterSolved: document.getElementById("masterSolved"),
  resetProgressBtn: document.getElementById("resetProgressBtn"),
  libraryView: document.getElementById("libraryView"),
  zodiacView: document.getElementById("zodiacView"),
  gameView: document.getElementById("gameView"),
  libraryTitle: document.getElementById("libraryTitle"),
  easyCount: document.getElementById("easyCount"),
  normalCount: document.getElementById("normalCount"),
  masterCount: document.getElementById("masterCount"),
  puzzleList: document.getElementById("puzzleList"),
  pageLabel: document.getElementById("pageLabel"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  zodiacUnlockText: document.getElementById("zodiacUnlockText"),
  zodiacList: document.getElementById("zodiacList"),
  zodiacDetail: document.getElementById("zodiacDetail"),
  backBtn: document.getElementById("backBtn"),
  gameTitle: document.getElementById("gameTitle"),
  gameMeta: document.getElementById("gameMeta"),
  gameNote: document.getElementById("gameNote"),
  hintBtn: document.getElementById("hintBtn"),
  eraseBtn: document.getElementById("eraseBtn"),
  restartBtn: document.getElementById("restartBtn"),
  mistakeText: document.getElementById("mistakeText"),
  statusText: document.getElementById("statusText"),
  sudokuBoard: document.getElementById("sudokuBoard"),
  numberPad: document.getElementById("numberPad"),
  winModal: document.getElementById("winModal"),
  winTitle: document.getElementById("winTitle"),
  winText: document.getElementById("winText"),
  nextPuzzleBtn: document.getElementById("nextPuzzleBtn"),
  winCloseBtn: document.getElementById("winCloseBtn"),
};

const state = {
  view: "library",
  difficulty: "easy",
  page: 0,
  selectedZodiac: 0,
  current: null,
  puzzle: null,
  values: [],
  selectedCell: null,
  moves: 0,
  mistakes: 0,
  seconds: 0,
  timer: null,
  progress: loadProgress(),
};

function loadProgress() {
  const defaults = {
    completed: { easy: [], normal: [], master: [] },
    zodiacLocks: Array.from({ length: 12 }, () => []),
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      completed: {
        easy: Array.isArray(parsed?.completed?.easy) ? parsed.completed.easy : [],
        normal: Array.isArray(parsed?.completed?.normal) ? parsed.completed.normal : [],
        master: Array.isArray(parsed?.completed?.master) ? parsed.completed.master : [],
      },
      zodiacLocks: Array.from({ length: 12 }, (_, index) => Array.isArray(parsed?.zodiacLocks?.[index]) ? parsed.zodiacLocks[index] : []),
    };
  } catch {
    return defaults;
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function shuffle(list, random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePuzzle(difficulty, index) {
  const diffIndex = Object.keys(DIFFICULTIES).indexOf(difficulty);
  const random = seededRandom(20260601 + diffIndex * 100000 + index * 97);
  const bands = shuffle([0, 1, 2], random);
  const stacks = shuffle([0, 1, 2], random);
  const rows = bands.flatMap((band) => shuffle([0, 1, 2], random).map((row) => band * 3 + row));
  const cols = stacks.flatMap((stack) => shuffle([0, 1, 2], random).map((col) => stack * 3 + col));
  const digits = shuffle(["1", "2", "3", "4", "5", "6", "7", "8", "9"], random);
  let solution = "";
  for (const row of rows) {
    for (const col of cols) {
      solution += digits[Number(BASE_GRID[row * 9 + col]) - 1];
    }
  }
  const puzzle = solution.split("");
  const cells = shuffle(Array.from({ length: 81 }, (_, cell) => cell), random);
  cells.slice(0, DIFFICULTIES[difficulty].blanks).forEach((cell) => {
    puzzle[cell] = "0";
  });
  return { puzzle: puzzle.join(""), solution };
}

function zodiacChallenge(zodiacIndex, lockIndex) {
  const random = seededRandom(8800 + zodiacIndex * 101 + lockIndex * 17);
  const choices = ["easy", "normal", "master"];
  const difficulty = choices[Math.floor(random() * choices.length)];
  const index = Math.floor(random() * DIFFICULTIES[difficulty].count);
  return { difficulty, index };
}

function completedSet(difficulty) {
  return new Set(state.progress.completed[difficulty]);
}

function isCompleted(difficulty, index) {
  return state.progress.completed[difficulty].includes(index);
}

function markCompleted(difficulty, index) {
  if (!isCompleted(difficulty, index)) {
    state.progress.completed[difficulty].push(index);
    state.progress.completed[difficulty].sort((a, b) => a - b);
  }
}

function masterSolvedCount() {
  return state.progress.completed.master.length;
}

function totalSolvedCount() {
  return Object.values(state.progress.completed).reduce((sum, list) => sum + list.length, 0);
}

function zodiacUnlocked() {
  return masterSolvedCount() >= 10;
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".nav-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  els.libraryView.classList.toggle("active", view === "library");
  els.zodiacView.classList.toggle("active", view === "zodiac");
  els.gameView.hidden = true;
  stopTimer();
  render();
}

function render() {
  renderProgress();
  renderLibrary();
  renderZodiac();
}

function renderProgress() {
  els.totalSolved.textContent = `已通关 ${totalSolvedCount()}`;
  els.masterSolved.textContent = `大师 ${masterSolvedCount()} / 10 解锁星座`;
  els.easyCount.textContent = `已通关 ${state.progress.completed.easy.length} / 500`;
  els.normalCount.textContent = `已通关 ${state.progress.completed.normal.length} / 500`;
  els.masterCount.textContent = `已通关 ${state.progress.completed.master.length} / 500`;
  els.zodiacUnlockText.textContent = zodiacUnlocked() ? "星座玩法已解锁" : `还需 ${10 - masterSolvedCount()} 个大师版通关`;
}

function renderLibrary() {
  if (state.view !== "library") return;
  document.querySelectorAll(".mode-card").forEach((card) => card.classList.toggle("active", card.dataset.difficulty === state.difficulty));
  els.libraryTitle.textContent = `${DIFFICULTIES[state.difficulty].label}题库`;
  const maxPage = Math.ceil(DIFFICULTIES[state.difficulty].count / PAGE_SIZE);
  els.pageLabel.textContent = `${state.page + 1} / ${maxPage}`;
  els.prevPageBtn.disabled = state.page === 0;
  els.nextPageBtn.disabled = state.page === maxPage - 1;
  const done = completedSet(state.difficulty);
  els.puzzleList.innerHTML = "";
  const start = state.page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, DIFFICULTIES[state.difficulty].count);
  for (let index = start; index < end; index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `puzzle-btn ${done.has(index) ? "done" : ""}`;
    button.innerHTML = `<span>${index + 1}</span><small>${done.has(index) ? "已通关" : "未完成"}</small>`;
    button.addEventListener("click", () => startPuzzle({ type: "library", difficulty: state.difficulty, index }));
    els.puzzleList.appendChild(button);
  }
}

function renderZodiac() {
  if (state.view !== "zodiac") return;
  els.zodiacList.innerHTML = "";
  ZODIACS.forEach(([name, symbol], index) => {
    const done = state.progress.zodiacLocks[index].length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `zodiac-tab ${state.selectedZodiac === index ? "active" : ""}`;
    button.innerHTML = `<span>${symbol} ${name}</span><small>${done}/9</small>`;
    button.addEventListener("click", () => {
      state.selectedZodiac = index;
      renderZodiac();
    });
    els.zodiacList.appendChild(button);
  });

  if (!zodiacUnlocked()) {
    els.zodiacDetail.className = "zodiac-detail locked";
    els.zodiacDetail.innerHTML = `<div><div class="zodiac-symbol">锁</div><h2>星座玩法未解锁</h2><p>先通关 10 个大师版数独，就能开启十二星座矩阵。</p></div>`;
    return;
  }

  const [name, symbol] = ZODIACS[state.selectedZodiac];
  const done = new Set(state.progress.zodiacLocks[state.selectedZodiac]);
  els.zodiacDetail.className = "zodiac-detail";
  if (done.size === 9) {
    els.zodiacDetail.innerHTML = `
      <div class="constellation-art">
        <div>
          <div class="zodiac-symbol">${symbol}</div>
          <h2>${name}图案已解锁</h2>
          <p>这个 3x3 星座矩阵已经全部点亮。</p>
        </div>
      </div>`;
    return;
  }

  els.zodiacDetail.innerHTML = `
    <div class="constellation-head">
      <div><h2>${symbol} ${name}</h2><span>完成 9 个锁，解锁图案</span></div>
      <strong>${done.size}/9</strong>
    </div>
    <div class="lock-grid" id="lockGrid"></div>`;
  const grid = document.getElementById("lockGrid");
  for (let lockIndex = 0; lockIndex < 9; lockIndex += 1) {
    const challenge = zodiacChallenge(state.selectedZodiac, lockIndex);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lock-cell ${done.has(lockIndex) ? "done" : ""}`;
    button.innerHTML = `<span>${done.has(lockIndex) ? "已解锁" : "锁 " + (lockIndex + 1)}</span><small>${DIFFICULTIES[challenge.difficulty].label} · 第${challenge.index + 1}题</small>`;
    if (!done.has(lockIndex)) {
      button.addEventListener("click", () => startPuzzle({
        type: "zodiac",
        zodiacIndex: state.selectedZodiac,
        lockIndex,
        difficulty: challenge.difficulty,
        index: challenge.index,
      }));
    }
    grid.appendChild(button);
  }
}

function startPuzzle(context) {
  state.current = context;
  state.puzzle = makePuzzle(context.difficulty, context.index);
  state.values = state.puzzle.puzzle.split("");
  state.selectedCell = null;
  state.moves = 0;
  state.mistakes = 0;
  state.seconds = 0;
  els.libraryView.classList.remove("active");
  els.zodiacView.classList.remove("active");
  els.gameView.hidden = false;
  els.winModal.hidden = true;
  renderGame();
  startTimer();
}

function restartPuzzle() {
  if (state.current) startPuzzle(state.current);
}

function renderGame() {
  const label = DIFFICULTIES[state.current.difficulty].label;
  els.gameTitle.textContent = `${label} 第${state.current.index + 1}题`;
  els.gameNote.textContent = state.current.type === "zodiac"
    ? `星座矩阵：${ZODIACS[state.current.zodiacIndex][0]} 第 ${state.current.lockIndex + 1} 个锁。`
    : "点击空格后，用下方数字键填入答案。";
  updateGameMeta();
  els.mistakeText.textContent = `错误：${state.mistakes} / 3`;
  els.statusText.textContent = "继续思考";
  els.sudokuBoard.innerHTML = "";
  state.values.forEach((value, index) => {
    const input = document.createElement("input");
    input.className = "sudoku-cell";
    input.maxLength = 1;
    input.inputMode = "numeric";
    input.dataset.index = String(index);
    if (state.puzzle.puzzle[index] !== "0") {
      input.value = value;
      input.disabled = true;
      input.classList.add("given");
    } else {
      input.value = value === "0" ? "" : value;
      input.addEventListener("focus", () => selectCell(index));
      input.addEventListener("input", () => enterNumber(input.value, index));
    }
    els.sudokuBoard.appendChild(input);
  });
  renderNumberPad();
}

function renderNumberPad() {
  els.numberPad.innerHTML = "";
  for (let number = 1; number <= 9; number += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "num-btn";
    button.textContent = number;
    button.addEventListener("click", () => enterNumber(String(number)));
    els.numberPad.appendChild(button);
  }
}

function selectCell(index) {
  state.selectedCell = index;
  const row = Math.floor(index / 9);
  const col = index % 9;
  document.querySelectorAll(".sudoku-cell").forEach((cell) => {
    const other = Number(cell.dataset.index);
    const otherRow = Math.floor(other / 9);
    const otherCol = other % 9;
    const sameBox = Math.floor(row / 3) === Math.floor(otherRow / 3) && Math.floor(col / 3) === Math.floor(otherCol / 3);
    cell.classList.toggle("selected", other === index);
    cell.classList.toggle("related", other !== index && (row === otherRow || col === otherCol || sameBox));
  });
}

function enterNumber(raw, forcedIndex) {
  const index = forcedIndex ?? state.selectedCell;
  if (index === null || index === undefined) return;
  const input = document.querySelector(`[data-index="${index}"]`);
  if (!input || input.disabled) return;
  const value = String(raw).replace(/[^1-9]/g, "").slice(0, 1);
  input.value = value;
  state.values[index] = value || "0";
  state.moves += 1;
  updateGameMeta();
  markErrors();
  if (value && value !== state.puzzle.solution[index]) {
    state.mistakes = Math.min(3, state.mistakes + 1);
    els.mistakeText.textContent = `错误：${state.mistakes} / 3`;
    if (state.mistakes >= 3) els.statusText.textContent = "错误已达上限，可以继续练习或重开。";
  }
  checkWin();
}

function eraseCell() {
  if (state.selectedCell === null) return;
  const input = document.querySelector(`[data-index="${state.selectedCell}"]`);
  if (!input || input.disabled) return;
  input.value = "";
  state.values[state.selectedCell] = "0";
  state.moves += 1;
  updateGameMeta();
  markErrors();
}

function hintCell() {
  const index = state.values.findIndex((value, cell) => value === "0" || value !== state.puzzle.solution[cell]);
  if (index === -1) return;
  state.values[index] = state.puzzle.solution[index];
  const input = document.querySelector(`[data-index="${index}"]`);
  input.value = state.puzzle.solution[index];
  input.classList.remove("invalid");
  state.moves += 1;
  updateGameMeta();
  selectCell(index);
  checkWin();
}

function markErrors() {
  document.querySelectorAll(".sudoku-cell").forEach((cell) => {
    const index = Number(cell.dataset.index);
    const value = state.values[index];
    cell.classList.toggle("invalid", value !== "0" && value !== state.puzzle.solution[index]);
  });
}

function checkWin() {
  const solved = state.values.join("") === state.puzzle.solution;
  els.statusText.textContent = solved ? "通关成功" : "继续思考";
  if (!solved) return;
  stopTimer();
  markCompleted(state.current.difficulty, state.current.index);
  if (state.current.type === "zodiac") {
    const locks = state.progress.zodiacLocks[state.current.zodiacIndex];
    if (!locks.includes(state.current.lockIndex)) {
      locks.push(state.current.lockIndex);
      locks.sort((a, b) => a - b);
    }
  }
  saveProgress();
  renderProgress();
  const extra = state.current.type === "zodiac"
    ? `${ZODIACS[state.current.zodiacIndex][0]}第 ${state.current.lockIndex + 1} 个锁已解开。`
    : `${DIFFICULTIES[state.current.difficulty].label}第 ${state.current.index + 1} 题已记录。`;
  showWin(`用时 ${formatTime(state.seconds)}，步数 ${state.moves}。${extra}`);
}

function showWin(text) {
  els.winText.textContent = text;
  els.winModal.hidden = false;
}

function closeWinToList() {
  els.winModal.hidden = true;
  els.gameView.hidden = true;
  if (state.current?.type === "zodiac") {
    switchView("zodiac");
  } else {
    switchView("library");
  }
}

function nextPuzzle() {
  els.winModal.hidden = true;
  if (!state.current) return;
  if (state.current.type === "zodiac") {
    const nextLock = state.progress.zodiacLocks[state.current.zodiacIndex].length;
    if (nextLock < 9) {
      const challenge = zodiacChallenge(state.current.zodiacIndex, nextLock);
      startPuzzle({ type: "zodiac", zodiacIndex: state.current.zodiacIndex, lockIndex: nextLock, ...challenge });
      return;
    }
    closeWinToList();
    return;
  }
  const nextIndex = (state.current.index + 1) % DIFFICULTIES[state.current.difficulty].count;
  startPuzzle({ type: "library", difficulty: state.current.difficulty, index: nextIndex });
}

function updateGameMeta() {
  els.gameMeta.textContent = `步数 ${state.moves} · 用时 ${formatTime(state.seconds)}`;
}

function startTimer() {
  stopTimer();
  state.timer = setInterval(() => {
    state.seconds += 1;
    updateGameMeta();
  }, 1000);
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.view));
});

document.querySelectorAll(".mode-card").forEach((card) => {
  card.addEventListener("click", () => {
    state.difficulty = card.dataset.difficulty;
    state.page = 0;
    renderLibrary();
  });
});

els.prevPageBtn.addEventListener("click", () => {
  state.page = Math.max(0, state.page - 1);
  renderLibrary();
});

els.nextPageBtn.addEventListener("click", () => {
  const maxPage = Math.ceil(DIFFICULTIES[state.difficulty].count / PAGE_SIZE) - 1;
  state.page = Math.min(maxPage, state.page + 1);
  renderLibrary();
});

els.backBtn.addEventListener("click", () => {
  stopTimer();
  els.gameView.hidden = true;
  switchView(state.current?.type === "zodiac" ? "zodiac" : "library");
});

els.hintBtn.addEventListener("click", hintCell);
els.eraseBtn.addEventListener("click", eraseCell);
els.restartBtn.addEventListener("click", restartPuzzle);
els.winCloseBtn.addEventListener("click", closeWinToList);
els.nextPuzzleBtn.addEventListener("click", nextPuzzle);

els.resetProgressBtn.addEventListener("click", () => {
  if (!confirm("确定清空所有通关和星座进度吗？")) return;
  localStorage.removeItem(STORAGE_KEY);
  state.progress = loadProgress();
  render();
});

render();
