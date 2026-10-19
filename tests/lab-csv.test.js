const test = require('node:test');
const assert = require('node:assert/strict');
const loadBrowser = require('./load-browser');

const { Lab } = loadBrowser(['assets/lab.js']);
// Arrays made inside the VM have another realm's prototype; compare as plain data.
const plain = x => JSON.parse(JSON.stringify(x));

test('CSV: 따옴표·쉼표·줄바꿈이 있는 값을 왕복 저장', () => {
  const rows = [['이름', '메모'], ['가상학생 A', '쉼표, "따옴표"\n줄바꿈']];
  const parsed = plain(Lab.csv.parse(Lab.csv.stringify(rows)));
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.header, rows[0]);
  assert.deepEqual(parsed.rows, [rows[1]]);
});

test('CSV: safe 옵션은 수식으로 읽힐 값 앞에 작은따옴표를 붙임', () => {
  const out = Lab.csv.stringify([['=1+1', '+2', '-3', '@x', '평범']], { safe: true });
  assert.equal(out, "'=1+1,'+2,'-3,'@x,평범");
});

test('CSV: bom 옵션', () => {
  assert.ok(Lab.csv.stringify([['a']], { bom: true }).startsWith('﻿'));
});

test('CSV: 닫히지 않은 따옴표를 오류로 알림', () => {
  const { errors } = Lab.csv.parse('a,b\r\n"열린 따옴표,1');
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /닫히지 않은 따옴표/);
});
