/* 새 주차 빈 틀. 공용 도구(../assets/lab.js의 Lab)를 그대로 씁니다. */
(function () {
  'use strict';

  // ✏️ [바꿀 곳 5] 단계 이름. lab.html의 <section id="step-N"> 개수와 같아야 합니다.
  const STEPS = ['첫 번째 활동', '두 번째 활동'];
  // ✏️ [바꿀 곳 6] 이 주차만의 저장 이름. 다른 주차와 겹치지 않게 바꾸세요 (예: 'week7-note').
  const KEY = 'weekN-note';

  const $ = (id) => document.getElementById(id);
  const saved = Lab.store.get(KEY, null);
  let records = Array.isArray(saved?.records) ? saved.records : [];
  let active = 1;
  if (typeof saved?.student === 'string') $('student').value = saved.student;

  function persist() { Lab.store.set(KEY, { student: $('student').value, records }); }

  function go(n, focus) {
    active = Math.max(1, Math.min(STEPS.length, n));
    STEPS.forEach((_, i) => { $(`step-${i + 1}`).hidden = i + 1 !== active; });
    $('prev').disabled = active === 1;
    $('next').disabled = active === STEPS.length;
    renderRail();
    if (focus) $(`step-${active}-title`).focus();
  }

  function renderRail() {
    $('rail').replaceChildren(...STEPS.map((name, i) => {
      const li = document.createElement('li');
      const done = records.some((r) => r.step === i + 1);
      li.className = `${done ? 'done' : ''} ${active === i + 1 ? 'current' : ''}`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-quiet';
      b.textContent = `${i + 1}. ${name}${done ? ' ✓' : ''}`;
      if (active === i + 1) b.setAttribute('aria-current', 'step');
      b.onclick = () => go(i + 1, true);
      li.append(b);
      return li;
    }));
  }

  function renderRecords() {
    $('records').innerHTML = records.map((r, i) => `<article class="record"><h3>${i + 1}. ${Lab.esc(STEPS[r.step - 1] || '')}</h3><p>예측: ${Lab.esc(r.predict)}</p><p>설명: ${Lab.esc(r.explain)}</p><p class="note">시각: ${Lab.esc(r.time)}</p></article>`).join('');
    $('note-status').textContent = `기록 ${records.length}건`;
    renderRail();
  }

  function noteText() {
    return `${$('student').value}\n` + records.map((r, i) => `\n${i + 1}. ${STEPS[r.step - 1]}\n예측: ${r.predict}\n설명: ${r.explain}\n시각: ${r.time}`).join('\n');
  }

  document.querySelectorAll('[data-record]').forEach((button) => {
    button.onclick = () => {
      const step = Number(button.dataset.record);
      const predict = $(`step-${step}-predict`).value.trim();
      const explain = $(`step-${step}-explain`).value.trim();
      if (!predict || !explain) { Lab.toast('예측과 설명을 모두 채워 주세요.'); return; }
      records.push({ step, predict, explain, time: new Date().toISOString() });
      persist();
      renderRecords();
      Lab.toast(`${STEPS[step - 1]} 기록이 추가되었습니다.`);
      if (step < STEPS.length) go(step + 1, true);
    };
  });

  $('student').oninput = persist;
  $('prev').onclick = () => go(active - 1, true);
  $('next').onclick = () => go(active + 1, true);
  $('save-text').onclick = () => Lab.save('실험노트.txt', noteText());
  $('clear').onclick = () => Lab.confirm('실험 노트를 모두 지울까요?', () => { records = []; persist(); renderRecords(); });

  renderRecords();
  go(1);
})();
