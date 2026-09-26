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
