// 핵심 게임 로직 (보드/판정/플러드필)
export class Game {
  constructor(rows, cols, mines) {
    this.rows = rows;
    this.cols = cols;
    this.totalCells = rows * cols;
    this.totalMines = Math.min(mines, this.totalCells - 1); // 전부 지뢰 방지
    this.flags = 0;
    this.revealed = 0;
    this.firstRevealDone = false;
    this.state = "idle"; // idle | playing | win | lose | paused

    this.board = this._createEmptyBoard();
  }

  _idx(r, c) { return r * this.cols + c; }
  _in(r, c){ return r >= 0 && c >= 0 && r < this.rows && c < this.cols; }

  _createEmptyBoard(){
    // 각 칸: { mine:false, adj:0, revealed:false, flagged:false }
    return Array.from({ length: this.totalCells }, () => ({
      mine: false, adj: 0, revealed: false, flagged: false
    }));
  }

  _neighbors(r, c){
    const dirs = [-1, 0, 1];
    const out = [];
    for (const dr of dirs){
      for (const dc of dirs){
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (this._in(nr, nc)) out.push([nr, nc]);
      }
    }
    return out;
  }

  _placeMines(excludeR, excludeC){
    // 첫 클릭 칸 <-> 이웃칸들 안전 지대 처리
    const safe = new Set();
    safe.add(this._idx(excludeR, excludeC));
    for (const [nr, nc] of this._neighbors(excludeR, excludeC)){
      safe.add(this._idx(nr, nc));
    }

    let count = 0;
    while (count < this.totalMines){
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      const i = this._idx(r,c);
      if (safe.has(i)) continue;
      if (!this.board[i].mine){
        this.board[i].mine = true;
        count++;
      }
    }

    // adj 갱신
    for (let r = 0; r < this.rows; r++){
      for (let c = 0; c < this.cols; c++){
        const i = this._idx(r,c);
        if (this.board[i].mine) continue;
        let adj = 0;
        for (const [nr, nc] of this._neighbors(r,c)){
          if (this.board[this._idx(nr,nc)].mine) adj++;
        }
        this.board[i].adj = adj;
      }
    }
  }

  start(){
    this.state = "playing";
  }

  pause(){ if (this.state === "playing") this.state = "paused"; }
  resume(){ if (this.state === "paused") this.state = "playing"; }

  toggleFlag(r, c){
    if (this.state !== "playing") return { changed:false };
    const i = this._idx(r,c);
    const cell = this.board[i];
    if (cell.revealed) return { changed:false };

    // 남은 깃발 수 체크
    const flagsLeft = this.totalMines - this.flags;
    if (!cell.flagged && flagsLeft <= 0) {
        return { changed:false }; // 깃발 다 쓰면 새로 설치 불가
    }

    cell.flagged = !cell.flagged;
    this.flags += cell.flagged ? 1 : -1;
    return { changed:true, cell };
  }

  reveal(r, c){
    if (this.state !== "playing") return { changed:false };
    const i = this._idx(r,c);
    const cell = this.board[i];
    if (cell.revealed || cell.flagged) return { changed:false };

    if (!this.firstRevealDone){
      this._placeMines(r,c);
      this.firstRevealDone = true;
    }

    // 지뢰면 종료
    if (cell.mine){
      cell.revealed = true;
      this.state = "lose";
      return { changed:true, exploded:true };
    }

    // BFS 플러드필 (adj==0)
    const q = [[r,c]];
    const visited = new Set([i]);
    const opened = [];
    while (q.length){
      const [cr, cc] = q.shift();
      const ci = this._idx(cr,cc);
      const ccRef = this.board[ci];
      if (!ccRef.revealed) {
        ccRef.revealed = true;
        opened.push([cr,cc]);
        this.revealed++;
      }
      if (ccRef.adj === 0){
        for (const [nr, nc] of this._neighbors(cr,cc)){
          const ni = this._idx(nr,nc);
          const nCell = this.board[ni];
          if (!visited.has(ni) && !nCell.revealed && !nCell.flagged && !nCell.mine){
            visited.add(ni);
            q.push([nr,nc]);
          }
        }
      }
    }

    // 승리 체크
    if (this.revealed === this.totalCells - this.totalMines){
      this.state = "win";
    }

    return { changed:true, opened };
  }

  chord(r, c){
    // 이미 열린 숫자칸에서 주변 깃발 수 == adj 이면 주변 오픈
    if (this.state !== "playing") return { changed:false };
    const i = this._idx(r,c);
    const cell = this.board[i];
    if (!cell.revealed || cell.adj === 0) return { changed:false };

    let flagCnt = 0;
    const neighbors = this._neighbors(r,c);
    for (const [nr, nc] of neighbors){
      if (this.board[this._idx(nr,nc)].flagged) flagCnt++;
    }
    if (flagCnt !== cell.adj) return { changed:false };

    let anyExplode = false;
    const openedAll = [];
    for (const [nr, nc] of neighbors){
      const n = this.board[this._idx(nr,nc)];
      if (!n.revealed && !n.flagged){
        if (n.mine){
          n.revealed = true;
          anyExplode = true;
        } else {
          const res = this.reveal(nr, nc);
          if (res.opened) openedAll.push(...res.opened);
        }
      }
    }
    if (anyExplode){
      this.state = "lose";
      return { changed:true, exploded:true };
    }
    if (this.revealed === this.totalCells - this.totalMines){
      this.state = "win";
    }
    return { changed:true, opened: openedAll };
  }
}
