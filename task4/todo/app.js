const TODOS_KEY = 'todo.items.v2';

const $form = document.getElementById('todo-form');
const $title = document.getElementById('todo-title');
const $note = document.getElementById('todo-note');
const $list = document.getElementById('todo-list');
const $count = document.getElementById('todo-count');
const $clearAll = document.getElementById('clear-all');

const $picker = document.getElementById('date-picker');

const store = {
  get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
  set(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
};

function load(){ return store.get(TODOS_KEY, []) }
function save(items){ store.set(TODOS_KEY, items); render() }

/* ---------- 날짜 스피너 ---------- */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const daysInMonth = (year, month /*1-12*/) => new Date(year, month, 0).getDate();

function pad2(n){ return String(n).padStart(2,'0') }
function initPicker(){
  const today = new Date();
  setSpin('year', today.getFullYear());
  setSpin('month', today.getMonth()+1);
  setSpin('day', today.getDate());
  enforceDayRange();
}

function getSpinEl(type){
  return $picker.querySelector(`.spin[data-type="${type}"] .spin-value`);
}
function getSpin(type){
  return parseInt(getSpinEl(type).textContent, 10);
}
function setSpin(type, val){
  const el = getSpinEl(type);
  const range = ranges[type];
  const v = clamp(val, range.min, range.max);
  el.textContent = type === 'year' ? String(v) : pad2(v);
  el.setAttribute('aria-valuenow', String(v));
}

const ranges = {
  year: {min:1900, max:2100},
  month:{min:1, max:12},
  day:  {min:1, max:31}
};

function step(type, delta){
  if(type === 'year'){
    setSpin('year', getSpin('year') + delta);
    enforceDayRange();
  } else if(type === 'month'){
    let m = getSpin('month') + delta;
    let y = getSpin('year');
    if (m > 12){ m = 1; y++; setSpin('year', y); }
    if (m < 1 ){ m = 12; y--; setSpin('year', y); }
    setSpin('month', m);
    enforceDayRange();
  } else {
    // day
    const maxDay = daysInMonth(getSpin('year'), getSpin('month'));
    let d = getSpin('day') + delta;
    if (d > maxDay) d = 1;
    if (d < 1) d = maxDay;
    setSpin('day', d);
  }
}

function enforceDayRange(){
  const maxDay = daysInMonth(getSpin('year'), getSpin('month'));
  const cur = getSpin('day');
  if (cur > maxDay) setSpin('day', maxDay);
  // aria-max 업데이트
  $picker.querySelector('.spin[data-type="day"] .spin-value')
    .setAttribute('aria-valuemax', String(maxDay));
}

// 이벤트 바인딩: 버튼/휠
$picker.addEventListener('click', (e)=>{
  const spin = e.target.closest('.spin');
  if(!spin) return;
  const type = spin.dataset.type;
  if(e.target.classList.contains('up')) step(type, +1);
  if(e.target.classList.contains('down')) step(type, -1);
});

$picker.addEventListener('wheel', (e)=>{
  const valueEl = e.target.closest('.spin-value');
  if(!valueEl) return;
  e.preventDefault(); // 페이지 스크롤 방지
  const type = valueEl.closest('.spin').dataset.type;
  const delta = e.deltaY < 0 ? +1 : -1; // 위로 굴리면 증가
  step(type, delta);
}, {passive:false});


function getSelectedDateStr(){
  const y = getSpin('year');
  const m = getSpin('month');
  const d = getSpin('day');
  return `${y}-${pad2(m)}-${pad2(d)}`; // YYYY-MM-DD
}

/* ---------- 리스트 렌더 ---------- */
function render(){
  const items = load().slice().sort((a, b) => {
    const ad = a.when || '9999-12-31'; // 날짜 없으면 뒤로
    const bd = b.when || '9999-12-31';
    if (ad !== bd) return ad.localeCompare(bd); // 날짜 오름차순
    return (a.createdAt ?? 0) - (b.createdAt ?? 0); // 같은 날이면 생성시각 오름차순
  });

  $list.innerHTML = '';
  $count.textContent = items.length;

  if(items.length === 0){
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = '등록된 일정이 없습니다.';
    $list.appendChild(li);
    return;
  }

  for(const it of items){
    const li = document.createElement('li');
    li.className = 'item';

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = it.title;

    const when = document.createElement('span');
    when.className = 'badge';
    when.textContent = it.when; // YYYY-MM-DD

    meta.append(title, when);
    if(it.note){
      const note = document.createElement('span');
      note.className = 'muted';
      note.textContent = '· ' + it.note;
      meta.append(note);
    }

    const btn = document.createElement('button');
    btn.className = 'btn danger';
    btn.textContent = '삭제';
    btn.addEventListener('click', ()=>{
      save(load().filter(x => x.id !== it.id));
    });

    li.append(meta, btn);
    $list.appendChild(li);
  }
}


function addTodo({title, dateStr, note}){
  const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
  const next = load();
  next.push({ id, title, when: dateStr, note: note?.trim() || '', createdAt: Date.now() });
  save(next);
}

/* ---------- 폼 ---------- */
$form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const t = $title.value.trim();
  if(!t){ alert('제목은 필수입니다.'); return; }
  const dateStr = getSelectedDateStr();
  addTodo({ title: t, dateStr, note: $note.value });
  e.target.reset();
  initPicker(); // 날짜를 오늘로 리셋
});

$clearAll.addEventListener('click', ()=>{
  if(confirm('모든 일정을 삭제할까요?')){
    store.set(TODOS_KEY, []);
    render();
  }
});

/* 초기화 */
initPicker();
render();