const test = require('node:test');
const assert = require('node:assert/strict');
const loadBrowser = require('./load-browser');

const ctx = loadBrowser(['assets/lab.js', 'week3/fnlab.js']);
const F = ctx.FnLab;

test('일차함수 식 표기', () => {
  assert.equal(F.linear(2, 1), 'y=2x+1');
  assert.equal(F.linear(1, 0), 'y=x');
  assert.equal(F.linear(-1, -3), 'y=−x−3');
  assert.equal(F.linear(0, 4), 'y=4');
  assert.equal(F.linear(0.5, -0.5), 'y=0.5x−0.5');
});

test('이차함수 식 표기', () => {
  assert.equal(F.parabola(0, 0), 'y=x²');
  assert.equal(F.parabola(2, -1), 'y=(x−2)²−1');
  assert.equal(F.parabola(-3, 2), 'y=(x+3)²+2');
});

test('fmt는 −0과 부동소수 오차를 정리', () => {
  assert.equal(F.fmt(-0), '0');
  assert.equal(F.fmt(0.1 + 0.2), '0.3');
  assert.equal(F.fmt(-2.5), '−2.5');
});

test('y=x²와 y=(x−h)²+k의 교점', () => {
  assert.equal(F.intersection(0, 0), '모든 점에서 일치');
  assert.equal(F.intersection(0, 3), '교점 없음');
  // h=2, k=0: x = (4+0)/4 = 1
  assert.match(F.intersection(2, 0), /^교점의 x = 1 \(근삿값 1\.000\), y = x² ≈ 1\.000$/);
  // h=2, k=−1: x = 3/4
  assert.match(F.intersection(2, -1), /^교점의 x = 3\/4 /);
  // h=−1, k=0: x = 1/(−2)
  assert.match(F.intersection(-1, 0), /^교점의 x = -1\/2 /);
});

test('numOrNull은 빈칸을 0이 아닌 null로 돌려줌', () => {
  const values = { a: '', b: '  ', c: '3', d: 'abc' };
  ctx.document = { getElementById: id => (id in values ? { value: values[id] } : null) };
  assert.equal(F.numOrNull('a'), null);
  assert.equal(F.numOrNull('b'), null);
  assert.equal(F.numOrNull('c'), 3);
  assert.equal(F.numOrNull('d'), null);
  assert.equal(F.numOrNull('없음'), null);
});
