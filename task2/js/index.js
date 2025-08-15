import { Game } from "./game.js";
import { CountdownTimer } from "./timer.js";
import { renderBoard, paint, setStatus } from "./ui.js";

const els = {
  board: document.getElementById("board"),
  rows: document.getElementById("rows"),
  cols: document.getElementById("cols"),
  mines: document.getElementById("mines"),
  limit: document.getElementById("limit"),
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resumeBtn: document.getElementById("resumeBtn"),
  restartBtn: document.getElementById("restartBtn"),
  flagsLeft: document.getElementById("flagsLeft"),
  timeLeft: document.getElementById("timeLeft"),
  gameState: document.getElementById("gameState"),
};

let game = null;
let timer = null;

function clampInputs(){
  const r = Math.max(5, Math.min(40, Number(els.rows.value || 12)));
  const c = Math.max(5, Math.min(40, Number(els.cols.value || 12)));
  const maxMines = r * c - 1;
  const m = Math.max(1, Math.min(maxMines, Number(els.mines.value || 20)));
  const lim = Math.max(10, Math.min(999, Number(els.limit.value || 180)));

  els.rows.value = r; els.cols.value = c; els.mines.value = m; els.limit.value = lim;
  return { r, c, m, lim };
}

function refreshStatus(){
  const flagsLeft = Math.max(0, (game?.totalMines || 0) - (game?.flags || 0));
  const stateLabel = game?.state === "playing" ? "진행중"
                    : game?.state === "paused" ? "일시정지"
                    : game?.state === "win" ? "승리!"
                    : game?.state === "lose" ? "패배"
                    : "대기";
  setStatus(
    { flagsLeftEl: els.flagsLeft, timeLeftEl: els.timeLeft, stateEl: els.gameState },
    { flagsLeft, timeLeft: timer ? Math.ceil(timer.left) : 0, state: stateLabel }
  );
}

function bindBoardHandlers(){
  renderBoard(els.board, game, {
    onReveal: (r,c) => {
      const res = game.reveal(r,c);
      if (res.changed){
        paint(els.board, game);
        if (game.state === "lose") {
          timer.stop();
        } else if (game.state === "win") {
          timer.stop();
        }
        refreshStatus();
      }
    },
    onFlag: (r,c) => {
      const res = game.toggleFlag(r,c);
      if (res.changed) {
        paint(els.board, game);
        refreshStatus();
      }
    },
    onChord: (r,c) => {
      const res = game.chord(r,c);
      if (res.changed){
        paint(els.board, game);
        if (res.exploded) timer.stop();
        if (game.state === "win") timer.stop();
        refreshStatus();
      }
    }
  });
  paint(els.board, game);
}

function startGame(){
  const { r, c, m, lim } = clampInputs();
  game = new Game(r, c, m);
  game.start();

  if (timer) timer.stop();
  timer = new CountdownTimer(lim, {
    onTick: () => refreshStatus(),
    onEnd: () => {
      // 시간 종료 → 패배 처리
      if (game.state === "playing" || game.state === "paused") {
        game.state = "lose";
        paint(els.board, game);
        refreshStatus();
      }
    }
  });

  bindBoardHandlers();
  refreshStatus();
  timer.start();
}

function pauseGame(){
  if (!game || !timer) return;
  if (game.state === "playing"){
    game.pause();
    timer.pause();
    refreshStatus();
  }
}

function resumeGame(){
  if (!game || !timer) return;
  if (game.state === "paused"){
    game.resume();
    timer.resume();
    refreshStatus();
  }
}

function resetGame(){
  if (timer) timer.stop();
  const { r, c, m } = clampInputs();
  game = new Game(r, c, m);
  bindBoardHandlers();
  refreshStatus();
}

els.startBtn.addEventListener("click", startGame);
els.pauseBtn.addEventListener("click", pauseGame);
els.resumeBtn.addEventListener("click", resumeGame);
els.restartBtn.addEventListener("click", resetGame);

// 입력값이 변경시 지뢰 최대치 자동 보정
["rows","cols"].forEach(id => {
  els[id].addEventListener("input", () => {
    const { r, c } = clampInputs();
    const maxMines = r * c - 1;
    if (Number(els.mines.value) > maxMines) els.mines.value = maxMines;
  });
});

// 초기 상태
resetGame();
