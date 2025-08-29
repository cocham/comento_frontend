// 임시 아이디 DB(중복 체크용)
const EXISTING_IDS = ['admin', 'guest', 'testuser'];

const $form = document.getElementById('signup-form');
const $idInput = document.getElementById('userid');
const $idBtn = document.getElementById('check-id-btn');
const $idMsg = document.getElementById('id-msg');
const $pwInput = document.getElementById('password');
const $pwMsg = document.getElementById('pw-msg');
const $submit = document.getElementById('submit-btn');
const $pwToggle = document.getElementById('toggle-pw');

let lastCheckedId = null; // 마지막으로 중복체크 통과한 아이디

// ===== 아이디 길이(최소 4자) 실시간 체크 =====
function updateIdHint() {
  const id = $idInput.value.trim();

  // 길이 미달 → 안내, 유효 표시 제거, 중복체크 무효화
  if (id.length === 0) {
    $idMsg.textContent = '';
    $idMsg.className = 'msg';
  } else if (id.length < 4) {
    $idMsg.textContent = '아이디는 최소 4자 이상이어야 합니다.';
    $idMsg.className = 'msg'; // valid 제거
  } else {
    // 길이 통과 BUT 마지막 체크한 아이디와 다르면 "중복 체크 필요" 안내
    if (lastCheckedId !== id) {
      $idMsg.textContent = '중복 체크가 필요합니다.';
      $idMsg.className = 'msg';
    }
  }
  updateSubmitState();
}

$idInput.addEventListener('input', updateIdHint);

// ===== 아이디 중복 체크 =====
$idBtn.addEventListener('click', () => {
  const id = $idInput.value.trim();
  if (!id) {
    $idMsg.textContent = '아이디를 입력해주세요.';
    $idMsg.className = 'msg';
    updateSubmitState();
    return;
  }
  if (id.length < 4) {
    $idMsg.textContent = '아이디는 최소 4자 이상이어야 합니다.';
    $idMsg.className = 'msg';
    updateSubmitState();
    return;
  }
  if (EXISTING_IDS.includes(id)) {
    $idMsg.textContent = '이미 사용중인 아이디입니다.';
    $idMsg.className = 'msg';
    lastCheckedId = null;
  } else {
    $idMsg.textContent = '사용 가능한 아이디입니다.';
    $idMsg.className = 'msg valid';
    lastCheckedId = id;
  }
  updateSubmitState();
});

// ===== 비밀번호 규칙/정상성 체크 =====
function validatePassword(pw) {
  if (!pw) return '비밀번호를 입력해주세요.';
  if (pw.length < 8) return '최소 8자 이상이어야 합니다.';
  if (!/[A-Z]/.test(pw)) return '영문 대문자가 포함되어야 합니다.';
  if (!/[0-9]/.test(pw)) return '숫자가 포함되어야 합니다.';
  if (!/[!@#\$%\^&\*]/.test(pw)) return '특수문자(!@#$%^&*)가 포함되어야 합니다.';
  return ''; // 정상
}

$pwInput.addEventListener('input', () => {
  const msg = validatePassword($pwInput.value);
  $pwMsg.textContent = msg || '사용 가능한 비밀번호입니다.';
  $pwMsg.className = msg ? 'msg' : 'msg valid';
  updateSubmitState();
});

// ===== 비밀번호 보기/숨기기 토글 =====
$pwToggle.addEventListener('click', () => {
  const show = $pwInput.type === 'password';
  $pwInput.type = show ? 'text' : 'password';
  $pwToggle.setAttribute('aria-pressed', String(show));
  $pwToggle.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
});

// ===== 가입 버튼 활성화 제어 =====
function updateSubmitState() {
  const id = $idInput.value.trim();
  const idLenOK = id.length >= 4;
  const idOK = $idMsg.classList.contains('valid') && lastCheckedId === id;
  const pwOK = validatePassword($pwInput.value) === '';
  $submit.disabled = !(idLenOK && idOK && pwOK);
}

// ===== 최종 제출 =====
$form.addEventListener('submit', e => {
  e.preventDefault();
  const id = $idInput.value.trim();

  if (id.length < 4) {
    alert('아이디는 최소 4자 이상이어야 합니다.');
    return;
  }
  if (!($idMsg.classList.contains('valid') && lastCheckedId === id)) {
    alert('아이디 중복 체크가 필요합니다.');
    return;
  }
  const pwErr = validatePassword($pwInput.value);
  if (pwErr) {
    alert('비밀번호 규칙을 확인해주세요: ' + pwErr);
    return;
  }

  const safeId = id.replace(/[\r\n]/g, '');
  alert(`'${safeId}'님 회원가입 완료!`);
});

