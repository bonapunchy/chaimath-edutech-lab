/* PORTABLE BUNDLE: shared Lab unchanged; quad math/validation unchanged.
   quad copy omits only its level auto-init and navigation link. */
if(typeof window!=='undefined'){
(function () {
  'use strict';

  const PREFIX = 'chai-lab:';
  let toastTimer;
  let activeDialog;

  function closeDialog() {
    if (!activeDialog) return;
    const { backdrop, previousFocus, onKeydown } = activeDialog;
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
    activeDialog = null;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }

  function makeDialog(title) {
    closeDialog();
    const previousFocus = document.activeElement;
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop no-print';
    const dialog = document.createElement('section');
    dialog.className = 'dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const heading = document.createElement('h2');
    heading.textContent = String(title);
    heading.id = 'lab-dialog-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    dialog.append(heading);
    backdrop.append(dialog);
    document.body.append(backdrop);
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDialog();
      } else if (event.key === 'Tab') {
        const focusable = [...dialog.querySelectorAll('button, textarea, input, select, a[href]')].filter((el) => !el.disabled);
        if (!focusable.length) return;
        if (event.shiftKey && document.activeElement === focusable[0]) {
          event.preventDefault();
          focusable.at(-1).focus();
        } else if (!event.shiftKey && document.activeElement === focusable.at(-1)) {
          event.preventDefault();
          focusable[0].focus();
        }
      }
    };
    document.addEventListener('keydown', onKeydown);
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeDialog(); });
    activeDialog = { backdrop, previousFocus, onKeydown };
    return dialog;
  }

  function csvParse(input) {
    const text = String(input == null ? '' : input).replace(/^\uFEFF/, '');
    const records = [];
    const errors = [];
    let row = [];
    let field = '';
    let state = 'start'; // start, bare, quoted, afterQuote
    let line = 1;
    let quoteLine = 1;
    let rowTouched = false;
    let invalidAfterQuote = false;

    function finishField() { row.push(field); field = ''; state = 'start'; invalidAfterQuote = false; }
    function finishRow() {
      if (rowTouched) {
        finishField();
        records.push(row);
      }
      row = [];
      field = '';
      state = 'start';
      rowTouched = false;
      invalidAfterQuote = false;
    }

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (state === 'quoted') {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else state = 'afterQuote';
        } else if (ch === '\r' && text[i + 1] === '\n') {
          field += '\r\n'; i++; line++;
        } else {
          field += ch;
          if (ch === '\r' || ch === '\n') line++;
        }
        continue;
      }

      if (ch === ',' ) {
        rowTouched = true;
        finishField();
      } else if (ch === '\r' || ch === '\n') {
        finishRow();
        if (ch === '\r' && text[i + 1] === '\n') i++;
        line++;
      } else if (state === 'start' && ch === '"') {
        state = 'quoted';
        quoteLine = line;
        rowTouched = true;
      } else if (state === 'afterQuote') {
        if (!invalidAfterQuote) {
          errors.push({ line, message: '닫는 따옴표 뒤에 쉼표나 줄바꿈이 아닌 문자가 있습니다.' });
          invalidAfterQuote = true;
        }
        field += ch;
        rowTouched = true;
      } else {
        if (ch === '"') errors.push({ line, message: '따옴표는 필드의 시작에서만 사용할 수 있습니다.' });
        field += ch;
        state = 'bare';
        rowTouched = true;
      }
    }
    if (state === 'quoted') errors.push({ line: quoteLine, message: '닫히지 않은 따옴표가 있습니다.' });
    finishRow();
    return { header: records.shift() || [], rows: records, errors };
  }

  function csvStringify(rows2d, options) {
    const rows = Array.isArray(rows2d) ? rows2d : [];
    const result = rows.map((row) => {
      if (!Array.isArray(row)) throw new TypeError('CSV 행은 배열이어야 합니다.');
      return row.map((value) => {
        let str = value == null ? '' : String(value);
        if (options && options.safe && /^[=+\-@\t\r]/.test(str)) str = "'" + str;
        return /[",\r\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
      }).join(',');
    }).join('\r\n');
    return (options && options.bom ? '\uFEFF' : '') + result;
  }

  const Lab = {
    teacher: { name: '김원표T', academy: '차이수학', subject: '수학' },
    store: {
      get(key, fallback) {
        try {
          const raw = localStorage.getItem(PREFIX + key);
          return raw === null ? fallback : JSON.parse(raw);
        } catch (_) { return fallback; }
      },
      set(key, value) {
        try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
        catch (_) { return false; }
      },
      remove(key) {
        try { localStorage.removeItem(PREFIX + key); return true; }
        catch (_) { return false; }
      }
    },
    toast(message) {
      if (!document.body) return;
      let el = document.querySelector('.toast[data-lab-toast]');
      if (!el) {
        el = document.createElement('div');
        el.className = 'toast no-print';
        el.dataset.labToast = '';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.append(el);
      }
      el.textContent = String(message);
      el.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.hidden = true; }, 4500);
    },
    esc(value) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
    },
    async copy(value, buttonEl) {
      const content = String(value == null ? '' : value);
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(content);
        if (buttonEl) {
          const original = buttonEl.textContent;
          buttonEl.textContent = '복사 완료';
          setTimeout(() => { if (buttonEl.isConnected) buttonEl.textContent = original; }, 1500);
        }
        return true;
      } catch (_) {
        Lab.showText('직접 복사하세요', content);
        return false;
      }
    },
    showText(title, value) {
      const dialog = makeDialog(title);
      const textarea = document.createElement('textarea');
      textarea.id = 'lab-dialog-text';
      textarea.readOnly = true;
      textarea.setAttribute('aria-label', '복사할 내용');
      textarea.value = String(value == null ? '' : value);
      const actions = document.createElement('div');
      actions.className = 'row';
      const copyButton = document.createElement('button');
      copyButton.type = 'button'; copyButton.className = 'btn btn-primary'; copyButton.textContent = '복사';
      copyButton.addEventListener('click', async () => {
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
          await navigator.clipboard.writeText(textarea.value);
          copyButton.textContent = '복사 완료';
          setTimeout(() => { if (copyButton.isConnected) copyButton.textContent = '복사'; }, 1500);
        } catch (_) { textarea.focus(); textarea.select(); Lab.toast('내용을 선택했어요. 직접 복사해 주세요.'); }
      });
      const closeButton = document.createElement('button');
      closeButton.type = 'button'; closeButton.className = 'btn btn-quiet'; closeButton.textContent = '닫기';
      closeButton.addEventListener('click', closeDialog);
      actions.append(copyButton, closeButton);
      dialog.append(textarea, actions);
      setTimeout(() => { if (textarea.isConnected) { textarea.focus(); textarea.select(); } }, 0);
    },
    save(filename, value, mime) {
      const content = String(value == null ? '' : value);
      try {
        const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = String(filename || 'download.txt');
        anchor.style.display = 'none';
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } catch (_) { /* The on-screen copy remains available. */ }
      Lab.showText(filename || '저장할 내용', content);
    },
    print() {
      let printed = false;
      const onAfterPrint = () => { printed = true; window.removeEventListener('afterprint', onAfterPrint); };
      window.addEventListener('afterprint', onAfterPrint, { once: true });
      try { window.print(); }
      catch (_) { /* The guidance below covers restricted embeds. */ }
      setTimeout(() => {
        if (!printed) {
          window.removeEventListener('afterprint', onAfterPrint);
          Lab.toast('공유 링크 화면에서는 인쇄가 막혀 있어요. 파일을 내려받아 브라우저로 열면 인쇄·PDF 저장이 됩니다.');
        }
      }, 600);
    },
    confirm(message, onYes) {
      const dialog = makeDialog('확인');
      const p = document.createElement('p'); p.textContent = String(message);
      const actions = document.createElement('div'); actions.className = 'row';
      const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'btn btn-primary'; yes.textContent = '확인';
      yes.addEventListener('click', () => { closeDialog(); if (typeof onYes === 'function') onYes(); });
      const no = document.createElement('button'); no.type = 'button'; no.className = 'btn btn-quiet'; no.textContent = '취소';
      no.addEventListener('click', closeDialog);
      actions.append(yes, no);
      dialog.append(p, actions);
      yes.focus();
    },
    fillHead() {
      const { name, academy, subject } = Lab.teacher;
      document.querySelectorAll('[data-teacher]').forEach((el) => { el.textContent = `${name} · ${academy} · ${subject}`; });
    },
    csv: { parse: csvParse, stringify: csvStringify }
  };

  window.Lab = Lab;
})();

/* Week 6: integer conditions, direct substitution, anonymous counts. No network. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.Week6 = api; }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const SIGNATURE = '차이수학 원표쌤';
  const LEVELS = ['개초보','초보','중수','고수','초고수'];
  const TITLES = ['수업 도입 질문 카드','세 문항 미니 진단','익명 응답 질문 보드','두 경로 수업 설계','전후 비교 수업 루프'];
  const QUESTION = '최대·최소를 찾으려면 어떤 x를 비교해야 할까?';
  const LIMIT = 32768;
  const clone = x => JSON.parse(JSON.stringify(x));
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = x => String(x).replace(/-/g,'−');
  const bytes = x => new TextEncoder().encode(x).length;
  const zeros = () => Array.from({length:3},()=>[0,0,0]);
  function keys(obj, fields, label) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw Error(label+' 형식이 올바르지 않습니다.');
    if (Object.keys(obj).some(k=>!fields.includes(k))) throw Error(label+'에 지원하지 않는 필드가 있습니다.');
    for (const k of fields) if (!Object.hasOwn(obj,k)) throw Error(label+'의 '+k+' 필드가 빠졌습니다.');
  }
  function integer(n,lo,hi,label) {
    if (!Number.isInteger(n) || n<lo || n>hi) throw Error(`${label}: ${num(lo)}~${num(hi)}의 정수를 입력하세요.`);
  }
  function text(s,max,label,empty=false) {
    if (typeof s!=='string' || s.length>max || (!empty&&!s.trim())) throw Error(`${label}: ${empty?'0':'1'}~${max}자로 입력하세요.`);
  }
  function conditions(fn, interval) {
    keys(fn,['a','h','k'],'함수'); keys(interval,['left','right'],'닫힌구간');
    integer(fn.a,1,3,'a'); integer(fn.h,-3,3,'h'); integer(fn.k,-3,3,'k');
    integer(interval.left,-4,4,'왼쪽 끝'); integer(interval.right,-4,4,'오른쪽 끝');
    if (interval.left>=interval.right) throw Error('닫힌구간의 왼쪽 끝은 오른쪽 끝보다 작아야 합니다.');
  }
  const value = (f,x) => f.a*(x-f.h)**2+f.k;
  function derive(f,iv) {
    conditions(f,iv);
    const inside = f.h>=iv.left && f.h<=iv.right;
    const candidates = [...new Set([iv.left,iv.right,...(inside?[f.h]:[])])].sort((a,b)=>a-b);
    const points = candidates.map(x=>({x,y:value(f,x)}));
    const min = Math.min(...points.map(p=>p.y)), max = Math.max(...points.map(p=>p.y));
    return {candidates,points,min,max,minX:points.filter(p=>p.y===min).map(p=>p.x),maxX:points.filter(p=>p.y===max).map(p=>p.x),position:!inside?'outside':f.h===iv.left||f.h===iv.right?'boundary':'inside'};
  }
  function formula(f) {
    const base = f.h===0?'x²':`(x${f.h>0?'−':'+'}${Math.abs(f.h)})²`;
    return `f(x)=${f.a===1?'':f.a}${base}${f.k===0?'':f.k>0?'+'+f.k:'−'+Math.abs(f.k)}`;
  }
  const intervalText = iv => `${num(iv.left)}≤x≤${num(iv.right)}`;
  function seedFor(f,iv) {
    let seed=2166136261;
    for (const c of JSON.stringify([f.a,f.h,f.k,iv.left,iv.right])) seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
    return seed;
  }
  function shuffle(items,seed) {
    const result=items.slice();
    for(let i=result.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function questions(f,iv) {
    const d=derive(f,iv), candidate=d.candidates.map(num).join(', ');
    const sets=[candidate,[iv.left,iv.right,f.h].filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>a-b).map(num).join(', '),[f.h].map(num).join(', '),[iv.left,iv.right].map(num).join(', '),[iv.left].map(num).join(', '),[iv.right].map(num).join(', ')];
    const options0=[...new Set(sets)].slice(0,3);
    const makeNumbers=(correct,other)=>[...new Set([correct,other,f.k,value(f,iv.left),value(f,iv.right),correct+1,correct-1])].slice(0,3).map(num);
    const raw=[{title:'후보 x를 빠짐없이 고르면?',answer:candidate,options:options0,follow:'꼭짓점의 x좌표가 닫힌구간에 포함되는지 어떻게 판단할까요?'},{title:'이 닫힌구간에서 최솟값은?',answer:num(d.min),options:makeNumbers(d.min,d.max),follow:'후보에 직접 대입한 함숫값 중 가장 작은 값은 무엇인가요?'},{title:'이 닫힌구간에서 최댓값은?',answer:num(d.max),options:makeNumbers(d.max,d.min),follow:'양 끝에서 얻은 함숫값 중 큰 값은 무엇이며 왜 비교해야 할까요?'}];
    const explanation=[`양 끝 x=${num(iv.left)}, ${num(iv.right)}를 비교합니다. 꼭짓점의 x좌표는 ${num(f.h)}입니다. ${d.position==='outside'?'닫힌구간 밖이므로 후보에서 제외합니다.':d.position==='boundary'?'끝점과 같으므로 중복해서 세지 않습니다.':'닫힌구간 안에 있으므로 후보에 포함합니다.'}`,`후보에서 ${d.points.map(p=>`f(${num(p.x)})=${num(p.y)}`).join(', ')}입니다. 가장 작은 함숫값은 ${num(d.min)}입니다.`,`같은 후보의 함숫값을 비교하면 가장 큰 값은 ${num(d.max)}입니다. 최솟값은 ${num(d.min)}입니다. 두 값을 서로 바꾸어 읽지 않도록 확인합니다.`];
    return raw.map((q,i)=>{const options=shuffle(q.options,seedFor(f,iv)+i*997);return {...q,options,correct:options.indexOf(q.answer),explanation:explanation[i]};});
  }
  function aggregates(rows,size,label='집계') {
    integer(size,1,60,'학급 인원');
    if(!Array.isArray(rows)||rows.length!==3)throw Error(label+': 세 문항이 모두 필요합니다.');
    rows.forEach((row,i)=>{if(!Array.isArray(row)||row.length!==3)throw Error(`${label} ${i+1}번: 보기별 세 인원이 필요합니다.`);row.forEach(n=>integer(n,0,60,label+' 보기 인원'));if(row.reduce((a,b)=>a+b,0)>size)throw Error(`${label} ${i+1}번: 응답 합계가 학급 인원을 넘었습니다.`);});
    return rows;
  }
  function summarize(rows,size,qs) {
    aggregates(rows,size);
    return rows.map((row,i)=>{const respondents=row.reduce((a,b)=>a+b,0),correct=row[qs[i].correct];return {respondents,correct,missing:size-respondents,accuracy:respondents?correct/respondents*100:null};});
  }
  function priority(rows,size,qs) {
    const stats=summarize(rows,size,qs), eligible=stats.map((s,i)=>({...s,i})).filter(s=>s.respondents);
    if(!eligible.length)return [];
    const lowest=Math.min(...eligible.map(s=>s.accuracy));return eligible.filter(s=>Math.abs(s.accuracy-lowest)<1e-9).map(s=>s.i);
  }
  function sample(qs) {
    return qs.map((q,i)=>{const row=[0,0,0];row[q.correct]=[8,12,16][i];row[(q.correct+1)%3]=[7,4,2][i];row[(q.correct+2)%3]=[3,4,1][i];return row;});
  }
  function defaults() {
    const s={version:1,subject:'quadratic-lesson',function:{a:1,h:1,k:-2},interval:{left:2,right:4},classSize:20,before:zeros(),after:zeros(),path:'foundation',nickname:SIGNATURE,question:QUESTION,teacherMemo:''};
    s.before=sample(questions(s.function,s.interval));return s;
  }
  function validate(s) {
    keys(s,['version','subject','function','interval','classSize','before','after','path','nickname','question','teacherMemo'],'수업 자료');
    if(s.version!==1)throw Error('version=1인 파일만 지원합니다.');
    if(s.subject!=='quadratic-lesson')throw Error('subject는 quadratic-lesson이어야 합니다.');
    conditions(s.function,s.interval);integer(s.classSize,1,60,'학급 인원');
    aggregates(s.before,s.classSize,'수업 전');aggregates(s.after,s.classSize,'수업 후');
    if(!['foundation','extension'].includes(s.path))throw Error('지원하지 않는 수업 경로입니다.');
    text(s.nickname,40,'별명');text(s.question,300,'도입 질문');text(s.teacherMemo,2000,'교사 메모',true);
    return s;
  }
  function encode(s) {validate(s);const raw=JSON.stringify(s,null,2);if(bytes(raw)>LIMIT)throw Error('JSON은 32KB 이하여야 합니다.');return raw;}
  function decode(raw) {
    if(typeof raw!=='string'||bytes(raw)>LIMIT)throw Error('JSON은 32KB 이하의 텍스트여야 합니다.');
    let s;try{s=JSON.parse(raw.replace(/^\uFEFF/,''));}catch{throw Error('JSON 문법을 확인하세요. 파일 전체를 붙여 넣어 주세요.');}
    validate(s);return clone(s);
  }
  const PATHS = {
    foundation:{title:'개념 다지기',minutes:[3,5,5,2],tasks:['꼭짓점의 x좌표와 닫힌구간의 위치를 확인하고 비교할 후보를 고르세요.','고른 후보를 함수에 직접 대입하고 함숫값을 비교하세요.','짝에게 후보를 고른 이유와 가장 작은 값·큰 값을 정한 이유를 설명하세요.','허용된 범위에서 닫힌구간을 바꿀 때 후보가 달라질 수 있는 이유를 적으세요.']},
    extension:{title:'적용 확장',minutes:[2,5,5,3],tasks:['현재 닫힌구간에서 비교할 후보를 고르고 이유를 짧게 쓰세요.','꼭짓점의 x좌표가 안·밖·경계에 오도록 닫힌구간을 각각 정하고 직접 대입·비교하세요.','짝과 서로 정한 구간을 바꾸어 풀고, 같은 최댓값이 양 끝에서 나올 수 있는지 설명하세요.','꼭짓점이 닫힌구간에 있을 때와 없을 때의 후보 선택 원칙을 한 문장으로 정리하세요.']}
  };
  const ACTIVITIES=['후보 선택','대입·비교','짝 설명','출구 질문'];
  function lesson(s) {
    const p=PATHS[s.path];
    return `<section class="lesson"><h2>${p.title} · 15분</h2><ol>${p.tasks.map((t,i)=>`<li><h3>${ACTIVITIES[i]} · ${p.minutes[i]}분</h3><p>${t}</p><div class="blank"></div></li>`).join('')}</ol></section>`;
  }
  function graph(f,iv,reveal=false) {
    const d=derive(f,iv),xmin=Math.min(-4,iv.left,f.h)-1,xmax=Math.max(4,iv.right,f.h)+1;
    const ymin=Math.min(f.k,0)-2,ymax=Math.max(value(f,xmin),value(f,xmax),0)+3;
    const X=x=>42+(x-xmin)/(xmax-xmin)*530,Y=y=>260-(y-ymin)/(ymax-ymin)*220;
    const path=Array.from({length:161},(_,i)=>{const x=xmin+(xmax-xmin)*i/160;return `${i?'L':'M'}${X(x).toFixed(2)} ${Y(value(f,x)).toFixed(2)}`;}).join(' ');
    return `<svg class="quad-graph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 315" role="img" aria-label="${esc(formula(f)+' · '+intervalText(iv))}"><title>${esc(formula(f))} · ${intervalText(iv)}</title><rect x="${X(iv.left)}" y="35" width="${X(iv.right)-X(iv.left)}" height="230" fill="var(--accent-soft,#E3F0E8)"/><path d="M42 ${Y(0)}H580 M${X(0)} 35V265" fill="none" stroke="currentColor" opacity=".45"/><text x="585" y="${Y(0)+4}">x</text><text x="${X(0)+7}" y="32">y</text><path d="${path}" fill="none" stroke="var(--graph-f,#2F6FB0)" stroke-width="3"/>${[iv.left,iv.right].map(x=>`<path d="M${X(x)} 35V265" stroke="currentColor" stroke-dasharray="4 4" opacity=".55"/><circle cx="${X(x)}" cy="285" r="4" fill="currentColor"/><text x="${X(x)}" y="306" text-anchor="middle">${num(x)}</text>`).join('')}<text x="45" y="22">${esc(formula(f))}</text><text x="575" y="22" text-anchor="end">${intervalText(iv)}</text>${reveal?d.points.map(p=>{const left=p.x===iv.left,right=p.x===iv.right;return `<g class="answer-point"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="var(--graph-g,#C2452D)"/><text x="${X(p.x)+(left?-7:right?7:0)}" y="${Y(p.y)+(left||right?-9:22)}" text-anchor="${left?'end':right?'start':'middle'}">(${num(p.x)}, ${num(p.y)})</text></g>`;}).join(''):''}</svg>`;
  }
  function solution(s) {
    const f=s.function,iv=s.interval,d=derive(f,iv);
    const location={inside:'꼭짓점의 x좌표는 닫힌구간 안에 있으므로 후보에 넣습니다.',outside:'꼭짓점의 x좌표는 닫힌구간 밖에 있으므로 후보에 넣지 않습니다.',boundary:'꼭짓점은 닫힌구간의 경계에 있으므로 끝점과 중복하여 세지 않습니다.'}[d.position];
    return `<section class="solution"><h2>직접 대입·비교로 검산</h2><p>대칭축은 x=${num(f.h)}, 꼭짓점은 (${num(f.h)}, ${num(f.k)})입니다. ${location}</p><p>후보 x=${d.candidates.map(num).join(', ')}</p><ul>${d.points.map(p=>`<li class="formula">f(${num(p.x)})=${f.a===1?'':f.a+'×'}(${num(p.x)}−(${num(f.h)}))²${f.k===0?'':f.k>0?'+'+f.k:'−'+Math.abs(f.k)}=${num(p.y)}</li>`).join('')}</ul><p>최솟값 ${num(d.min)} (x=${d.minX.map(num).join(', ')}) · 최댓값 ${num(d.max)} (x=${d.maxX.map(num).join(', ')})</p><p>a&gt;0이므로 꼭짓점이 닫힌구간에 포함되면 그곳에서 최솟값을 갖습니다. 여기서는 모든 후보에 직접 대입한 함숫값을 비교하여 최댓값·최솟값을 확인했습니다.</p></section>`;
  }
  const pct = n => n===null?'계산 불가':n.toFixed(1)+'%';
  const INTERPRETATION='익명 집계는 추가 질문을 고르는 참고 자료입니다. 오개념이나 개인별 능력을 확정하거나 개인을 분류할 수 없습니다. 정답률의 분모는 응답자 수이며, 무응답은 정답률 계산에서 제외합니다.';
  const COMPARISON_LIMIT='전후 응답은 같은 학생을 추적한 자료가 아닙니다. 비율 차이만으로 동일 학생의 변화나 수업 효과를 입증할 수 없습니다.';
  function report(rows,s,label) {
    const qs=questions(s.function,s.interval),stats=summarize(rows,s.classSize,qs),p=priority(rows,s.classSize,qs);
    return `<h3>${label}</h3><div class="stats">${stats.map((t,i)=>`<article><h4>${i+1}. ${qs[i].title}</h4><p>${qs[i].options.map((o,j)=>`${j+1}번 ${esc(o)}: ${rows[i][j]}명 (${pct(t.respondents?rows[i][j]/t.respondents*100:null)})`).join(' · ')}</p><p>응답 ${t.respondents}/${s.classSize}명 · 무응답 ${t.missing}명</p><p>정답 ${t.correct} / 응답자 ${t.respondents}명 · 정답률 ${pct(t.accuracy)}${t.respondents?'':' (응답 없음)'}</p></article>`).join('')}</div><p>추가 질문 우선순위: ${p.length?p.map(i=>`${i+1}번 — ${qs[i].follow}`).join(' / '):'응답자가 없어 정하지 않습니다.'}${p.length>1?' (동률)':''}</p><p class="note">보기 비율의 분모도 응답자 수입니다. ${INTERPRETATION}</p>`;
  }
  function comparison(s) {
    const qs=questions(s.function,s.interval),b=summarize(s.before,s.classSize,qs),a=summarize(s.after,s.classSize,qs);
    return `<h2>수업 전후 비교</h2><div class="stats">${b.map((p,i)=>{const q=a[i],diff=p.accuracy===null||q.accuracy===null?null:q.accuracy-p.accuracy;return `<article><h3>${i+1}. ${qs[i].title}</h3><p>전: ${p.correct}/${p.respondents}명 (${pct(p.accuracy)}) · 후: ${q.correct}/${q.respondents}명 (${pct(q.accuracy)})</p><p>차이: ${diff===null?'계산 불가 (전후 응답 필요)':(diff>0?'+':'')+num(diff.toFixed(1))+'%p'}</p><p>${p.respondents!==q.respondents?'응답자 수가 다름 — 비교 시 주의':'응답자 수가 같아도 동일 학생이라는 뜻은 아닙니다.'}</p><p>무응답: 전 ${p.missing}명 / 후 ${q.missing}명</p></article>`;}).join('')}</div><p class="note">${COMPARISON_LIMIT}</p>`;
  }
  // Standalone exports intentionally contain no scripts, remote assets or serialized state.
  const SHEET_CSS=`:root{color-scheme:light;--paper:#F5F7F2;--surface:#fff;--ink:#15261F;--line:#D9E0D8;--accent-soft:#E3F0E8;--graph-f:#2F6FB0;--graph-g:#C2452D}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 "Malgun Gothic",sans-serif;overflow-wrap:anywhere}main{max-width:1000px;margin:auto;padding:32px max(16px,4vw)}h1,h2{line-height:1.4}section,article{border-bottom:1px solid var(--line);padding:16px 0}.quad-graph{display:block;width:100%;max-width:700px;height:auto}.quad-graph text{fill:currentColor;font:15px sans-serif}.blank{min-height:3rem;border-bottom:1px solid var(--line);margin-bottom:1rem}.note{font-size:.9rem}.chip-demo{display:inline-block;border:1px dashed currentColor;padding:3px 10px}.formula{font-family:Consolas,monospace}.stats{display:grid;gap:16px}li{margin-bottom:1rem}a{color:inherit}@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--paper:#0F1714;--surface:#16211C;--ink:#E4ECE6;--line:#2A3832;--accent-soft:#1C3128;--graph-f:#6FA8E0;--graph-g:#E07A62}}:root[data-theme="dark"]{color-scheme:dark;--paper:#0F1714;--surface:#16211C;--ink:#E4ECE6;--line:#2A3832;--accent-soft:#1C3128;--graph-f:#6FA8E0;--graph-g:#E07A62}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}@media print{body{background:#fff;color:#000}main{padding:0}.blank{min-height:4rem}section,article{break-inside:avoid}a{display:none}}`;
  function documentHTML(body,title) {return `<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>${esc(title)}</title><style>${SHEET_CSS}</style></head><body><main>${body}</main></body></html>`;}
  function heading(s,level,kind) {return `<header><p>WEEK 06 · ${LEVELS[level-1]} ${['①','②','③','④','⑤'][level-1]}</p><h1>${esc(TITLES[level-1])} · ${kind}</h1><p>${SIGNATURE}</p><p>수업 별명: ${esc(s.nickname)}</p></header><p class="chip-demo">가상 데이터</p>`;}
  function problem(s,reveal=false) {return `<p class="formula">${esc(formula(s.function))} · 닫힌구간 ${intervalText(s.interval)}</p>${graph(s.function,s.interval,reveal)}<h2>${esc(s.question)}</h2>`;}
  function studentBody(s,level) {
    // Whitelist output: do not include choices, computed values, notes, counts or state.
    let body=heading(s,level,'학생 활동지')+problem(s,false)+'<p>내 생각과 이유</p><div class="blank"></div>';
    if(level>=2) body+='<section><h2>세 문항 · 먼저 생각하기</h2><ol><li>비교할 후보 x를 빠짐없이 쓰고 이유를 설명하세요.<div class="blank"></div></li><li>최솟값을 구하고 그 이유를 쓰세요.<div class="blank"></div></li><li>최댓값을 구하고 그 이유를 쓰세요.<div class="blank"></div></li></ol></section>';
    if(level>=4)body+=lesson(s);
    return body;
  }
  function teacherBody(s,level) {
    let body=heading(s,level,'교사용 해설')+problem(s,true)+solution(s);
    if(level>=2)body+='<h2>문항별 확인</h2>'+questions(s.function,s.interval).map((q,i)=>`<article><h3>${i+1}. ${q.title}</h3><p>정답: ${esc(q.answer)}</p><p>${esc(q.explanation)}</p><p>${q.follow}</p></article>`).join('');
    if(level>=3)body+=report(s.before,s,'수업 전 익명 집계');
    if(level>=4)body+=lesson(s)+'<p>수업 경로는 교사가 선택합니다. 익명 집계로 개인별 그룹을 자동 배정하지 않습니다.</p>';
    if(level>=5)body+=report(s.after,s,'수업 후 익명 집계')+comparison(s);
    body+='<section><h2>교사 수업 메모</h2><p class="memo">'+esc(s.teacherMemo).replace(/\n/g,'<br>')+'</p></section>';
    return body;
  }
  function sheet(s,level,kind='student') {validate(s);integer(level,1,5,'레벨');if(!['student','teacher'].includes(kind))throw Error('자료 종류를 확인하세요.');return documentHTML(kind==='student'?studentBody(s,level):teacherBody(s,level),TITLES[level-1]+(kind==='student'?' 학생 활동지':' 교사용 해설'));}
  function init() {
    const $=id=>document.getElementById(id),level=Number(document.body.dataset.level);
    let s=defaults(),selection=[null,null,null],revealed=false,valid=true,conditionValid=true;
    function tabs(name,focus=false) {
      document.body.dataset.tab=name;
      for(const id of ['work','student','teacher']){const active=name===id;$('panel-'+id).hidden=!active;$('tab-'+id).setAttribute('aria-selected',String(active));$('tab-'+id).tabIndex=active?0:-1;}
      if(focus)$('tab-'+name).focus();
    }
    for(const name of ['work','student','teacher']) {
      $('tab-'+name).onclick=()=>tabs(name);
      $('tab-'+name).onkeydown=e=>{const names=['work','student','teacher'],i=names.indexOf(name);let next;if(e.key==='ArrowRight')next=(i+1)%3;if(e.key==='ArrowLeft')next=(i+2)%3;if(e.key==='Home')next=0;if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();tabs(names[next],true);}};
    }
    function reset() {selection=[null,null,null];revealed=false;$('check-answer').setAttribute('aria-expanded','false');$('teacher-reveal').setAttribute('aria-expanded','false');$('diagnosis-status').textContent='';}
    function setControls() {
      $('nickname').value=s.nickname;$('question').value=s.question;$('teacher-memo').value=s.teacherMemo;$('class-size').value=s.classSize;$('path').value=s.path;
      for(const k of ['a','h','k'])$(k).value=s.function[k];for(const k of ['left','right'])$(k).value=s.interval[k];
    }
    function readNumber(id) {return $(id).value.trim()===''?NaN:Number($(id).value);}
    function validateUI() {
      try{validate(s);if(!conditionValid)throw Error('함수·구간 입력을 먼저 확인하세요.');valid=true;$('input-error').textContent='';}
      catch(e){valid=false;$('input-error').textContent=e.message;}
      $('board-error').textContent=valid?'':$('input-error').textContent;
      $('after-error').textContent=valid?'':$('input-error').textContent;
      for(const id of ['save-student','copy-student','manual-copy','print-student','save-teacher','copy-teacher','print-teacher','export-json'])$(id).disabled=!valid||(id.includes('teacher')&&!revealed);
      $('teacher-reveal').disabled=!valid;$('check-answer').disabled=!valid;
      return valid;
    }
    function renderQuestions() {
      const qs=questions(s.function,s.interval);
      $('questions').innerHTML=level<2?'':qs.map((q,i)=>`<fieldset><legend>${i+1}. ${q.title}</legend>${q.options.map((o,j)=>`<label class="choice" for="q${i}-${j}"><input id="q${i}-${j}" name="q${i}" type="radio" value="${j}"${selection[i]===j?' checked':''}>${esc(o)}</label>`).join('')}<label for="reason-${i}">이유를 한 문장으로</label><textarea id="reason-${i}" maxlength="500" placeholder="가상 학생의 생각을 적어 보세요."></textarea></fieldset>`).join('');
      for(let i=0;i<3;i++)for(let j=0;j<3;j++){const el=$(`q${i}-${j}`);if(el)el.onchange=()=>{selection[i]=j;revealed=false;$('answer').innerHTML='';$('answer').hidden=true;$('check-answer').setAttribute('aria-expanded','false');$('teacher-reveal').setAttribute('aria-expanded','false');$('diagnosis-status').textContent='선택이 바뀌었습니다. 다시 확인하세요.';update();};}
    }
    function renderBoardInputs() {
      const qs=questions(s.function,s.interval);
      for(const when of ['before','after'])$('counts-'+when).innerHTML=qs.map((q,i)=>`<fieldset><legend>${i+1}. ${q.title}</legend><div class="count-grid">${q.options.map((o,j)=>`<div class="field"><label for="${when}-${i}-${j}">${j+1}번 ${esc(o)} · 명</label><input type="number" id="${when}-${i}-${j}" min="0" max="60" step="1" inputmode="numeric" value="${s[when][i][j]}"></div>`).join('')}</div></fieldset>`).join('');
      for(const when of ['before','after'])for(let i=0;i<3;i++)for(let j=0;j<3;j++)$(`${when}-${i}-${j}`).oninput=()=>{s[when][i][j]=readNumber(`${when}-${i}-${j}`);update();};
    }
    function renderViews() {
      const okay=valid;
      $('problem').innerHTML=conditionValid?problem(s,revealed):'<p>함수와 닫힌구간에 올바른 조건을 입력하세요.</p>';
      $('sheet-student').innerHTML=okay?studentBody(s,level):'<p>입력 오류를 수정하면 활동지가 표시됩니다.</p>';
      $('teacher-content').hidden=!revealed||!okay;
      $('teacher-notes').hidden=!revealed;
      $('sheet-teacher').innerHTML=revealed&&okay?teacherBody(s,level):'';
      $('answer').hidden=!revealed||!okay;
      if(!okay)$('answer').innerHTML='';
      $('board-before').innerHTML=okay&&level>=3?report(s.before,s,'수업 전 익명 집계'):'<p>입력 오류를 수정하면 집계가 표시됩니다.</p>';
      $('board-after').innerHTML=okay&&level>=5?report(s.after,s,'수업 후 익명 집계'):'입력을 확인하세요.';
      $('comparison').innerHTML=okay&&level>=5?comparison(s):'';
      $('lesson').innerHTML=level>=4?lesson(s):'';
    }
    function update() {validateUI();renderViews();}
    function conditionInput() {
      reset();s.before=zeros();s.after=zeros();
      for(const k of ['a','h','k'])s.function[k]=readNumber(k);for(const k of ['left','right'])s.interval[k]=readNumber(k);
      try{conditions(s.function,s.interval);conditionValid=true;}catch(e){conditionValid=false;}
      if(conditionValid){renderQuestions();renderBoardInputs();}else{$('questions').innerHTML='';$('counts-before').innerHTML='';$('counts-after').innerHTML='';}
      $('answer').innerHTML='';$('data-status').textContent='조건 변경: 선택·공개 결과·전후 집계를 초기화했습니다.';update();
    }
    for(const k of ['a','h','k','left','right'])$(k).oninput=conditionInput;
    $('nickname').oninput=()=>{s.nickname=$('nickname').value;update();};
    $('question').oninput=()=>{s.question=$('question').value;update();};
    $('teacher-memo').oninput=()=>{s.teacherMemo=$('teacher-memo').value;update();};
    $('class-size').oninput=()=>{s.classSize=readNumber('class-size');update();};
    $('path').onchange=()=>{s.path=$('path').value;update();};
    function reveal(check) {
      if(!validateUI())return;
      if(check&&level>=2&&selection.some(v=>v===null)){$('diagnosis-status').textContent='세 문항의 답을 모두 고른 뒤 확인하세요.';return;}
      revealed=true;$('check-answer').setAttribute('aria-expanded','true');$('teacher-reveal').setAttribute('aria-expanded','true');
      $('answer').innerHTML=solution(s)+(check&&level>=2?questions(s.function,s.interval).map((q,i)=>`<article><h3>${i+1}. ${selection[i]===q.correct?'선택을 확인했어요':'다시 비교해 보세요'}</h3><p>선택 ${esc(q.options[selection[i]])} · 정답 ${esc(q.answer)}</p><p>${esc(q.explanation)}</p><p>${q.follow}</p></article>`).join('')+'<p>세 문항만으로 학생의 능력을 단정할 수 없습니다. 이유를 듣고 후속 질문을 선택하세요.</p>':'');
      update();
    }
    $('check-answer').onclick=()=>reveal(true);$('teacher-reveal').onclick=()=>reveal(false);
    $('load-sample').onclick=()=>{if(!conditionValid)return;s.classSize=20;s.before=sample(questions(s.function,s.interval));s.after=zeros();$('class-size').value=20;renderBoardInputs();$('data-status').textContent='가상 데이터: 20명 표본을 불러왔습니다. 수업 후는 별도 입력하세요.';update();};
    for(const kind of ['student','teacher']) {
      const output=()=>sheet(s,level,kind);
      $('save-'+kind).onclick=()=>{if(validateUI())Lab.save(`week6-l${level}-${kind}.html`,output(),'text/html;charset=utf-8');};
      $('copy-'+kind).onclick=()=>{if(validateUI())Lab.copy(output(),$('copy-'+kind));};
      $('print-'+kind).onclick=()=>{if(validateUI()){tabs(kind);Lab.print();}};
    }
    $('manual-copy').onclick=()=>{if(validateUI())Lab.showText('학생 활동지 HTML 직접 복사',sheet(s,level));};
    $('export-json').onclick=()=>{if(validateUI())Lab.save('week6-quadratic-lesson.json',encode(s),'application/json');};
    function load(raw) {
      try{const next=decode(raw);s=next;conditionValid=true;reset();setControls();renderQuestions();renderBoardInputs();$('answer').innerHTML='';$('data-status').textContent='JSON을 불러왔습니다. 교사용 확인은 다시 눌러 주세요.';update();}
      catch(e){$('data-status').textContent='불러오기 거부: '+e.message+' 현재 자료를 유지합니다.';}
    }
    $('import-text-button').onclick=()=>load($('import-text').value);
    $('import-json').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>LIMIT){$('data-status').textContent='불러오기 거부: 파일은 32KB 이하여야 합니다. 현재 자료를 유지합니다.';e.target.value='';return;}try{load(await file.text());}catch{$('data-status').textContent='파일을 읽을 수 없습니다. JSON 텍스트 붙여 넣기를 이용하세요.';}e.target.value='';};
    for(const el of document.querySelectorAll('[data-min-level]'))el.hidden=level<Number(el.dataset.minLevel);
    $('check-answer').textContent=level===1?'교사용 확인':'세 문항 선택 확인';
    setControls();renderQuestions();renderBoardInputs();update();
    api.ui={getState:()=>({lesson:clone(s),selection:selection.slice(),revealed,valid}),tabs};
  }
  const api={SIGNATURE,LEVELS,TITLES,QUESTION,LIMIT,PATHS,ACTIVITIES,esc,num,value,conditions,derive,formula,intervalText,seedFor,questions,aggregates,summarize,priority,sample,defaults,validate,encode,decode,graph,solution,report,comparison,studentBody,teacherBody,sheet,init};
  return api;
});

}
/* INTEGRATED APP: the public bundle above is generated from unchanged shared sources. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./quad.js'));
  else {root.Week6Lab=factory(root.Week6);root.Week6Lab.init();}
})(typeof window==='undefined'?globalThis:window,function(Q){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x)),zeros=()=>Array.from({length:3},()=>[0,0,0]);
  const exitQuestion=s=>Q.PATHS[s.path].tasks[3];
  function lesson(s){
    const p=Q.PATHS[s.path];
    return `<section class="lesson"><h2>${Q.esc(p.title)} · 15분</h2><ol>${p.tasks.map((t,i)=>`<li><h3>${Q.esc(Q.ACTIVITIES[i])} · ${p.minutes[i]}분</h3><p>${Q.esc(t)}</p><div class="blank"></div></li>`).join('')}</ol></section>`;
  }
  function create(){return {lesson:Q.defaults(),selection:[null,null,null],reasons:['','',''],exitResponse:'',revealed:false};}
  function reset(view){view.selection=[null,null,null];view.reasons=['','',''];view.exitResponse='';view.revealed=false;}
  function setConditions(view,f,iv){
    // Also clear on invalid intermediate input, so old answers can never describe new conditions.
    reset(view);view.lesson.before=zeros();view.lesson.after=zeros();
    view.lesson.function={...f};view.lesson.interval={...iv};Q.conditions(f,iv);
  }
  function nextLesson(raw){
    const s=Q.decode(raw);s.question=exitQuestion(s);s.before=zeros();s.after=zeros();s.teacherMemo='';return s;
  }
  function heading(s,kind){return `<header><h1>이차함수 수업 한바퀴 · ${kind}</h1><p>${Q.SIGNATURE}</p><p>수업 별명: ${Q.esc(s.nickname)}</p><p class="chip-demo">가상 데이터</p><p>2022 개정 공통수학1 [10공수1-02-06]</p></header>`;}
  function problem(s){return `<p class="formula">${Q.esc(Q.formula(s.function))} · ${Q.intervalText(s.interval)}</p>${Q.graph(s.function,s.interval,false)}<h2>${Q.esc(s.question)}</h2>`;}
  function sheetBody(s,kind='student'){
    Q.validate(s);if(!['student','teacher'].includes(kind))throw Error('자료 종류를 확인하세요.');
    let body=heading(s,kind==='student'?'학생 활동지':'교사용 해설')+problem(s);
    if(kind==='student'){
      body+='<p>내 생각과 이유</p><div class="blank"></div><section><h2>세 문항 · 먼저 생각하기</h2><ol>'+['비교할 후보 x를 빠짐없이 쓰고 이유를 설명하세요.','최솟값을 구하고 그 이유를 쓰세요.','최댓값을 구하고 그 이유를 쓰세요.'].map(t=>`<li>${t}<div class="blank"></div></li>`).join('')+'</ol></section>'+lesson(s);
      body+='<section><h2>다시 생각하기</h2><p>활동 뒤 같은 조건의 세 문항을 다시 풀고 이유를 적으세요.</p>'+[1,2,3].map(i=>`<p>${i}번</p><div class="blank"></div>`).join('')+'</section>';
    }else{
      body+=Q.solution(s)+Q.questions(s.function,s.interval).map((q,i)=>`<article><h2>${i+1}. ${Q.esc(q.title)}</h2><p>정답: ${Q.esc(q.answer)}</p><p>${Q.esc(q.explanation)}</p></article>`).join('')+Q.report(s.before,s,'수업 전 익명 집계')+lesson(s)+Q.report(s.after,s,'수업 후 익명 집계')+Q.comparison(s)+`<section><h2>교사 메모</h2><p>${Q.esc(s.teacherMemo).replace(/\n/g,'<br>')}</p></section>`;
    }
    return body;
  }
  function sheet(s,kind='student'){
    // Reuse the level document's self-contained CSS; replace its body with our whitelist body.
    const template=Q.sheet(s,5,kind);
    return template.replace(/<title>[\s\S]*?<\/title>/,'<title>이차함수 수업 '+(kind==='student'?'활동지':'해설')+'</title>').replace(/<main>[\s\S]*<\/main>/,()=>'<main>'+sheetBody(s,kind)+'</main>');
  }
  function init(){
    const $=id=>document.getElementById(id);let view=create(),valid=true,conditionValid=true,loadedRaw=null,screen=false,returnFocus=null;
    const s=()=>view.lesson,num=id=>$(id).value.trim()===''?NaN:Number($(id).value);
    function controls(){
      for(const k of ['a','h','k'])$(k).value=s().function[k];for(const k of ['left','right'])$(k).value=s().interval[k];
      $('nickname').value=s().nickname;$('question').value=s().question;$('class-size').value=s().classSize;$('path').value=s().path;$('teacher-memo').value=s().teacherMemo;
    }
    function questions(){
      $('questions').innerHTML=conditionValid?Q.questions(s().function,s().interval).map((q,i)=>`<fieldset><legend>${i+1}. ${Q.esc(q.title)}</legend>${q.options.map((o,j)=>`<label class="choice" for="q${i}-${j}"><input id="q${i}-${j}" type="radio" name="q${i}" value="${j}" ${view.selection[i]===j?'checked':''}>${Q.esc(o)}</label>`).join('')}<label for="reason-${i}">이유를 한 문장으로 (500자 이내 · 가상 연습)</label><textarea id="reason-${i}" maxlength="500">${Q.esc(view.reasons[i])}</textarea></fieldset>`).join(''):'';
      for(let i=0;i<3;i++){
        if(!conditionValid)break;
        $('reason-'+i).oninput=e=>{view.reasons[i]=e.target.value;};
        for(let j=0;j<3;j++)$(`q${i}-${j}`).onchange=()=>{view.selection[i]=j;view.revealed=false;update();};
      }
    }
    function counts(){
      for(const when of ['before','after']){
        $('counts-'+when).innerHTML=conditionValid?Q.questions(s().function,s().interval).map((q,i)=>`<fieldset><legend>${i+1}. ${Q.esc(q.title)}</legend><div class="count-grid">${q.options.map((o,j)=>`<div class="field"><label for="${when}-${i}-${j}">${j+1}번 ${Q.esc(o)} · 명</label><input id="${when}-${i}-${j}" type="number" min="0" max="60" step="1" inputmode="numeric" value="${s()[when][i][j]}"></div>`).join('')}</div></fieldset>`).join(''):'';
        if(conditionValid)for(let i=0;i<3;i++)for(let j=0;j<3;j++)$(`${when}-${i}-${j}`).oninput=()=>{s()[when][i][j]=num(`${when}-${i}-${j}`);update();};
      }
    }
    function update(){
      try{Q.conditions(s().function,s().interval);conditionValid=true;Q.validate(s());valid=true;$('input-error').textContent='';}
      catch(e){valid=false;$('input-error').textContent=e.message;}
      $('problem').innerHTML=conditionValid?problem(s()):'<p>올바른 함수·닫힌구간을 입력하세요.</p>';
      for(const when of ['before','after'])$('board-'+when).innerHTML=valid?Q.report(s()[when],s(),when==='before'?'수업 전 익명 집계':'수업 후 익명 집계'):'<p>입력 오류를 수정하세요.</p>';
      $('lesson').innerHTML=lesson(s());$('exit-question').textContent=exitQuestion(s());$('comparison').innerHTML=valid?Q.comparison(s()):'<p>입력 오류를 수정하면 비교가 표시됩니다.</p>';
      $('answer').hidden=!valid||!view.revealed;$('check-answer').setAttribute('aria-expanded',String(valid&&view.revealed));
      $('answer').innerHTML=valid&&view.revealed?Q.solution(s())+Q.questions(s().function,s().interval).map((q,i)=>`<article><h3>${i+1}. ${view.selection[i]===q.correct?'선택을 확인했어요':'다시 비교해 보세요'}</h3><p>정답: ${Q.esc(q.answer)}</p><p>${Q.esc(q.explanation)}</p></article>`).join(''):'';
      for(const id of ['check-answer','project-intro','project-exit','export-json','copy-json','manual-json','save-student','copy-student','manual-student','print-student','save-teacher','manual-teacher'])$(id).disabled=!valid;
      $('continue-lesson').disabled=loadedRaw===null;
      $('diagnosis-status').textContent=view.revealed&&valid?'선택을 확인했습니다. 이유도 듣고, 세 문항만으로 능력을 단정하지 마세요.':'';
    }
    function refresh(){controls();questions();counts();$('exit-response').value=view.exitResponse;update();}
    function openScreen(kind='intro'){
      if(!valid)return;returnFocus=document.activeElement;screen=true;
      $('screen-title').textContent=kind==='exit'?'출구 질문':'도입 질문';$('screen-question').textContent=kind==='exit'?exitQuestion(s()):s().question;
      $('screen-graph').innerHTML=`<p class="formula">${Q.esc(Q.formula(s().function))} · ${Q.intervalText(s().interval)}</p>${Q.graph(s().function,s().interval,false)}`;
      $('lesson-main').inert=true;$('class-screen').hidden=false;document.body.classList.add('projecting');$('close-screen').focus();
    }
    function closeScreen(){if(!screen)return;screen=false;$('class-screen').hidden=true;$('lesson-main').inert=false;document.body.classList.remove('projecting');if(returnFocus?.isConnected)returnFocus.focus();}
    document.addEventListener('keydown',e=>{
      if(screen){if(e.key==='Escape'){e.preventDefault();closeScreen();}if(e.key==='Tab'){e.preventDefault();$('close-screen').focus();}return;}
      if(e.key.toLowerCase()==='p'&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.repeat&&!e.target.closest?.('input,textarea,select,[contenteditable],.dialog-backdrop')){e.preventDefault();openScreen();}
    });
    $('project-intro').onclick=()=>openScreen();$('project-exit').onclick=()=>openScreen('exit');$('close-screen').onclick=closeScreen;
    for(const k of ['a','h','k','left','right'])$(k).oninput=()=>{
      try{setConditions(view,Object.fromEntries(['a','h','k'].map(k=>[k,num(k)])),Object.fromEntries(['left','right'].map(k=>[k,num(k)])));conditionValid=true;}
      catch{conditionValid=false;}
      $('exit-response').value='';questions();counts();update();$('data-status').textContent='조건 변경: 선택·답안·정답 공개·전후 집계를 초기화했습니다.';
    };
    for(const [id,key] of [['nickname','nickname'],['question','question'],['teacher-memo','teacherMemo']])$(id).oninput=()=>{s()[key]=$(id).value;update();};
    $('class-size').oninput=()=>{s().classSize=num('class-size');update();};
    $('path').onchange=()=>{s().path=$('path').value;view.exitResponse='';$('exit-response').value='';update();};
    $('exit-response').oninput=e=>{view.exitResponse=e.target.value;};
    $('check-answer').onclick=()=>{if(!valid)return;if(view.selection.some(v=>v===null)){$('diagnosis-status').textContent='세 문항의 답을 모두 고른 뒤 확인하세요.';return;}view.revealed=!view.revealed;update();};
    $('load-sample').onclick=()=>{if(!conditionValid)return;s().classSize=20;s().before=Q.sample(Q.questions(s().function,s().interval));s().after=zeros();$('class-size').value=20;counts();update();$('data-status').textContent='가상 20명 표본입니다. 수업 후 집계는 별도로 입력하세요.';};
    function load(raw){
      try{const next=Q.decode(raw);view=create();view.lesson=next;loadedRaw=Q.encode(next);conditionValid=true;refresh();$('data-status').textContent='JSON을 불러왔습니다. 선택·답안·정답 공개를 초기화했습니다.';return true;}
      catch(e){$('data-status').textContent='불러오기 거부: '+e.message+' 현재 자료를 유지합니다.';return false;}
    }
    $('import-text-button').onclick=()=>load($('import-text').value);
    $('import-json').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>Q.LIMIT)throw Error('파일은 32KB 이하여야 합니다.');load(await file.text());}catch(e){$('data-status').textContent='불러오기 거부: '+e.message+' JSON 붙여 넣기를 이용하세요.';}finally{$('import-json').value='';}};
    $('continue-lesson').onclick=()=>{if(loadedRaw===null)return;view=create();view.lesson=nextLesson(loadedRaw);loadedRaw=null;conditionValid=true;refresh();$('data-status').textContent='이전 출구 질문으로 다음 수업을 시작합니다. 전후 집계·선택·답안·교사 메모를 비웠습니다.';$('intro-title').tabIndex=-1;$('intro-title').focus();};
    $('export-json').onclick=()=>{if(valid)Lab.save('week6-quadratic-lesson.json',Q.encode(s()),'application/json;charset=utf-8');};
    $('copy-json').onclick=e=>{if(valid)Lab.copy(Q.encode(s()),e.currentTarget);};
    $('manual-json').onclick=()=>{if(valid)Lab.showText('수업 JSON 직접 복사',Q.encode(s()));};
    for(const kind of ['student','teacher']){
      $('save-'+kind).onclick=()=>{if(valid)Lab.save(`week6-lab-${kind}.html`,sheet(s(),kind),'text/html;charset=utf-8');};
      $('manual-'+kind).onclick=()=>{if(valid)Lab.showText((kind==='student'?'학생 활동지':'교사용 해설')+' HTML 직접 복사',sheet(s(),kind));};
    }
    $('copy-student').onclick=e=>{if(valid)Lab.copy(sheet(s()),e.currentTarget);};
    $('print-student').onclick=()=>{if(!valid)return;$('print-sheet').innerHTML=sheetBody(s());$('print-sheet').hidden=false;document.body.classList.add('printing-student');Lab.print();};
    window.addEventListener('afterprint',()=>{document.body.classList.remove('printing-student');$('print-sheet').hidden=true;$('print-sheet').innerHTML='';});
    api.ui={getState:()=>clone({...view,valid,screen,canContinue:loadedRaw!==null}),load,openScreen,closeScreen};refresh();
  }
  const api={create,reset,setConditions,exitQuestion,nextLesson,sheetBody,sheet,init};return api;
});
