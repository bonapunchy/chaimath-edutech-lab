/* Five numeric error templates; no external services or shared-asset changes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.Week5 = api; if (document.body.dataset.mode !== 'integrated') api.init(); }
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const TYPES = ['scalar', 'product', 'order', 'price', 'mixed'];
  const TITLES = ['행렬 연산 오답 카드', '행렬 곱셈 힌트 카드', '곱셈 순서 재도전', '실생활 행렬 처방 묶음', '행렬 혼합연산 클리닉 스튜디오'];
  const LEVELS = ['개초보', '초보', '중수', '고수', '초고수'];
  const DEFAULT = {a:3,b:2,c:4};
  const PRICE = {q11:3,q12:5,q21:1,q22:5,p1:2,p2:3};
  const SIGNATURE = '차이수학 원표쌤';
  // Guaranteed standalone layout even if a browser denies file:// CSSOM access.
  const SHEET_CSS = `:root{color-scheme:light;--paper:#F5F7F2;--surface:#FFFFFF;--ink:#15261F;--muted:#5A6B63;--line:#D9E0D8;--accent:#1E6A4C;--accent-soft:#E3F0E8;--highlight:#E2B33C;--graph-f:#2F6FB0;--graph-g:#C2452D;--ok:#2E7D4F;--warn:#B7791F;--bad:#B3402E;--font-title:"Nanum Myeongjo",Georgia,serif;--font-body:"IBM Plex Sans KR","Malgun Gothic",sans-serif;--font-mono:"IBM Plex Mono",Consolas,monospace}
  @media(prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--paper:#0F1714;--surface:#16211C;--ink:#E4ECE6;--muted:#9AAAA1;--line:#2A3832;--accent:#5BBF8F;--accent-soft:#1C3128;--graph-f:#6FA8E0;--graph-g:#E07A62;--ok:#72C996;--warn:#E1B45C;--bad:#EE8979}}
  :root[data-theme="dark"]{color-scheme:dark;--paper:#0F1714;--surface:#16211C;--ink:#E4ECE6;--muted:#9AAAA1;--line:#2A3832;--accent:#5BBF8F;--accent-soft:#1C3128;--graph-f:#6FA8E0;--graph-g:#E07A62;--ok:#72C996;--warn:#E1B45C;--bad:#EE8979}
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.65 var(--font-body);overflow-wrap:anywhere}.lab-shell{max-width:1120px;margin:auto;padding:32px max(16px,4vw)}h1,h2{font-family:var(--font-title);line-height:1.35}article{padding:20px 0;border-bottom:1px solid var(--line)}.matrix-row{display:flex;flex-wrap:wrap;gap:1rem}.matrix{margin:0;max-width:100%}.matrix figcaption{font-weight:700}.matrix-array{position:relative;display:inline-block;padding:0 10px;margin:.5rem 0}.matrix-array:before,.matrix-array:after{content:'';position:absolute;top:0;bottom:0;width:7px;border-top:2px solid;border-bottom:2px solid}.matrix-array:before{left:0;border-left:2px solid}.matrix-array:after{right:0;border-right:2px solid}.matrix table{border-collapse:collapse;font:1.15rem var(--font-mono)}.matrix td{padding:.4rem .5rem;text-align:center;min-width:2em}.axis{font-size:.85rem;color:var(--muted)}.wrong,.correct{background:var(--surface);border-left:4px solid;padding:1rem;margin:1rem 0}.wrong{border-color:var(--bad)}.correct{border-color:var(--ok)}.wrong-line{border-bottom:2px dotted var(--bad)}.formula{font-family:var(--font-mono)}.steps{padding-left:1.4rem}.steps li{margin:.5rem 0}.blank{min-height:3rem;border-bottom:1px solid var(--line);margin-bottom:1rem}.eyebrow{color:var(--accent);font-size:.85rem}
  @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  @media print{body{background:white;color:black}.lab-shell{padding:0;max-width:none}article{break-before:page;break-inside:avoid}article:first-of-type{break-before:auto}.wrong,.correct{background:white}.blank{min-height:4rem}button,input,textarea,select,.no-print{display:none!important}}`;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = n => String(n).replace(/-/g,'−');
  const clone = x => JSON.parse(JSON.stringify(x));
  const equal = (A,B) => A.length === B.length && A.every((row,i)=>row.length===B[i].length && row.every((v,j)=>v===B[i][j]));
  function shape(A) {
    if (!Array.isArray(A) || A.length<1 || A.length>2 || !Array.isArray(A[0]) || A[0].length<1 || A[0].length>2 || A.some(row=>!Array.isArray(row)||row.length!==A[0].length||row.some(v=>!Number.isInteger(v)))) throw Error('행렬은 정수 성분을 가진 두 행·두 열 이하의 표여야 합니다.');
    return [A.length,A[0].length];
  }
  function combine(A,B,sign=1) {
    const s=shape(A),t=shape(B); if(s[0]!==t[0]||s[1]!==t[1])throw Error('덧셈·뺄셈은 행과 열의 수가 각각 같아야 합니다.');
    return A.map((row,i)=>row.map((v,j)=>v+sign*B[i][j]));
  }
  const scale = (A,k) => {shape(A);return A.map(row=>row.map(v=>k*v));};
  function multiply(A,B) {
    const [r,k]=shape(A),[s,c]=shape(B); if(k!==s)throw Error('곱하는 두 행렬의 안쪽 행·열 수가 맞지 않습니다.');
    return Array.from({length:r},(_,i)=>Array.from({length:c},(_,j)=>A[i].reduce((total,v,n)=>total+v*B[n][j],0)));
  }
  // Independently recompute each entry, rather than comparing output to itself.
  function verifyProduct(A,B,C) {
    const [r,k]=shape(A),[s,c]=shape(B);if(k!==s||C.length!==r)throw Error('성분별 검산에서 행렬 크기가 맞지 않습니다.');
    const checks=[];
    for(let i=0;i<r;i++)for(let j=0;j<c;j++){
      const expected=A[i][0]*B[0][j]+(k===2?A[i][1]*B[1][j]:0);
      if(expected!==C[i][j])throw Error(`(${i+1},${j+1})성분의 검산에 실패했습니다.`);
      checks.push({i:i+1,j:j+1,expression:dot(A[i],B.map(row=>row[j])),value:expected});
    }
    return checks;
  }
  // Keep every row×column product visible, including ×1 and ×0, so students see each pairing.
  function term(a,b) { return `${num(a)}×${num(b)}`; }
  function dot(row,col) {return row.map((v,k)=>term(v,col[k])).filter(Boolean).join(' + ')||'0';}
  function ranges(type) {
    return type==='price'?{q11:[1,20],q12:[1,20],q21:[1,20],q22:[1,20],p1:[1,9],p2:[1,9]}:{a:[2,9],b:[1,8],c:[1,9]};
  }
  function keys(obj,allowed,label) {
    if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error(`${label} 형식이 올바르지 않습니다.`);
    for(const key of Object.keys(obj))if(!allowed.includes(key))throw Error(`${label}에 지원하지 않는 필드가 있습니다: ${key}`);
    for(const key of allowed)if(!Object.hasOwn(obj,key))throw Error(`${label}에서 ${key} 필드가 빠졌습니다.`);
  }
  function validateParams(type,p) {
    if(!TYPES.includes(type))throw Error('지원하지 않는 오류 유형입니다. 다섯 행렬 오류 유형만 사용할 수 있습니다.');
    const rules=ranges(type);keys(p,Object.keys(rules),'행렬 조건');
    for(const [key,[min,max]] of Object.entries(rules))if(!Number.isInteger(p[key])||p[key]<min||p[key]>max)throw Error(`${key} 값은 ${min}~${max} 범위의 정수로 입력해 주세요.`);
    return p;
  }
  function derive(type,p=type==='price'?PRICE:DEFAULT) {
    validateParams(type,p);
    const A=type==='price'?[[p.q11,p.q12],[p.q21,p.q22]]:[[p.a,p.b],[1,p.c]];
    const B=type==='price'?[[p.p1],[p.p2]]:[[1,1],[0,1]];
    let answer,wrong,checks=[],parts=[],reason,question;
    if(type==='scalar') {
      const twice=scale(A,2);answer=combine(twice,B,-1);wrong=combine([[2*p.a,p.b],[1,2*p.c]],B,-1);
      const back=combine(answer,B);
      for(let i=0;i<2;i++)for(let j=0;j<2;j++){
        const expected=2*A[i][j]-B[i][j];if(answer[i][j]!==expected||back[i][j]!==2*A[i][j])throw Error('실수배·뺄셈 검산에 실패했습니다.');
        checks.push({i:i+1,j:j+1,expression:`${term(2,A[i][j])}${B[i][j]?' − '+num(B[i][j]):''}`,value:expected,back:`${num(answer[i][j])}${B[i][j]?' + '+num(B[i][j]):''} = ${num(back[i][j])}`});
      }
      parts=[{label:'2A',value:twice}];reason='실수배는 대각성분뿐 아니라 네 성분 모두에 적용합니다. 그다음 같은 위치의 성분끼리 B를 뺍니다.';
      question='실수배에서 빠진 성분은 어느 위치인가요? 같은 위치 성분끼리 더하거나 빼려면 행렬의 크기는 어떠해야 할까요?';
    } else if(type==='mixed') {
      const S=combine(A,B);answer=multiply(S,S);checks=verifyProduct(S,S,answer);
      const AA=multiply(A,A),AB=multiply(A,B),BA=multiply(B,A),BB=multiply(B,B);
      wrong=combine(combine(AA,scale(AB,2)),BB);
      parts=[{label:'A+B',value:S},{label:'A²',value:AA,checks:verifyProduct(A,A,AA)},{label:'AB',value:AB,checks:verifyProduct(A,B,AB)},{label:'BA',value:BA,checks:verifyProduct(B,A,BA)},{label:'B²',value:BB,checks:verifyProduct(B,B,BB)}];
      const expanded=combine(combine(AA,AB),combine(BA,BB));
      for(let i=0;i<2;i++)for(let j=0;j<2;j++)if(answer[i][j]!==expanded[i][j])throw Error('네 곱의 성분별 합과 직접 계산이 다릅니다.');
      reason=`이 숫자 예시에서 (AB)₁₁=${num(AB[0][0])}, (BA)₁₁=${num(BA[0][0])}입니다. 서로 다른 교차곱을 2AB로 합친 줄이 틀렸습니다. A+B를 먼저 구해 직접 곱하세요.`;
      question='A+B를 먼저 곱한 결과와 이 예시의 A², AB, BA, B²를 각각 더한 결과를 비교해 보세요.';
    } else {
      answer=multiply(A,B);checks=verifyProduct(A,B,answer);
      if(type==='product') {wrong=A.map((row,i)=>row.map((v,j)=>v*B[i][j]));reason='행렬 곱은 같은 위치 성분끼리의 곱이 아닙니다. 결과의 (i,j)성분은 앞 행렬의 i행과 뒤 행렬의 j열을 곱해 더합니다.';question='결과의 (1,2)성분에 필요한 행과 열을 찾아 표시해 보세요.';}
      if(type==='order') {wrong=multiply(B,A);parts=[{label:'BA',value:wrong,checks:verifyProduct(B,A,wrong)}];reason=`이 수치 예시의 (AB)₁₁=${num(answer[0][0])}, (BA)₁₁=${num(wrong[0][0])}로 다릅니다. 주어진 숫자에서는 곱셈 순서를 바꾼 결과가 같지 않습니다.`;question='이 예시의 AB와 BA에서 같은 위치 성분을 하나씩 비교해 보세요.';}
      if(type==='price') {wrong=multiply(A,[[p.p2],[p.p1]]);verifyProduct(A,[[p.p2],[p.p1]],wrong);reason='Q의 열은 교재A, 교재B 순서입니다. P의 행도 같은 품목 순서를 지켜야 합니다. 단가 순서를 바꾸면 다른 교재의 단가를 곱하게 됩니다. 권×천원/권=천원이므로 결과는 지점별 총액입니다.';question='교재의 순서를 바꾸려면 Q의 열과 P의 행을 어떻게 함께 바꾸어야 할까요?';}
    }
    const hints=type==='scalar'?['실수배는 어느 성분에 적용할까요?','(1,2)성분과 (2,1)성분도 찾아보세요.',`2A의 (1,2)는 ${term(2,p.b)}, (2,1)은 2입니다. 그다음 B를 빼세요.`]:type==='price'?['Q의 열과 P의 행에서 품목 순서가 같은가요?','Q의 첫째 행과 P의 한 열을 선택하세요.',`1호점은 ${dot(A[0],B.map(r=>r[0]))}로 계산합니다.`]:type==='mixed'?['A+B를 먼저 하나의 행렬로 만들어 보세요.','이 예시의 AB와 BA에서 (1,1)성분을 비교하세요.',`AB의 (1,1)은 ${p.a}, BA의 (1,1)은 ${p.a+1}입니다.`]:['같은 위치 성분끼리 곱한 풀이가 행렬 곱의 방법과 맞을까요?','(1,2)성분에는 A의 첫째 행과 B의 둘째 열이 필요합니다.',`(1,2)성분의 계산 단서는 ${dot(A[0],B.map(r=>r[1]))}입니다. 곱한 뒤 더하세요.`];
    return {type,p:clone(p),A,B,answer,wrong,checks,parts,reason,question,hints};
  }
  function assertDefaults() {
    for(const [t,expected,bad] of [['scalar',[[5,3],[2,7]],[[5,1],[1,7]]],['product',[[3,5],[1,5]],[[3,2],[0,4]]],['order',[[3,5],[1,5]],[[4,6],[1,4]]],['price',[[21],[17]],[[19],[13]]],['mixed',[[19,27],[9,28]],[[18,26],[9,29]]]]){
      const d=derive(t);if(!equal(d.answer,expected)||!equal(d.wrong,bad))throw Error('기본 예시의 성분이 원문과 일치하지 않습니다.');
    }
  }
  function retryParams(type,p) {
    const next=clone(p),key=type==='price'?'q11':'a',[min,max]=ranges(type)[key];next[key]=p[key]===max?min:p[key]+1;return next;
  }
  function retry(type,p,random=Math.random) {
    const params=retryParams(type,p),d=derive(type,params),correctIndex=random()<.5?0:1;
    return {type,params,choices:correctIndex===0?[d.answer,d.wrong]:[d.wrong,d.answer],correctIndex};
  }
  function matrix(M,label,rows,cols,unit='') {
    shape(M);const rowLabels=rows||M.map((_,i)=>`${i+1}행`),colLabels=cols||M[0].map((_,j)=>`${j+1}열`);
    return `<figure class="matrix"><figcaption>${esc(label)}${unit?' · '+esc(unit):''}</figcaption><div class="matrix-array"><table aria-label="${esc(label)} ${esc(unit)}"><tbody>${M.map((row,i)=>`<tr>${row.map((v,j)=>`<td aria-label="${esc(rowLabels[i])}, ${esc(colLabels[j])}">${num(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p class="axis">행: ${rowLabels.map(esc).join(' · ')}<br>열: ${colLabels.map(esc).join(' · ')}</p></figure>`;
  }
  function given(d) {
    return '<div class="matrix-row">'+(d.type==='price'?matrix(d.A,'Q · 주문 수량',['1호점','2호점'],['교재A','교재B'],'권')+matrix(d.B,'P · 단가',['교재A','교재B'],['단가'],'천원/권'):matrix(d.A,'A')+matrix(d.B,'B'))+'</div>';
  }
  const formula = type => ({scalar:'2A−B',product:'AB',order:'AB와 BA',price:'QP',mixed:'(A+B)(A+B)'}[type]);
  function wrongBody(d,mark=false) {
    const line={scalar:'대각성분에만 2를 곱합니다.',product:'같은 위치 성분끼리 곱합니다.',order:'이 예시에서도 AB=BA라고 두고 순서를 바꿉니다.',price:`단가의 품목 순서를 바꿔 ${num(d.p.p2)}, ${num(d.p.p1)} 순서로 곱합니다.`,mixed:'이 예시에서 AB=BA라고 두고 A²+2AB+B²로 계산합니다.'}[d.type];
    return `<div class="wrong"><h3>의도된 오답 풀이</h3><ol><li>${esc(formula(d.type))}를 계산합니다.</li><li${mark?' class="wrong-line"':''}>${esc(line)}${mark?' ← 틀린 줄':''}</li><li>${matrix(d.wrong,'오답 결과',d.type==='price'?['1호점','2호점']:null,null,d.type==='price'?'천원':'')}</li></ol></div>`;
  }
  function checkList(checks,back=false) {
    return `<ul class="steps">${checks.map(c=>`<li class="formula">(${c.i},${c.j})성분: ${esc(c.expression)} = ${num(c.value)}${back?`<br>되돌려 검산: ${esc(c.back)}`:''} · 확인</li>`).join('')}</ul>`;
  }
  function correctBody(d) {
    return `<div class="correct"><h3>교정 풀이 · 성분별 검산</h3><p>${esc(d.reason)}</p>${matrix(d.answer,'교정 결과',d.type==='price'?['1호점','2호점']:null,null,d.type==='price'?'천원':'')}${d.type==='scalar'?'<p class="formula">(2A−B)+B=2A · 네 성분을 되돌려 확인합니다.</p>':'<p>각 성분에서 필요한 행과 열을 곱해 더한 값과 결과를 대조했습니다.</p>'}${checkList(d.checks,d.type==='scalar')}${d.parts.length?'<h4>이 숫자 예시의 중간 계산</h4>'+d.parts.map(part=>matrix(part.value,part.label)+(part.checks?checkList(part.checks):'')).join(''):''}${d.type==='mixed'?'<p>이 예시의 A²+AB+BA+B²를 네 성분별로 더해 직접 계산과 같음을 확인했습니다.</p>':''}</div>`;
  }
  function text(value,label,max) {if(typeof value!=='string'||value.length>max)throw Error(`${label}는 ${max}자 이하의 글로 입력해 주세요.`);return value;}
  function importBundle(input) {
    if(typeof input==='string'&&input.length>200000)throw Error('JSON은 200KB 이하로 불러와 주세요.');
    let data;try{data=typeof input==='string'?JSON.parse(input):clone(input);}catch{throw Error('JSON 문법이 올바르지 않습니다. 저장한 JSON 전체를 넣어 주세요.');}
    keys(data,['version','subject','nickname','feedback','memo','items'],'수업 묶음');
    if(data.version!==2)throw Error('버전 2 행렬 클리닉 JSON만 불러올 수 있습니다.');
    if(data.subject!=='matrix-2022')throw Error('subject는 matrix-2022여야 합니다. 다른 과목 파일은 사용할 수 없습니다.');
    text(data.nickname,'별명',40);if(!data.nickname.trim())throw Error('별명을 입력해 주세요.');text(data.feedback,'피드백',600);text(data.memo,'교사 메모',600);
    if(!Array.isArray(data.items)||data.items.length<1||data.items.length>12)throw Error('문제 묶음은 1~12개로 구성해 주세요.');
    const ids=new Set();
    data.items=data.items.map((item,index)=>{
      keys(item,['id','type','params','question','memo','reviewed'],`${index+1}번 문항`);
      if(typeof item.id!=='string'||!/^w5-[A-Za-z0-9_]{1,40}$/.test(item.id))throw Error('문항 ID는 w5-로 시작하는 영문·숫자·밑줄 형식이어야 합니다.');
      if(ids.has(item.id))throw Error(`중복된 문항 ID가 있습니다: ${item.id}`);ids.add(item.id);
      validateParams(item.type,item.params);text(item.question,'수업 질문',300);text(item.memo,'문항 교사 메모',600);
      if(typeof item.reviewed!=='boolean')throw Error('검토 상태는 true 또는 false여야 합니다.');
      derive(item.type,item.params);return {...item,reviewed:false};
    });return data;
  }
  function exportBundle(bundle) {const checked=importBundle(bundle);checked.items.forEach((item,i)=>item.reviewed=bundle.items[i].reviewed);return JSON.stringify(checked,null,2);}
  function item(type,params,id) {return {id,type,params:clone(params),question:derive(type,params).question,memo:'',reviewed:false};}
  function article(it,index,teacher) {
    const d=derive(it.type,it.params),again=derive(it.type,retryParams(it.type,it.params));
    return `<article><p class="eyebrow">가상 학생 · ${index+1}번</p><h2>${esc(TITLES[TYPES.indexOf(it.type)])}</h2><p class="formula">${esc(formula(it.type))}를 구하고 의도된 오답을 고쳐 보세요.</p>${given(d)}${wrongBody(d,teacher)}<p>처음 틀린 줄: __________</p><p>내 설명: ________________________________________</p><div class="blank" aria-label="풀이 빈칸"></div><p>수업 질문: ${esc(it.question)}</p>${teacher?correctBody(d):'<p>내 계산과 성분별 검산을 써 보세요.</p><div class="blank"></div>'}<h3>숫자가 다른 재도전</h3><p class="formula">${esc(formula(it.type))}를 다시 계산해 보세요.</p>${given(again)}${teacher?correctBody(again):'<div class="blank"></div>'}${teacher?`<p>교사 메모: ${esc(it.memo)}</p>`:''}</article>`;
  }
  function sheetBody(bundle,teacher) {return `<p class="eyebrow">초강스 에듀테크 LAB · 5주차 · ${teacher?'교사용 해설 · 정답 포함':'학생 활동지'}</p><h1>행렬 오답 클리닉</h1><p>${bundle.nickname===SIGNATURE?SIGNATURE:`${esc(bundle.nickname)} · ${SIGNATURE}`}</p><p>2022 개정 공통수학1 [10공수1-04-01], [10공수1-04-02]</p>${bundle.items.map((it,i)=>article(it,i,teacher)).join('')}${teacher?`<p>수업 피드백: ${esc(bundle.feedback)}</p><p>묶음 교사 메모: ${esc(bundle.memo)}</p>`:''}<footer>${SIGNATURE} · 실제 학생 정보 없이 만든 수업 자료</footer>`;}
  function sheetHTML(bundle,teacher,styles) {
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>행렬 ${teacher?'교사용 해설':'학생 활동지'}</title><style>${styles||SHEET_CSS}</style></head><body><main class="lab-shell sheet">${sheetBody(bundle,teacher)}</main></body></html>`;
  }
  function init() {
    assertDefaults();
    const $=id=>document.getElementById(id),level=Number(document.body.dataset.level),baseType=TYPES[level-1];
    let type=baseType,params=clone(type==='price'?PRICE:DEFAULT),hint=0,revealed=level===1,retryState=null,choice=null,invalid=false,editId=null,serial=0;
    const makeItem=(t,p)=>{let id;do{id=`w5-item${++serial}`;}while(bundle.items.some(it=>it.id===id));return item(t,p,id);};
    let bundle={version:2,subject:'matrix-2022',nickname:SIGNATURE,feedback:'행과 열의 위치를 먼저 확인하고, 빠뜨린 성분 없이 계산해 보세요.',memo:'',items:[]};
    if(level===4)bundle.items=[PRICE,{...PRICE,q11:4,q12:6},{...PRICE,q11:6,q22:3}].map(p=>makeItem('price',p));
    else if(level===5)bundle.items=[makeItem('mixed',DEFAULT),makeItem('product',{a:4,b:3,c:2}),makeItem('price',PRICE)];
    const button=(id,label)=>`<button id="${id}" type="button" class="btn">${label}</button>`;
    $('nickname').value=bundle.nickname;$('feedback').value=bundle.feedback;
    $('type-control').hidden=level!==5;
    $('template-type').innerHTML=TYPES.map((t,i)=>`<option value="${t}">${TITLES[i]}</option>`).join('');$('template-type').value=type;
    $('bundle-panel').hidden=level<4;$('json-tools').hidden=level!==5;
    function status(msg){$('bundle-status').textContent=msg;}
    function reset(){hint=0;revealed=level===1;retryState=null;choice=null;$('my-explanation').value='';$('retry-result').textContent='';$('retry-checks').innerHTML='';}
    function conditions(){
      $('conditions').innerHTML=Object.entries(ranges(type)).map(([key,[min,max]])=>{
        const label=type==='price'?({q11:'1호점 교재A (권)',q12:'1호점 교재B (권)',q21:'2호점 교재A (권)',q22:'2호점 교재B (권)',p1:'교재A 단가 (천원/권)',p2:'교재B 단가 (천원/권)'})[key]:key;
        return `<div class="field"><label for="${key}">${label} · ${min}~${max} 정수</label><input id="${key}" type="number" min="${min}" max="${max}" step="1" value="${params[key]}" aria-describedby="input-error">${level===3?`<label for="${key}-range" class="note">${key} 슬라이더</label><input id="${key}-range" type="range" min="${min}" max="${max}" value="${params[key]}">`:''}</div>`;
      }).join('');
      $('conditions-wrap').hidden=level<3;
      Object.keys(ranges(type)).forEach(key=>{
        $(key).oninput=()=>{const p=Object.fromEntries(Object.keys(ranges(type)).map(k=>[k,$(k).value.trim()===''?NaN:Number($(k).value)]));reset();try{validateParams(type,p);params=p;invalid=false;$('input-error').textContent='';if(level===3)Object.keys(p).forEach(k=>$(k+'-range').value=p[k]);}catch(e){invalid=true;$('input-error').textContent=e.message;}render();};
        if(level===3)$(key+'-range').oninput=()=>{$(key).value=$(key+'-range').value;$(key).dispatchEvent(new Event('input'));};
      });
    }
    function current(){const it=item(type,params,'w5-current');it.question=$('question').value;return it;}
    function outputBundle(){return {...bundle,items:level<4?[current()]:bundle.items};}
    function ready(){return !invalid && (level<4 || (bundle.items.length>=(level===4?3:1)&&bundle.items.every(it=>it.reviewed)));}
    function renderSheets(){for(const kind of ['student','teacher'])$('sheet-'+kind).innerHTML=sheetBody(outputBundle(),kind==='teacher');for(const kind of ['student','teacher']){$('save-'+kind).disabled=!ready();$('copy-'+kind).disabled=!ready();$('print-'+kind).disabled=!ready();}$('manual-copy').disabled=!ready();$('add-item').disabled=invalid;$('export-json').disabled=invalid;}
    function render(){
      const d=derive(type,params);$('problem').innerHTML=`<h2>${esc(formula(type))}를 계산해 보세요.</h2>${given(d)}${wrongBody(d,level===1)}`;
      $('hints').innerHTML=d.hints.slice(0,hint).map((h,i)=>`<p><strong>힌트 ${i+1} · ${['관찰','행·열 선택','계산 단서'][i]}</strong><br>${esc(h)}</p>`).join('');
      $('open-hint').disabled=invalid||hint>=3;$('open-answer').disabled=invalid;$('open-answer').setAttribute('aria-expanded',String(revealed));
      $('answer').hidden=!revealed;$('answer').innerHTML=revealed?correctBody(d):'';
      $('live-order').hidden=level!==3;$('live-order').innerHTML=level===3?correctBody(d):'';
      $('retry-panel').hidden=level!==3;$('retry-problem').innerHTML='';$('retry-choices').innerHTML='';
      if(retryState){const r=derive(retryState.type,retryState.params);$('retry-problem').innerHTML='<h3>바뀐 숫자로 AB를 구하세요.</h3>'+given(r);$('retry-choices').innerHTML=retryState.choices.map((M,i)=>`<label class="choice"><input id="retry-choice-${i}" type="radio" name="retry-choice" value="${i}" ${choice===i?'checked':''}> 선택 ${i+1}${matrix(M,'선택 '+(i+1))}</label>`).join('');$('retry-choices').querySelectorAll('input').forEach(el=>el.onchange=()=>{choice=Number(el.value);$('retry-result').textContent='';$('retry-checks').innerHTML='';});}
      $('check-retry').disabled=invalid||!retryState;$('generate-retry').disabled=invalid;renderSheets();
    }
    function renderBundle(){
      $('bundle-list').innerHTML=bundle.items.map((it,i)=>`<li class="bundle-item"><details id="detail-${it.id}"><summary>${i+1}번 · ${esc(TITLES[TYPES.indexOf(it.type)])} · ${it.reviewed?'검토 완료':'검토 대기'}</summary>${given(derive(it.type,it.params))}${wrongBody(derive(it.type,it.params),true)}${correctBody(derive(it.type,it.params))}<div class="field"><label for="question-${it.id}">수업 질문 (300자 이내)</label><textarea id="question-${it.id}" maxlength="300">${esc(it.question)}</textarea></div><div class="field"><label for="memo-${it.id}">문항 교사 메모 (학생 자료 제외, 600자 이내)</label><textarea id="memo-${it.id}" maxlength="600">${esc(it.memo)}</textarea></div></details><div class="row"><label class="review-label"><input id="review-${it.id}" type="checkbox" ${it.reviewed?'checked':''}> 행·열·단위·성분별 계산·질문 검토 완료</label>${button('edit-'+it.id,'조건 편집')}${button('up-'+it.id,'위로')}${button('down-'+it.id,'아래로')}${button('delete-'+it.id,'삭제')}</div></li>`).join('');
      bundle.items.forEach((it,i)=>{
        $('review-'+it.id).onchange=e=>{it.reviewed=e.target.checked;$('detail-'+it.id).querySelector('summary').textContent=`${i+1}번 · ${TITLES[TYPES.indexOf(it.type)]} · ${it.reviewed?'검토 완료':'검토 대기'}`;renderSheets();status(`${bundle.items.filter(x=>x.reviewed).length}/${bundle.items.length}개 검토 완료`);};
        for(const field of ['memo','question'])$(field+'-'+it.id).oninput=e=>{it[field]=e.target.value;it.reviewed=false;$('review-'+it.id).checked=false;$('detail-'+it.id).querySelector('summary').textContent=`${i+1}번 · ${TITLES[TYPES.indexOf(it.type)]} · 검토 대기`;renderSheets();status('문장을 수정해 이 문항의 검토가 대기로 바뀌었습니다.');};
        $('edit-'+it.id).onclick=()=>{type=it.type;params=clone(it.params);editId=it.id;$('template-type').value=type;$('question').value=it.question;reset();conditions();render();$('add-item').textContent='편집한 조건 반영';$('conditions-wrap').scrollIntoView({block:'center'});};
        $('delete-'+it.id).onclick=()=>{bundle.items.splice(i,1);if(editId===it.id){editId=null;$('add-item').textContent='현재 문제 담기';}renderBundle();renderSheets();status('문항을 삭제했습니다.');};
        for(const [direction,offset] of [['up',-1],['down',1]]){const el=$(direction+'-'+it.id);el.disabled=i+offset<0||i+offset>=bundle.items.length;el.onclick=()=>{const j=i+offset;[bundle.items[i],bundle.items[j]]=[bundle.items[j],bundle.items[i]];renderBundle();renderSheets();$(direction+'-'+it.id).focus();};}
      });
    }
    function selectTab(tab){document.body.dataset.tab=tab;for(const t of ['clinic','student','teacher']){$('panel-'+t).hidden=t!==tab;$('tab-'+t).setAttribute('aria-selected',String(t===tab));$('tab-'+t).tabIndex=t===tab?0:-1;}}
    for(const tab of ['clinic','student','teacher']){
      $('tab-'+tab).onclick=()=>selectTab(tab);
      $('tab-'+tab).onkeydown=e=>{const tabs=['clinic','student','teacher'],i=tabs.indexOf(tab);let j;if(e.key==='ArrowRight')j=(i+1)%3;if(e.key==='ArrowLeft')j=(i+2)%3;if(e.key==='Home')j=0;if(e.key==='End')j=2;if(j!==undefined){e.preventDefault();selectTab(tabs[j]);$('tab-'+tabs[j]).focus();}};
    }
    for(const field of ['nickname','feedback','memo'])$(field).oninput=e=>{bundle[field]=e.target.value;if(field==='nickname'&&!e.target.value.trim())bundle.nickname=SIGNATURE;if(level>=4)bundle.items.forEach((it,i)=>{it.reviewed=false;$('review-'+it.id).checked=false;$('detail-'+it.id).querySelector('summary').textContent=`${i+1}번 · ${TITLES[TYPES.indexOf(it.type)]} · 검토 대기`;});renderSheets();status('내용을 바꿨습니다. 자료를 다시 검토해 주세요.');};
    $('template-type').onchange=()=>{type=$('template-type').value;params=clone(type==='price'?PRICE:DEFAULT);editId=null;invalid=false;reset();$('input-error').textContent='';$('question').value=derive(type,params).question;$('add-item').textContent='현재 문제 담기';conditions();render();};
    $('question').value=derive(type,params).question;$('question').oninput=renderSheets;
    $('open-hint').onclick=()=>{hint++;render();};$('open-answer').onclick=()=>{revealed=!revealed;render();};
    $('generate-retry').onclick=()=>{retryState=retry('order',params);choice=null;$('retry-result').textContent='';$('retry-checks').innerHTML='';render();};
    $('check-retry').onclick=()=>{if(choice===null){$('retry-result').textContent='두 선택지 중 하나를 먼저 골라 주세요.';return;}const d=derive('order',retryState.params);$('retry-result').textContent=choice===retryState.correctIndex?'맞았어요. 네 성분을 검산해 보세요.':'곱셈 순서를 다시 확인해 보세요. AB는 A의 행과 B의 열을 사용합니다.';$('retry-checks').innerHTML=correctBody(d);};
    $('add-item').onclick=()=>{
      const same=bundle.items.find(it=>it.id!==editId&&it.type===type&&JSON.stringify(it.params)===JSON.stringify(params));if(same){status('같은 유형과 조건이 이미 있습니다. 숫자를 바꾸어 주세요.');return;}
      if(editId){const it=bundle.items.find(x=>x.id===editId);it.type=type;it.params=clone(params);it.question=$('question').value;it.reviewed=false;editId=null;$('add-item').textContent='현재 문제 담기';}
      else {if(bundle.items.length>=12){status('문제 묶음은 최대 12개입니다. 기존 문항을 삭제한 뒤 추가해 주세요.');return;}const it=makeItem(type,params);it.question=$('question').value;bundle.items.push(it);}
      renderBundle();renderSheets();status('문항을 담았습니다. 교사 검토 후 학생용·교사용 자료를 저장하세요.');
    };
    // CSS is copied into standalone documents without fetch or external assets.
    function styles(){return Array.from(document.styleSheets).flatMap(sheet=>{try{return Array.from(sheet.cssRules).filter(rule=>rule.type!==3).map(rule=>rule.cssText);}catch{return [];}}).join('\n');}
    for(const kind of ['student','teacher']){
      $('save-'+kind).onclick=()=>{if(ready())Lab.save(`week5-l${level}-${kind}.html`,sheetHTML(outputBundle(),kind==='teacher',styles()),'text/html;charset=utf-8');};
      $('copy-'+kind).onclick=e=>{if(ready())Lab.copy(sheetHTML(outputBundle(),kind==='teacher',styles()),e.currentTarget);};
      $('print-'+kind).onclick=()=>{if(ready()){selectTab(kind);Lab.print();}};
    }
    $('export-json').onclick=()=>Lab.save('week5-matrix-clinic.json',exportBundle(bundle),'application/json;charset=utf-8');
    function applyImport(raw){try{const parsed=importBundle(raw);bundle=parsed;editId=null;type=bundle.items[0].type;params=clone(bundle.items[0].params);invalid=false;reset();$('input-error').textContent='';$('add-item').textContent='현재 문제 담기';for(const field of ['nickname','feedback','memo'])$(field).value=bundle[field];$('template-type').value=type;$('question').value=bundle.items[0].question;conditions();renderBundle();render();status(`${bundle.items.length}개를 불러왔습니다. 모든 문항은 검토 대기입니다.`);}catch(e){status('불러오기 실패: '+e.message);}}
    $('import-json').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(file.size>200000){status('JSON은 200KB 이하로 불러와 주세요.');e.target.value='';return;}try{applyImport(await file.text());}catch{status('파일을 읽지 못했습니다. JSON 내용을 직접 붙여 넣어 주세요.');}e.target.value='';};
    $('import-text-button').onclick=()=>applyImport($('import-text').value);
    $('manual-copy').onclick=()=>Lab.showText('학생 활동지 HTML · 직접 복사',sheetHTML(outputBundle(),false,styles()));
    const api={getState:()=>clone({type,params,hint,revealed,retryState,choice,invalid,bundle}),selectTab,applyImport};
    window.Week5.ui=api;conditions();renderBundle();render();
  }
  assertDefaults();
  return {TYPES,TITLES,LEVELS,DEFAULT,PRICE,SIGNATURE,shape,combine,scale,multiply,verifyProduct,equal,derive,assertDefaults,ranges,validateParams,retryParams,retry,matrix,given,wrongBody,correctBody,importBundle,exportBundle,item,sheetHTML,sheetBody,init};
});
