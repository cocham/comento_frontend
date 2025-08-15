// DOM 렌더링 + 이벤트 바인딩
export function renderBoard(container, game, { onReveal, onFlag, onChord }) {
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${game.cols}, 1fr)`;

  for (let r = 0; r < game.rows; r++){
    for (let c = 0; c < game.cols; c++){
      const i = r * game.cols + c;
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.setAttribute("data-r", r);
      cell.setAttribute("data-c", c);
      cell.setAttribute("aria-label", "cell");
      cell.type = "button";
      container.appendChild(cell);
    }
  }

  // 공용 핸들러
  const getRC = (el) => [Number(el.getAttribute("data-r")), Number(el.getAttribute("data-c"))];

  // 좌클릭: 오픈 (또는 chord)
  container.addEventListener("click", (e) => {
    const target = e.target.closest(".cell");
    if (!target || game.state !== "playing") return;
    const [r,c] = getRC(target);
    if (target.classList.contains("open")) {
      onChord(r,c);
    } else {
      onReveal(r,c);
    }
  });

  // 우클릭: 깃발
  container.addEventListener("contextmenu", (e) => {
    const target = e.target.closest(".cell");
    if (!target) return;
    e.preventDefault();             

    if (game.state !== "playing") return; 
    const [r,c] = getRC(target);
    onFlag(r,c);
});

}

export function paint(container, game){
  // 모든 셀 반영
  for (const el of container.querySelectorAll(".cell")){
    const r = Number(el.getAttribute("data-r"));
    const c = Number(el.getAttribute("data-c"));
    const cell = game.board[r * game.cols + c];

    el.classList.toggle("open", cell.revealed);
    el.classList.toggle("flag", cell.flagged);
    el.classList.toggle("mine", cell.mine);
    el.disabled = (game.state === "lose" || game.state === "win");

    if (cell.revealed){
      if (!cell.mine && cell.adj > 0){
        el.textContent = String(cell.adj);
        el.classList.add(`num-${cell.adj}`);
      } else if (!cell.mine){
        el.textContent = "";
      } else {
        el.textContent = "💣";
      }
    } else {
      el.textContent = cell.flagged ? "🚩" : "";
    }
  }
}

export function setStatus({ flagsLeftEl, timeLeftEl, stateEl }, { flagsLeft, timeLeft, state }){
  flagsLeftEl.textContent = flagsLeft;
  timeLeftEl.textContent = timeLeft;
  stateEl.textContent = state;
}
