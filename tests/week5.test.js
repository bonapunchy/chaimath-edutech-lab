const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../week5/matrix.js');
const L = require('../week5/lab.js');

const explainedStep = type => {
  const s = L.fresh(type);
  L.findLine(s, 2);
  s.explanation = '가상 설명';
  return s;
};

test('기본 예시 다섯 개가 원문 성분과 일치', () => {
  assert.doesNotThrow(() => M.assertDefaults());
});

test('행렬 곱셈과 성분별 검산', () => {
  const A = [[3, 2], [1, 4]], B = [[1, 1], [0, 1]];
  const C = M.multiply(A, B);
  assert.deepEqual(C, [[3, 5], [1, 5]]);
  assert.equal(M.verifyProduct(A, B, C).length, 4);
  assert.throws(() => M.verifyProduct(A, B, [[3, 5], [1, 6]]), /\(2,2\)성분/);
  assert.throws(() => M.multiply([[1, 2]], [[1, 2]]), /안쪽 행·열 수/);
});

test('조건 범위 검사', () => {
  assert.throws(() => M.validateParams('scalar', { a: 1, b: 2, c: 4 }), /a 값은 2~9/);
  assert.throws(() => M.validateParams('scalar', { a: 3, b: 2 }), /c 필드가 빠졌습니다/);
  assert.throws(() => M.validateParams('nope', M.DEFAULT), /지원하지 않는 오류 유형/);
});

test('틀린 줄을 찾고 설명을 써야 힌트·재도전이 열림', () => {
  const s = L.fresh('product');
  assert.equal(L.openHint(s), false);
  assert.equal(L.makeRetry(s), false);
  assert.equal(L.findLine(s, 1), false);
  assert.equal(L.findLine(s, 2), true);
  assert.equal(L.openHint(s), false, '설명 없이 힌트 불가');
  s.explanation = '  ';
  assert.equal(L.makeRetry(s), false, '공백 설명은 미작성');
  s.explanation = '같은 위치끼리 곱했다';
  for (let i = 0; i < 3; i++) assert.equal(L.openHint(s), true);
  assert.equal(L.openHint(s), false, '힌트는 3개까지');
  assert.throws(() => L.findLine(s, 4), /1~3번 줄/);
});

test('재도전은 조건을 한 칸씩 바꾸고 원래 조건으로 돌아가지 않음', () => {
  for (const type of M.TYPES) {
    const s = explainedStep(type);
    const key = type === 'price' ? 'q11' : 'a';
    const [min, max] = M.ranges(type)[key];
    const seen = [];
    for (let n = 0; n < max - min + 3; n++) {
      const before = (s.retry ? s.retry.params : s.params)[key];
      const r = L.makeRetry(s, () => 0.1);
      assert.notDeepEqual(r.params, s.params, `${type}: 원래 조건과 달라야 함`);
      assert.ok(!M.equal(r.choices[0], r.choices[1]), `${type}: 두 선택지는 달라야 함`);
      const expected = before === max ? min : before + 1;
      // Skipping the original value is the only allowed jump.
      const next = expected === s.params[key] ? (expected === max ? min : expected + 1) : expected;
      assert.equal(r.params[key], next, `${type}: ${before} 다음은 ${next}`);
      seen.push(r.params[key]);
    }
    assert.ok(!seen.includes(s.params[key]), `${type}: 원래 값 ${s.params[key]}이 나오면 안 됨`);
  }
});

test('재도전 정답 위치와 채점', () => {
  const s = explainedStep('scalar');
  const r = L.makeRetry(s, () => 0.9);
  const d = M.derive('scalar', r.params);
  assert.equal(r.correctIndex, 1);
  assert.deepEqual(r.choices[1], d.answer);
  assert.equal(L.checkRetry(s), null, '선택 전에는 채점하지 않음');
  L.choose(s, 0);
  assert.equal(L.checkRetry(s), false);
  L.choose(s, 1);
  assert.equal(L.checkRetry(s), true);
  assert.equal(L.completed(s), false, '검산 체크 전');
  s.checksOpened = true;
  s.verified = true;
  assert.equal(L.completed(s), true);
});

test('단계 표시: 진행 전 → 진행 중 → 완료', () => {
  const s = L.fresh('order');
  assert.equal(L.progress(s), '진행 전');
  L.findLine(s, 1);
  assert.equal(L.progress(s), '진행 중');
  L.findLine(s, 2);
  s.explanation = '순서를 바꿨다';
  const r = L.makeRetry(s, () => 0.1);
  L.choose(s, r.correctIndex);
  L.checkRetry(s);
  s.checksOpened = s.verified = true;
  assert.equal(L.progress(s), '완료');
});

test('setParams는 정답과 오답이 같아지는 조건을 거부', () => {
  const lesson = L.createLesson();
  const price = M.TYPES.indexOf('price');
  assert.throws(() => L.setParams(lesson, price, { ...M.PRICE, p2: M.PRICE.p1 }), /구별되도록/);
  L.setParams(lesson, price, { ...M.PRICE, q11: 7 });
  assert.equal(lesson.steps[price].params.q11, 7);
});

test('문제 묶음: 중복·12개 제한, JSON 왕복 시 검토 상태 초기화', () => {
  const bundle = L.createBundle();
  L.addItem(bundle, 'scalar', M.DEFAULT);
  assert.throws(() => L.addItem(bundle, 'scalar', M.DEFAULT), /이미 담겨/);
  for (let a = 3; a <= 9; a++) L.addItem(bundle, 'product', { ...M.DEFAULT, a });
  for (let a = 2; a <= 5; a++) L.addItem(bundle, 'order', { ...M.DEFAULT, a });
  assert.equal(bundle.items.length, 12);
  assert.throws(() => L.addItem(bundle, 'mixed', M.DEFAULT), /최대 12개/);
  bundle.items[0].reviewed = true;
  const json = M.exportBundle(bundle);
  assert.equal(JSON.parse(json).items[0].reviewed, true);
  const back = M.importBundle(json);
  assert.equal(back.items.length, 12);
  assert.ok(back.items.every(it => it.reviewed === false));
});

test('문제 묶음 불러오기 검증', () => {
  const ok = JSON.parse(M.exportBundle({ ...L.createBundle(), items: [M.item('mixed', M.DEFAULT, 'w5-a')] }));
  assert.throws(() => M.importBundle('{'), /JSON 문법/);
  assert.throws(() => M.importBundle({ ...ok, version: 1 }), /버전 2/);
  assert.throws(() => M.importBundle({ ...ok, subject: 'x' }), /matrix-2022/);
  assert.throws(() => M.importBundle({ ...ok, extra: 1 }), /지원하지 않는 필드/);
  assert.throws(() => M.importBundle({ ...ok, items: [{ ...ok.items[0], id: 'bad id' }] }), /문항 ID/);
  assert.throws(() => M.importBundle({ ...ok, items: [ok.items[0], ok.items[0]] }), /중복된 문항 ID/);
  assert.throws(() => M.importBundle('x'.repeat(200001)), /200KB/);
});

test('기록 HTML은 학생 설명을 이스케이프', () => {
  const lesson = L.createLesson();
  lesson.steps[0].explanation = '<img src=x onerror=alert(1)>';
  const html = L.summaryHTML(lesson);
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
});
