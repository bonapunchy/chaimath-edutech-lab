/* One lesson, five independent activity records; calculation/output uses Week5. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./matrix.js'));
  else {root.Week5Lab=factory(root.Week5);root.Week5Lab.init();}
})(typeof window==='undefined'?globalThis:window,function(M){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const cond=p=>Object.entries(p).map(([k,v])=>`${k}=${v}`).join(', ');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const NAMES=['개초보 · 2A−B 오답 카드','초보 · AB 3단계 힌트','중수 · AB·BA 재도전','고수 · 수량·단가 QP 처방','초고수 · (A+B)(A+B) 클리닉'];
  const INTROS=['2를 곱해야 하는 성분을 찾아 같은 위치끼리 빼세요.','앞 행렬의 행과 뒤 행렬의 열을 짝지어 보세요.','a, b, c를 바꾸어도 AB와 BA를 각각 계산해 비교하세요.','수량표의 열과 단가표의 행에서 교재 순서와 단위를 확인하세요.','이 숫자 예시에서 A+B를 직접 곱하고 네 곱의 성분별 합과 비교하세요.'];
  function fresh(type,params){return {type,params:clone(params??(type==='price'?M.PRICE:M.DEFAULT)),lineAttempts:[],lineFound:false,explanation:'',hintCount:0,retry:null,choice:null,retryAttempts:[],checksOpened:false,verified:false};}
  function createLesson(){return {active:0,student:'가상 학생 1번',steps:M.TYPES.map(t=>fresh(t))};}
  function findLine(step,line){
    if(![1,2,3].includes(line))throw Error('1~3번 줄을 선택하세요.');
    const correct=line===2;step.lineAttempts.push({line,correct});step.lineFound=correct;return correct;
  }
  const explained=s=>s.lineFound&&!!s.explanation.trim();
  function openHint(s){if(!explained(s))return false;if(s.hintCount>=3)return false;s.hintCount++;return true;}
  function makeRetry(s,random){
    if(!explained(s))return false;
    let p=s.retry?.params??s.params,r;
    // Avoid returning to the original numbers on repeated retries, or equal price choices.
    for(let n=0;n<25;n++){
      r=M.retry(s.type,p,random);p=r.params;
      if(s.type==='price'&&p.p1===p.p2)p={...p,p2:p.p2===9?1:p.p2+1};
      if(JSON.stringify(p)!==cond(r.params))r=M.retry(s.type,p,random);
      p=r.params;
      if(JSON.stringify(p)!==JSON.stringify(s.params)&&!M.equal(r.choices[0],r.choices[1]))break;
    }
    s.retry=r;s.choice=null;s.retryAttempts=[];s.checksOpened=false;s.verified=false;return r;
  }
  function choose(s,index){if(!s.retry||![0,1].includes(index))return false;s.choice=index;s.checksOpened=false;s.verified=false;return true;}
  function checkRetry(s){
    if(!explained(s)||!s.retry||s.choice===null)return null;
    const correct=s.choice===s.retry.correctIndex;s.retryAttempts.push({choice:s.choice,correct});s.checksOpened=false;s.verified=false;return correct;
  }
  const retryResult=s=>s.retryAttempts.length&&s.retryAttempts.at(-1).choice===s.choice?s.retryAttempts.at(-1).correct:null;
  const completed=s=>explained(s)&&retryResult(s)===true&&s.checksOpened&&s.verified;
  function summary(lesson){return lesson.steps.map((s,i)=>({step:i+1,title:NAMES[i],params:clone(s.params),lineResult:s.lineAttempts.length?s.lineAttempts.at(-1).correct:null,lineAttempts:clone(s.lineAttempts),hintCount:s.hintCount,retryResult:retryResult(s),retryParams:s.retry?clone(s.retry.params):null,retryAttempts:clone(s.retryAttempts),explanation:s.explanation,verified:s.verified,complete:completed(s)}));}
  function summaryHTML(lesson){return summary(lesson).map(r=>`<article class="summary-record"><h3>Step ${r.step} · ${esc(r.title)} <span class="chip ${r.complete?'chip-ok':'chip-warn'}">${r.complete?'완료':'진행 중'}</span></h3><p>찾은 줄: ${r.lineResult===null?'미선택':r.lineResult?'맞음':'틀림'} · 선택 기록: ${r.lineAttempts.map(a=>`${a.line}번 ${a.correct?'맞음':'틀림'}`).join(' → ')||'없음'}</p><p>힌트 사용: ${r.hintCount}/3 · 재도전: ${r.retryResult===null?'미확인':r.retryResult?'맞음':'틀림'} · 검산: ${r.verified?'완료':'대기'}</p><p>원래 조건: ${esc(cond(r.params))}${r.retryParams?' · 재도전 조건: '+esc(cond(r.retryParams)):''}</p><p>재도전 선택 기록: ${r.retryAttempts.map(a=>`${a.choice+1}번 ${a.correct?'맞음':'틀림'}`).join(' → ')||'없음'}</p><p>내 설명: ${esc(r.explanation||'아직 쓰지 않았습니다.')}</p></article>`).join('');}
  function summaryText(lesson){return `${lesson.student} · 오답 클리닉 기록 · 차이수학 원표쌤\n`+summary(lesson).map(r=>`\nStep ${r.step} · ${r.title}\n찾은 줄: ${r.lineAttempts.map(a=>`${a.line}번 ${a.correct?'맞음':'틀림'}`).join(' → ')||'미선택'}\n힌트 사용: ${r.hintCount}/3\n재도전: ${r.retryResult===null?'미확인':r.retryResult?'맞음':'틀림'}\n재도전 조건: ${r.retryParams?cond(r.retryParams):'없음'}\n검산: ${r.verified?'완료':'대기'}\n내 설명: ${r.explanation}`).join('\n');}
  function setParams(lesson,index,params){const d=M.derive(M.TYPES[index],params);if(M.equal(d.answer,d.wrong))throw Error('오답과 정답이 구별되도록 수량이나 단가를 바꿔 주세요.');lesson.steps[index]=fresh(M.TYPES[index],params);}
  function createBundle(){return {version:2,subject:'matrix-2022',nickname:M.SIGNATURE,feedback:'',memo:'',items:[]};}
  function addItem(bundle,type,params){
    if(bundle.items.length>=12)throw Error('최대 12개까지 담을 수 있습니다.');
    if(bundle.items.some(it=>it.type===type&&JSON.stringify(it.params)===JSON.stringify(params)))throw Error('같은 유형과 조건의 문제가 이미 담겨 있습니다.');
    let n=1;while(bundle.items.some(it=>it.id===`w5-lab${n}`))n++;
    const it=M.item(type,params,`w5-lab${n}`);bundle.items.push(it);return it;
  }
  function init(){
    const $=id=>document.getElementById(id);
    const lessons=new Map();let lesson=createLesson(),bundle=createBundle();lessons.set(lesson.student,lesson);
    const step=()=>lesson.steps[lesson.active];
    function renderSummary(){const done=lesson.steps.filter(completed).length;$('summary-status').textContent=`${lesson.student} · 5단계 중 ${done}단계 완료`;$('summary-records').innerHTML=summaryHTML(lesson);$('stepper').querySelectorAll('small').forEach((el,i)=>el.textContent=completed(lesson.steps[i])?'완료':'진행 전·진행 중');}
    function gates(){
      const s=step(),ready=explained(s),attempted=retryResult(s)!==null;
      $('my-explanation').disabled=!s.lineFound;$('open-hint').disabled=!ready||s.hintCount===3;$('generate-retry').disabled=!ready;
      $('hint-count').textContent=`힌트 ${s.hintCount}/3`;$('check-retry').disabled=!ready||!s.retry;
      $('open-checks').disabled=!ready||!attempted;$('verified').disabled=!ready||!s.checksOpened;
      $('add-retry').disabled=!s.retry;$('prev-step').disabled=lesson.active===0;
      $('next-step').textContent=lesson.active===4?'기록 확인 →':'다음 단계 →';renderSummary();
    }
    function renderHints(){const s=step(),d=M.derive(s.type,s.params),hints=[...d.hints];if(s.type==='order')hints[0]='AB와 BA에서 앞 행렬의 행과 뒤 행렬의 열은 어떻게 달라질까요?';$('hints').innerHTML=hints.slice(0,s.hintCount).map((h,i)=>`<p>${i+1}단계 힌트: ${esc(h)}</p>`).join('');}
    function renderRetry(){
      const s=step();$('retry-options').hidden=!s.retry;$('retry-problem').innerHTML=s.retry?M.given(M.derive(s.type,s.retry.params)):'';
      $('retry-legend').textContent=s.type==='order'?'두 결과 중 AB를 선택하세요':'계산 결과를 선택하세요';
      $('retry-choices').innerHTML=s.retry?s.retry.choices.map((a,i)=>`<div class="retry-choice"><label for="retry-choice-${i}"><input id="retry-choice-${i}" name="retry-choice" type="radio" value="${i}" ${s.choice===i?'checked':''}>결과 ${i+1}</label>${M.matrix(a,`결과 ${i+1}`,s.type==='price'?['1호점','2호점']:null,null,s.type==='price'?'천원':'')}</div>`).join(''):'';
      $('retry-choices').querySelectorAll('input').forEach(el=>el.onchange=()=>{choose(s,Number(el.value));$('retry-result').textContent='선택 확인을 눌러 주세요.';renderChecks();gates();});
      const result=retryResult(s);$('retry-result').textContent=result===null?'':result?'맞았어요. 성분별 계산도 대조해 보세요.':'다시 생각해 보세요. 성분별 검산에서 행·열 대응을 확인하고 다시 선택하세요.';renderChecks();
    }
    function renderChecks(){const s=step();$('checks').hidden=!s.checksOpened;$('open-checks').setAttribute('aria-expanded',String(s.checksOpened));$('checks').innerHTML=s.checksOpened?`<h4>처음 문제 검산</h4>${M.correctBody(M.derive(s.type,s.params))}<h4>재도전 검산</h4>${M.correctBody(M.derive(s.type,s.retry.params))}`:'';$('verified').checked=s.verified;}
    function render(){
      const s=step(),d=M.derive(s.type,s.params);
      $('step-title').textContent=`Step ${lesson.active+1} · ${NAMES[lesson.active]}`;$('step-intro').textContent=INTROS[lesson.active];$('step-panel').setAttribute('aria-labelledby',`step-${lesson.active+1}`);
      $('conditions').innerHTML=Object.entries(M.ranges(s.type)).map(([key,[min,max]])=>`<div class="field"><label for="param-${key}">${key} (${min}~${max})</label><input id="param-${key}" type="number" min="${min}" max="${max}" step="1" value="${s.params[key]}"></div>`).join('');
      $('conditions-details').open=lesson.active===2;$('condition-status').textContent='';$('flow-status').textContent='';
      $('problem').innerHTML='<h3>① 처음 틀린 줄 찾기</h3>'+M.given(d)+M.wrongBody(d);
      const wrongTitle=$('problem').querySelector('.wrong h3');wrongTitle.textContent='가상 학생의 풀이 · 처음 틀린 줄을 누르세요';
      const last=s.lineAttempts.at(-1);
      $('problem').querySelectorAll('.wrong ol > li').forEach((li,i)=>{
        const b=document.createElement('button');b.id=`wrong-line-${i+1}`;b.type='button';b.className='btn line-select';b.textContent=`${i+1}번 줄 · `+(i<2?li.textContent:'위 계산으로 얻은 결과');b.setAttribute('aria-pressed',String(last?.line===i+1));
        if(i<2)li.replaceChildren(b);else li.prepend(b);
        b.onclick=()=>{const correct=findLine(s,i+1);$('line-feedback').textContent=correct?'맞았어요. 2번 줄이 처음 틀린 줄입니다. 이유를 내 말로 써 보세요.':i===0?'1번 줄은 계산할 대상을 정한 줄입니다. 계산 방법을 바꾼 줄을 찾아보세요.':'3번 줄의 결과도 틀렸지만, 처음 잘못된 방법을 적용한 줄을 먼저 찾아보세요.';$('problem').querySelectorAll('.line-select').forEach((el,j)=>el.setAttribute('aria-pressed',String(i===j)));gates();};
      });
      $('line-feedback').textContent=last?(last.correct?'맞았어요. 처음 틀린 줄은 2번 줄입니다.':'최근 선택은 틀림입니다. 처음 틀린 방법을 적용한 줄을 찾아보세요.'):'아직 선택하지 않았습니다. Enter·Space로도 줄을 선택할 수 있습니다.';
      $('my-explanation').value=s.explanation;renderHints();renderRetry();$('stepper').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===lesson.active));b.tabIndex=i===lesson.active?0:-1;});gates();
    }
    function go(index,focus=false){lesson.active=Math.max(0,Math.min(4,index));render();if(focus)$(`step-${lesson.active+1}`).focus();}
    NAMES.forEach((name,i)=>{const b=document.createElement('button');b.id=`step-${i+1}`;b.type='button';b.className='btn';b.setAttribute('role','tab');b.setAttribute('aria-controls','step-panel');b.innerHTML=`Step ${i+1} · ${esc(name)}<small>진행 전·진행 중</small>`;b.onclick=()=>go(i);b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%5;if(e.key==='ArrowLeft')n=(i+4)%5;if(e.key==='Home')n=0;if(e.key==='End')n=4;if(n!==undefined){e.preventDefault();go(n,true);}};$('stepper').append(b);});
    $('my-explanation').oninput=e=>{step().explanation=e.target.value;gates();};
    $('open-hint').onclick=()=>{openHint(step());renderHints();gates();};
    $('generate-retry').onclick=()=>{makeRetry(step());renderRetry();gates();};
    $('check-retry').onclick=()=>{const r=checkRetry(step());if(r===null){$('retry-result').textContent='먼저 결과를 선택해 주세요.';return;}renderRetry();gates();};
    $('open-checks').onclick=()=>{step().checksOpened=!step().checksOpened;if(!step().checksOpened)step().verified=false;renderChecks();gates();};
    $('verified').onchange=e=>{step().verified=e.target.checked;gates();};
    $('apply-conditions').onclick=()=>{try{const params=Object.fromEntries(Object.keys(M.ranges(step().type)).map(k=>[k,$('param-'+k).value.trim()===''?NaN:Number($('param-'+k).value)]));setParams(lesson,lesson.active,params);render();$('condition-status').textContent='조건을 적용했습니다. 현재 단계의 활동 기록을 새로 시작합니다.';}catch(e){$('condition-status').textContent=e.message;}};
    $('prev-step').onclick=()=>{go(lesson.active-1);$('step-title').focus();};
    $('next-step').onclick=()=>{if(!completed(step())){$('flow-status').textContent='틀린 줄 찾기 → 내 설명 → 재도전 정답 확인 → 성분별 검산 체크를 마치세요. 힌트는 선택입니다.';return;}if(lesson.active<4){go(lesson.active+1);$('step-title').focus();}else $('summary-title').focus();};
    $('virtual-student').onchange=e=>{if(!lessons.has(e.target.value)){const freshLesson=createLesson();freshLesson.student=e.target.value;lessons.set(e.target.value,freshLesson);}lesson=lessons.get(e.target.value);render();};
    $('copy-record').onclick=e=>Lab.copy(summaryText(lesson),e.currentTarget);$('manual-record').onclick=()=>Lab.showText('오답 클리닉 기록 · 직접 복사',summaryText(lesson));
    const ready=()=>bundle.items.length>0&&bundle.items.every(it=>it.reviewed);
    const status=message=>{$('bundle-status').textContent=message;};
    function bundleGates(){
      for(const kind of ['student','teacher'])for(const action of ['save','copy','manual'])$(action+'-'+kind).disabled=!ready();
      for(const action of ['export-json','copy-json','manual-json'])$(action).disabled=!bundle.items.length;
    }
    function sheets(){for(const kind of ['student','teacher'])$('sheet-'+kind).innerHTML=bundle.items.length?M.sheetBody(bundle,kind==='teacher'):'문항을 담으면 미리 보기가 나타납니다.';bundleGates();}
    function renderBundle(){
      $('bundle-list').innerHTML=bundle.items.map((it,i)=>`<li class="bundle-item"><details><summary>${i+1}. ${esc(NAMES[M.TYPES.indexOf(it.type)])} · ${it.reviewed?'검토 완료':'검토 대기'}</summary>${M.given(M.derive(it.type,it.params))}${M.wrongBody(M.derive(it.type,it.params),true)}${M.correctBody(M.derive(it.type,it.params))}<div class="field"><label for="question-${it.id}">수업 질문</label><textarea id="question-${it.id}" maxlength="300">${esc(it.question)}</textarea></div><div class="field"><label for="memo-${it.id}">문항 교사 메모</label><textarea id="memo-${it.id}" maxlength="600">${esc(it.memo)}</textarea></div></details><label class="review-label" for="review-${it.id}"><input id="review-${it.id}" type="checkbox" ${it.reviewed?'checked':''}>행·열·단위·계산·질문 교사 검토 완료</label><div class="row"><button id="up-${it.id}" class="btn" type="button" ${i===0?'disabled':''}>위로</button><button id="down-${it.id}" class="btn" type="button" ${i===bundle.items.length-1?'disabled':''}>아래로</button><button id="remove-${it.id}" class="btn" type="button">삭제</button></div></li>`).join('');
      bundle.items.forEach((it,i)=>{
        const title=$('review-'+it.id).closest('li').querySelector('summary');
        const updateTitle=()=>{title.textContent=`${i+1}. ${NAMES[M.TYPES.indexOf(it.type)]} · ${it.reviewed?'검토 완료':'검토 대기'}`;};
        $('review-'+it.id).onchange=e=>{it.reviewed=e.target.checked;updateTitle();sheets();status(ready()?'모든 문항 검토 완료 · 자료를 따로 저장하세요.':'검토 대기 문항이 있습니다.');};
        for(const field of ['question','memo'])$(field+'-'+it.id).oninput=e=>{it[field]=e.target.value;it.reviewed=false;$('review-'+it.id).checked=false;updateTitle();sheets();status('문항이 바뀌어 다시 검토해야 합니다.');};
        for(const [action,delta] of [['up',-1],['down',1]])$(action+'-'+it.id).onclick=()=>{const target=i+delta;if(target<0||target>=bundle.items.length)return;[bundle.items[i],bundle.items[target]]=[bundle.items[target],bundle.items[i]];renderBundle();};
        $('remove-'+it.id).onclick=()=>{bundle.items.splice(i,1);renderBundle();status('문항을 삭제했습니다.');};
      });sheets();
    }
    function collect(retry){try{const s=step();addItem(bundle,s.type,retry?s.retry.params:s.params);renderBundle();status('문항을 담았습니다. 교사 검토 후 저장하세요.');}catch(e){status(e.message);}}
    $('add-item').onclick=()=>collect(false);$('add-retry').onclick=()=>collect(true);
    for(const field of ['feedback','memo'])$(field).oninput=e=>{bundle[field]=e.target.value;bundle.items.forEach(it=>it.reviewed=false);renderBundle();status('교사 내용이 바뀌어 모든 문항을 다시 검토해야 합니다.');};
    for(const kind of ['student','teacher']){
      const content=()=>M.sheetHTML(bundle,kind==='teacher');
      $('save-'+kind).onclick=()=>{if(ready())Lab.save(`week5-lab-${kind}.html`,content(),'text/html;charset=utf-8');};
      $('copy-'+kind).onclick=e=>{if(ready())Lab.copy(content(),e.currentTarget);};
      $('manual-'+kind).onclick=()=>{if(ready())Lab.showText(`${kind==='teacher'?'교사용 해설':'학생 활동지'} HTML · 직접 복사`,content());};
    }
    $('export-json').onclick=()=>{if(bundle.items.length)Lab.save('week5-lab-matrix.json',M.exportBundle(bundle),'application/json;charset=utf-8');};
    $('copy-json').onclick=e=>{if(bundle.items.length)Lab.copy(M.exportBundle(bundle),e.currentTarget);};
    $('manual-json').onclick=()=>{if(bundle.items.length)Lab.showText('문제 묶음 JSON · 직접 복사',M.exportBundle(bundle));};
    function applyImport(raw){try{const imported=M.importBundle(raw);bundle=imported;for(const field of ['feedback','memo'])$(field).value=bundle[field];renderBundle();status(`${bundle.items.length}개 불러오기 완료 · 모든 문항 검토 대기`);return true;}catch(e){status('불러오기 실패: '+e.message);return false;}}
    $('import-text-button').onclick=()=>applyImport($('import-text').value);
    $('import-json').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error('JSON은 200KB 이하로 불러와 주세요.');applyImport(await file.text());}catch(error){status('불러오기 실패: '+error.message);}e.target.value='';};
    const api={getState:()=>clone({lesson,bundle}),go,applyImport};window.Week5Lab.ui=api;render();renderBundle();
  }
  return {NAMES,createLesson,fresh,findLine,openHint,makeRetry,choose,checkRetry,retryResult,completed,summary,summaryHTML,summaryText,setParams,createBundle,addItem,init};
});
