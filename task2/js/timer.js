// 카운트다운 타이머 (start/pause/resume/stop)
export class CountdownTimer {
  constructor(seconds, { onTick, onEnd } = {}) {
    this.total = seconds;
    this.left = seconds;
    this.onTick = onTick || (()=>{});
    this.onEnd = onEnd || (()=>{});
    this._id = null;
    this._last = null;
    this._running = false;
  }

  start(){
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    this._loop();
  }

  _loop = () => {
    if (!this._running) return;
    const now = performance.now();
    const dt = (now - this._last) / 1000;
    this._last = now;

    this.left = Math.max(0, this.left - dt);
    this.onTick(Math.ceil(this.left));

    if (this.left <= 0){
      this.stop();
      this.onEnd();
      return;
    }
    this._id = requestAnimationFrame(this._loop);
  }

  pause(){
    if (!this._running) return;
    this._running = false;
    if (this._id) cancelAnimationFrame(this._id);
    this._id = null;
  }

  resume(){
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    this._loop();
  }

  stop(){
    this._running = false;
    if (this._id) cancelAnimationFrame(this._id);
    this._id = null;
  }

  reset(seconds){
    this.stop();
    this.total = seconds;
    this.left = seconds;
  }
}
