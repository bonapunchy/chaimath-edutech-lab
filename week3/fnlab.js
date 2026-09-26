/* WEEK 3 shared mathematical model and equal-unit SVG graph. */
window.FnLab = (() => {
  'use strict';
  const id = name => document.getElementById(name);
  const esc = value => Lab.esc(value);
  const f = x => x * x;
  const g = (x, h, k) => (x - h) ** 2 + k;
  const line = (x, m, b) => m * x + b;
  const fmt = n => { const v = Number(Number(n).toFixed(6)); return v < 0 ? `−${String(-v)}` : String(Object.is(v, -0) ? 0 : v); };
  const signed = n => n < 0 ? `−${fmt(-n)}` : `+${fmt(n)}`;
  const coef = m => m === 1 ? '' : m === -1 ? '−' : fmt(m);
  const linear = (m, b) => m === 0 ? `y=${fmt(b)}` : `y=${coef(m)}x${b === 0 ? '' : signed(b)}`;
  const parabola = (h, k) => `y=${h === 0 ? 'x²' : `(x${signed(-h)})²`}${k === 0 ? '' : signed(k)}`;
  const num = (name, fallback = 0) => {
    const n = Number(id(name)?.value);
    return Number.isFinite(n) ? n : fallback;
  };
  const point = (x, y) => `(${fmt(x)}, ${fmt(y)})`;
  function graph(target, curves, points = [], options = {}) {
    const el = typeof target === 'string' ? id(target) : target;
    if (!el) return;
    const W = 640, H = 400, unit = 34, ox = 320, oy = 200;
    const X = x => ox + x * unit, Y = y => oy - y * unit;
    const grid = [];
    for (let x = -9; x <= 9; x++) grid.push(`<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${H}"/>`);
    for (let y = -5; y <= 5; y++) grid.push(`<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}"/>`);
    const labels = [];
    for (let x = -9; x <= 9; x += 2) if (x) labels.push(`<text x="${X(x)}" y="${oy + 17}" text-anchor="middle">${x}</text>`);
    for (let y = -5; y <= 5; y += 2) if (y) labels.push(`<text x="${ox + 6}" y="${Y(y) - 5}">${y}</text>`);
    const paths = curves.map(({fn, color, label}) => {
      const d = [];
      for (let i = 0; i <= 760; i++) {
        const x = -10 + i / 38, y = fn(x);
        if (Number.isFinite(y)) d.push(`${d.length ? 'L' : 'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`);
      }
      return `<path d="${d.join(' ')}" fill="none" stroke="${color}" stroke-width="3"/><title>${esc(label || '')}</title>`;
    }).join('');
    const dots = points.map(({x,y,color,label}) => `<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="${color || 'var(--accent)'}"><title>${esc(label || point(x,y))}</title></circle>`).join('');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(options.label || '함수 그래프. 가로축과 세로축의 한 눈금 길이가 같습니다.')}"><defs><clipPath id="${el.id}-clip"><rect width="${W}" height="${H}"/></clipPath></defs><g stroke="var(--line)" stroke-width="1">${grid.join('')}</g><g stroke="var(--muted)" stroke-width="1.8"><line x1="0" y1="${oy}" x2="${W}" y2="${oy}"/><line x1="${ox}" y1="0" x2="${ox}" y2="${H}"/></g><g fill="var(--muted)" font-size="12" font-family="var(--font-mono)">${labels.join('')}<text x="${W-16}" y="${oy-7}">x</text><text x="${ox+8}" y="15">y</text></g><g clip-path="url(#${el.id}-clip)">${paths}${dots}</g></svg>`;
  }
  function intersection(h, k) {
    if (h === 0) return k === 0 ? '모든 점에서 일치' : '교점 없음';
    const numerator = h * h + k, denominator = 2 * h;
    const x = numerator / denominator, y = x * x;
    const gcd = (a,b) => b ? gcd(b, a % b) : Math.abs(a);
    const decimalPlaces = n => (String(n).split('.')[1] || '').length;
    const scale = 10 ** Math.min(8, Math.max(decimalPlaces(numerator), decimalPlaces(denominator)));
    const up = Math.round(numerator * scale), down = Math.round(denominator * scale);
    const d = gcd(up,down);
    const a = up / d * Math.sign(down), b = Math.abs(down / d);
    const exact = b === 1 ? `${a}` : `${a}/${b}`;
    return `교점의 x = ${exact} (근삿값 ${x.toFixed(3)}), y = x² ≈ ${y.toFixed(3)}`;
  }
  return {id,esc,f,g,line,fmt,signed,linear,parabola,num,point,graph,intersection};
})();
