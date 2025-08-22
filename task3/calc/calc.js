const MAIN_FS_MAX = 36;   
const MAIN_FS_MIN = 18;  

function fitMainFont(){
  const el = mainEl;
  el.style.fontSize = MAIN_FS_MAX + 'px';
  let size = MAIN_FS_MAX;
  while (el.scrollWidth > el.clientWidth && size > MAIN_FS_MIN){
    size -= 1;
    el.style.fontSize = size + 'px';
  }
}
window.addEventListener('resize', fitMainFont);


(function(){
  const prevEl = document.getElementById('display-prev');
  const mainEl = document.getElementById('display-main');
  const keypad = document.querySelector('.keypad');

  const MAX_DIGITS = 15;
  const PRECISION = 12;

  let current = '0';
  let stored = null;
  let op = null;
  let justEvaluated = false;
  let lastOp = null;
  let lastOperand = null;

  function updateDisplay(){
    mainEl.textContent = current;
    if (op && stored !== null){
      prevEl.textContent = `${formatNumber(stored)} ${opToSymbol(op)}`;
    } else {
      prevEl.textContent = '';
    }
    fitMainFont(); 
  }

  function opToSymbol(o){
    return ({'+':'+','-':'−','*':'×','/':'÷'})[o] || o;
  }

  function formatNumber(valStr){
    const s = String(valStr);
    if (s.length > 20) return s.slice(0,20)+'…';
    return s;
  }

  function inputDigit(d){
    if (justEvaluated){
      current = d;
      justEvaluated = false;
      lastOp = null;
      lastOperand = null;
      updateDisplay();
      return;
    }
    if (current === '0'){
      current = d;
    } else {
      if (current.replace(/[.-]/g,'').length >= MAX_DIGITS) return;
      current += d;
    }
    updateDisplay();
  }

  function inputDecimal(){
    if (justEvaluated){
      current = '0.';
      justEvaluated = false;
      lastOp = null;
      lastOperand = null;
      updateDisplay();
      return;
    }
    if (!current.includes('.')){
      current += '.';
      updateDisplay();
    }
  }

  function setOperator(nextOp){
    if (op && stored !== null && !justEvaluated){
      evaluate();
    }
    stored = parseFloat(current);
    op = nextOp;
    justEvaluated = false;
    current = '0';
    updateDisplay();
  }

  function evaluate(){
    if (op !== null && stored !== null){
      const a = stored;
      const b = parseFloat(current);
      let result;
      switch(op){
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': result = (b === 0) ? '오류' : a / b; break;
      }
      prevEl.textContent = `${formatNumber(String(a))} ${opToSymbol(op)} ${formatNumber(String(b))} =`;
      current = String(roundResult(result));
      lastOp = op;
      lastOperand = b;
      stored = null;
      op = null;
      justEvaluated = true;
      mainEl.textContent = current;
      fitMainFont();
      return;
    }
    if (justEvaluated && lastOp !== null && lastOperand !== null){
      const a = parseFloat(current);
      const b = lastOperand;
      let result;
      switch(lastOp){
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': result = (b === 0) ? '오류' : a / b; break;
      }
      prevEl.textContent = `${formatNumber(String(a))} ${opToSymbol(lastOp)} ${formatNumber(String(b))} =`;
      current = String(roundResult(result));
      mainEl.textContent = current;
      return;
    }
  }

  function roundResult(num){
    if (typeof num !== 'number' || !isFinite(num)) return num;
    const mul = 10 ** PRECISION;
    return Math.round((num + Number.EPSILON) * mul) / mul;
  }

  function clearAll(){
    current = '0';
    stored = null;
    op = null;
    justEvaluated = false;
    lastOp = null;
    lastOperand = null;
    updateDisplay();
  }

  function backspace(){
    if (justEvaluated) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))){
      current = '0';
    } else {
      current = current.slice(0,-1);
    }
    updateDisplay();
  }

  function percent(){
    if (current === '오류') return;
    const cur = parseFloat(current) || 0;
    if (op && stored !== null){
      if (op === '+' || op === '-'){
        current = String(roundResult(stored * (cur/100)));
      } else {
        current = String(roundResult(cur/100));
      }
    } else {
      current = String(roundResult(cur/100));
    }
    updateDisplay();
  }

  function toggleSign(){
    if (current === '오류') return;
    if (current === '0' || current === '0.' || current === '') return;
    if (current.startsWith('-')){
      current = current.slice(1);
    } else {
      current = '-'+current;
    }
    updateDisplay();
  }

  keypad.addEventListener('click', (e) => {
    const btn = e.target.closest('.key');
    if (!btn) return;
    if (btn.dataset.digit) return inputDigit(btn.dataset.digit);
    if (btn.dataset.action === 'decimal') return inputDecimal();
    if (btn.dataset.action === 'equals') return evaluate();
    if (btn.dataset.action === 'clear') return clearAll();
    if (btn.dataset.action === 'backspace') return backspace();
    if (btn.dataset.action === 'percent') return percent();
    if (btn.dataset.action === 'toggle-sign') return toggleSign();
    if (btn.dataset.op){
      const map = {add:'+',subtract:'-',multiply:'*',divide:'/'};
      return setOperator(map[btn.dataset.op]);
    }
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    const btn = document.querySelector(`.key[data-key="${CSS.escape(k)}"]`) || document.querySelector(`.key[data-key="${k === 'Enter' ? 'Enter' : k}"]`);
    if (btn){
      btn.classList.add('is-pressed');
      setTimeout(()=>btn.classList.remove('is-pressed'), 80);
    }
    if (/\d/.test(k)) return inputDigit(k);
    if (k === '.') return inputDecimal();
    if (k === 'Enter' || k === '='){ e.preventDefault(); return evaluate(); }
    if (k === 'Escape' || k.toLowerCase() === 'c') return clearAll();
    if (k === 'Backspace') return backspace();
    if (k === '%') return percent();
    if (k === 'F9' || k.toLowerCase() === 'n') return toggleSign();
    if (['+','-','*','/'].includes(k)) return setOperator(k);
  }, {capture:true});

  updateDisplay();
})();
