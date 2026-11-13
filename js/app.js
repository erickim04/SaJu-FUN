(function(){
'use strict';
const C=window.SajuCore;
const S=window.SajuSymbolicNumbers;
const F=window.SajuFortune;
const $=id=>document.getElementById(id);
const colors={목:'wood',화:'fire',토:'earth',금:'metal',수:'water'};
const hex={목:'#338c64',화:'#ce6b56',토:'#b49255',금:'#8392a1',수:'#5282b2'};
const now=new Date();
let calY=now.getFullYear(),calM=now.getMonth()+1,selected=now.getDate(),results=null, activeTime='standard',birth=null,numberVariant=0, analyzing=false;
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function opts(sel, values, selected){sel.innerHTML=values.map(([v,t])=>`<option value="${e(v)}" ${String(v)===String(selected)?'selected':''}>${e(t)}</option>`).join('');}
function initForm(){
 const date=new Date();opts($('month'),Array.from({length:12},(_,i)=>[i+1,`${i+1}월`]),6);
 opts($('day'),Array.from({length:31},(_,i)=>[i+1,`${i+1}일`]),25);
 opts($('hour'),[['','모름 / 미입력'],...Array.from({length:24},(_,i)=>[i,`${C.pad(i)}시`])],'11');
 opts($('minute'),Array.from({length:60},(_,i)=>[i,`${C.pad(i)}분`]),33);
 const ps=[...new Set(C.CITY_LIST.map(x=>x.province))];opts($('province'),ps.map(x=>[x,x]),'서울특별시');updateCities('서울');
 $('province').addEventListener('change',()=>updateCities());
 $('calendarType').addEventListener('change',()=>{$('leapField').hidden=$('calendarType').value!=='lunar';});
 $('hour').addEventListener('change',()=>{$('minute').disabled=$('hour').value==='';});
 $('minute').disabled=$('hour').value==='';
 $('birthForm').addEventListener('submit',onSubmit);
 $('remember').addEventListener('change',()=>{if(!$('remember').checked){safeRemove();notice('이 기기에서 저장된 출생정보를 삭제하도록 처리했습니다.',true);}});
 try{const saved=localStorage.getItem('saju-personal-data-v1');if(saved){const d=JSON.parse(saved);for(const id of ['calendarType','year','month','day','leapMonth','gender','province','hour','minute'])if(d[id]!==undefined)$(id).value=d[id];updateCities(d.city);$('leapField').hidden=$('calendarType').value!=='lunar';$('minute').disabled=$('hour').value==='';$('remember').checked=true;notice('이전에 저장한 출생정보를 이 기기에 불러왔습니다.',true);}}catch(_){/* 파일 실행/브라우저 설정에 따라 저장소 접근이 막힐 수 있음 */}
}
function updateCities(preferred){const list=C.CITY_LIST.filter(x=>x.province===$('province').value);opts($('city'),list.map(x=>[x.id,x.name]),list.find(x=>x.name===preferred)?.id??list[0]?.id);}
function safeRemove(){try{localStorage.removeItem('saju-personal-data-v1');}catch(_){/* 저장소가 차단된 경우 무시 */}}
function notice(msg,good=false){const n=$('formNotice');n.textContent=msg;n.className='notification'+(good?' good':'');n.hidden=false;}
function uiStage(message){
 const node=$('analysisStage');if(node)node.textContent=message;
}
function uiBusy(busy){
 analyzing=busy;
 const progress=$('analysisProgress');if(progress)progress.hidden=!busy;
 const button=$('analyze');if(button){button.disabled=busy;button.setAttribute('aria-busy',String(busy));}
 if($('analyzeLabel'))$('analyzeLabel').textContent=busy?'분석 중…':'사주 분석하기';
 if($('analyzeArrow'))$('analyzeArrow').hidden=busy;
 if($('analyzeSpinner'))$('analyzeSpinner').hidden=!busy;
}
function jumpToResult(){
 const el=$('result-section');if(!el)return;
 try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(_){}
 try{el.scrollIntoView({behavior:'auto',block:'start'});}catch(_){location.hash='result-section';}
}
function showFailure(err){
 const message=(err&&err.message)||String(err||'알 수 없는 오류');
 $('analysisComplete').hidden=true;
 notice(message,false);
 const banner=$('analysisAlert');banner.textContent='분석할 수 없습니다: '+message;
 banner.hidden=false;
 try{banner.scrollIntoView({block:'center',behavior:'auto'});}catch(_){}
 console.error('[사주 분석 오류]',err);
}
function onSubmit(ev){
 if(ev&&ev.preventDefault)ev.preventDefault();
 if(analyzing)return;
 $('analysisAlert').hidden=true;
 $('analysisComplete').hidden=true;
 $('formNotice').hidden=true;
 uiStage('출생정보 확인 및 만세력 계산 중…');
 uiBusy(true);
 // Paint at least one frame before doing synchronous ephemeris calculations.
 // Users can see the progress state even if their device is slower.
 const start=()=>{
  try{
   if(!window.SajuCore)throw Error('만세력 계산 코드가 로드되지 않았습니다. v1.6 전체 파일을 올렸는지 확인해 주세요.');
   if(window.SajuEntry){
    const checked=window.SajuEntry.commitAll();
    if(!checked.ok)throw Error(checked.message);
   }
   const v={};for(const id of ['calendarType','year','month','day','leapMonth','gender','province','city','hour','minute'])v[id]=$(id).value;
   const y=Number(v.year),m=Number(v.month),d=Number(v.day);
   if(v.calendarType==='solar'?!C.validGregorian(y,m,d):!(Number.isInteger(y)&&y>=1900&&y<=2100&&Number.isInteger(m)&&m>=1&&m<=12&&Number.isInteger(d)&&d>=1&&d<=30))throw Error('1900~2100년 범위의 올바른 생년월일을 입력해 주세요.');
   let sol={y,m,d};if(v.calendarType==='lunar')sol=C.lunarToSolar(y,m,d,v.leapMonth==='1');
   if(sol.y<1900||sol.y>2100)throw Error('양력 변환 결과가 지원 연도(1900~2100)를 벗어납니다.');
   const hasTime=v.hour!=='';
   const h=hasTime?Number(v.hour):12,mi=hasTime?Number(v.minute):0;
   const matched=C.resolveKoreaWall(sol.y,sol.m,sol.d,h,mi);
   if(!matched.length)throw Error('출생 기록의 시간이 당시 한국 법정 시간에 존재하지 않습니다. 서머타임 변경 구간이 아닌지 확인해 주세요.');
   const city=C.CITY_LIST.find(x=>String(x.id)===v.city);
   if(!city)throw Error('출생도시를 선택해 주세요.');
   uiStage('사주 원국과 오행 결과를 구성하는 중…');
   const utc=matched[0],ambiguous=matched.length>1;
   const newResults=C.computePillars(utc,city.longitude,hasTime);
   if(!Array.isArray(newResults)||newResults.length===0)throw Error('사주 계산 결과가 비어 있습니다.');
   results=newResults;numberVariant=0;activeTime='standard';birth={...v,solar:sol,city,utc,ambiguous,hasTime};
   // A failure in an optional section must never hide the core pillars.
   $('resultEmpty').hidden=true;$('elementEmpty').hidden=true;
   $('resultBody').hidden=false;$('elementBody').hidden=false;
   try{renderAllResults();}catch(renderError){
    console.error('[결과 화면 오류]',renderError);
    // Preserve core result: provide a simple but complete readable fallback.
    const p=results[0];
    $('resultIntro').textContent=`양력 ${sol.y}.${C.pad(sol.m)}.${C.pad(sol.d)} · ${city.name}`;
    $('pillars').textContent=`년주 ${p.year.hanja}(${p.year.ko}) / 월주 ${p.month.hanja}(${p.month.ko}) / 일주 ${p.day.hanja}(${p.day.ko}) / 시주 ${p.hour?p.hour.hanja+'('+p.hour.ko+')':'미입력'}`;
    $('resultWarning').textContent='일부 상세 카드 출력에 문제가 있어 기본 원국을 먼저 표시합니다. 상세 오류: '+(renderError.message||renderError);
    try{renderElements(p);}catch(_){}
   }
   if($('numbersEmpty')&&$('numbersBody')){
    $('numbersEmpty').hidden=false;$('numbersBody').hidden=true;
    if(S){try{$('numbersEmpty').hidden=true;$('numbersBody').hidden=false;renderNumbers();}catch(numberError){$('numbersEmpty').textContent='부가 숫자 콘텐츠를 표시하지 못했습니다. 사주 원국과 오행 결과는 위에서 확인할 수 있습니다.';$('numbersEmpty').hidden=false;$('numbersBody').hidden=true;console.warn(numberError);}}
   }
   if($('remember').checked){try{localStorage.setItem('saju-personal-data-v1',JSON.stringify(v));}catch(_){$('remember').checked=false;}}else safeRemove();
   notice(`완료: 양력 ${sol.y}년 ${sol.m}월 ${sol.d}일 · ${city.name} 출생 기준으로 분석 결과를 표시했습니다.`,true);
   $('analysisAlert').hidden=true;
   $('completeSummary').textContent=`양력 ${sol.y}.${C.pad(sol.m)}.${C.pad(sol.d)} · ${city.name} · 사주 원국·오행 결과가 표시되었습니다.`;
   $('analysisComplete').hidden=false;
   // Show the results; explicit button remains visible if the host browser blocks automatic scroll.
   setTimeout(jumpToResult,40);
  }catch(err){showFailure(err);}
  finally{uiBusy(false);}
 };
 if(typeof window.requestAnimationFrame==='function')window.requestAnimationFrame(()=>setTimeout(start,90));
 else setTimeout(start,90);
}
function renderAllResults(){if(!results)return;const p=results.find(x=>x.key===activeTime)||results[0];
 $('resultIntro').innerHTML=`<strong>${birth.city.name}</strong> 출생 · 양력 ${birth.solar.y}.${C.pad(birth.solar.m)}.${C.pad(birth.solar.d)} · ${birth.hasTime?`${C.pad(Number(birth.hour))}:${C.pad(Number(birth.minute))}`:'출생시간 미입력'} · <span>연주·월주는 절입 순간을 기준으로 계산</span>`;
 $('timeTabs').innerHTML=results.map(x=>`<button type="button" class="mode-btn ${x.key===activeTime?'selected':''}" data-mode="${x.key}" role="tab" aria-selected="${x.key===activeTime}">${e(x.label)}</button>`).join('');
 $('timeTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{activeTime=b.dataset.mode;renderAllResults();});
 $('pillars').innerHTML=`<div class="pillars-grid">${[['시주',p.hour],['일주',p.day],['월주',p.month],['년주',p.year]].map(([label,g])=>`<div class="pillar"><h4>${label}</h4>${g?`<div class="big ${colors[g.stemElement]}-text">${g.stem}</div><div class="big ${colors[g.branchElement]}-text">${g.branch}</div><div class="ko">${g.ko}</div><div class="element-name">${g.stemElement} / ${g.branchElement}</div>`:`<div class="big">—</div><div class="ko">시간 미입력</div>`}</div>`).join('')}</div>`;
 $('comparison').innerHTML=`<span class="comp-chip">보정 시각 ${C.humanDate(p.value)}</span><span class="comp-chip">${e(p.note)}</span><span class="comp-chip">월주 절입: ${p.entry[0]} · ${fmtSeoulMs(p.entry[1])}</span>`;
 $('ziCompare').innerHTML=`<div class="zi-card"><b>00시 일주 변경 기준</b><p>일주 ${p.day.hanja} (${p.day.ko}) · 시주 ${p.hour?.hanja||'미입력'}</p></div><div class="zi-card"><b>23시 일주 변경 기준</b><p>일주 ${p.alternativeDay.hanja} (${p.alternativeDay.ko}) · 시주 ${p.alternativeHour?.hanja||'미입력'}</p></div>`;
 let warnings=[];if(!birth.hasTime)warnings.push('출생시간을 입력하지 않아 시주는 표시하지 않습니다. 절입일에 태어난 경우 월주도 실제 출생시각에 따라 달라질 수 있습니다.');
 if(birth.ambiguous)warnings.push('서머타임 종료 등으로 동일한 출생 기록 시각이 두 번 존재합니다. 현재는 먼저 발생한 시각을 사용합니다. 결과를 반드시 확인하세요.');
 if(activeTime==='true')warnings.push('진태양시는 NOAA 균시차 근사 공식으로 계산했습니다. 정밀 천문계산 결과와 수분 차이가 날 수 있습니다.');
 warnings.push('1900~2100년 절기표는 천문 계산값이며 한국천문연구원의 공식 역서와 전수 대조하지 않았습니다. 절입 경계 시각에서는 확정된 사주로 사용하지 마세요.');
 $('resultWarning').textContent=warnings.join(' ');
 renderElements(p);
 try{renderCalendar();}catch(ex){console.warn('[운세 해설 표시 오류]',ex);if($('flowEmpty')){$('flowEmpty').hidden=false;$('flowEmpty').textContent='날짜별 흐름을 표시하지 못했습니다: '+(ex.message||ex);}}
 // Additional symbolic content is rendered independently so failures do not block core results.
}
const fmtSeoulMs=ms=>{const d=C.koreanLocalParts(ms);return `${d.year}.${C.pad(d.month)}.${C.pad(d.day)} ${C.pad(d.hour)}:${C.pad(d.minute)} 한국 법정시`};
function renderElements(p){const counts=C.elementsOfPillars(p),max=p.hour?8:6;
 $('elementsChart').innerHTML=['목','화','토','금','수'].map(x=>`<div class="el-row"><span>${x}</span><div class="el-track"><div class="el-fill" style="background:${hex[x]};width:${counts[x]/max*100}%"></div></div><span>${counts[x]}개</span></div>`).join('');
 $('simpleReading').innerHTML=`<strong>일간 ${p.day.stem} (${p.day.stemElement}) · ${C.explain[p.day.stemElement]}</strong><p>기본 오행 분포: ${Object.entries(counts).map(([k,v])=>`${k} ${v}`).join(' / ')}. 현재 월주는 ${p.month.ko}(${p.month.hanja})로 천간은 ${p.month.stemElement}, 지지는 ${p.month.branchElement}에 해당합니다. 오행의 많고 적음만으로 좋고 나쁨, 신강·신약 또는 용신을 확정하지 않습니다.</p>`;
 const all=[['년주',p.year],['월주',p.month],['일주',p.day],['시주',p.hour]].filter(x=>!!x[1]);
 $('technicalTable').innerHTML=`<table class="technical-table"><thead><tr><th>기둥</th><th>천간·십성</th><th>지지</th><th>지장간</th></tr></thead><tbody>${all.map(([label,g])=>`<tr><td>${label}</td><td>${g.stem} · ${label==='일주'?'일간':C.tenGod(p.day.stemI,g.stemI)}</td><td>${g.branch}</td><td>${C.HIDDEN[g.branchI].join(' · ')}</td></tr>`).join('')}</tbody></table>`;
}
function shiftMonth(n){let month=calM+n;calY+=Math.floor((month-1)/12);calM=((month-1)%12+12)%12+1;if(calY<1900){calY=1900;calM=1;}if(calY>2100){calY=2100;calM=12;}selected=Math.min(selected,new Date(Date.UTC(calY,calM,0)).getUTCDate());numberVariant=0;renderCalendar();}
function initCalendar(){
 const picker=$('calendarYear'),go=$('goCalendarYear'),hint=$('calendarYearHelp');
 if(picker&&go){
  picker.value=calY;
  const jump=()=>{
   const y=Number(picker.value);
   if(!Number.isInteger(y)||y<1900||y>2100){hint.textContent='1900년부터 2100년까지의 연도를 입력해 주세요.';return;}
   calY=y; selected=Math.min(selected,new Date(Date.UTC(calY,calM,0)).getUTCDate());numberVariant=0;
   hint.textContent=`${calY}년을 선택했어요. 아래 사주풀이도 같은 연도로 바뀌었어요.`;
   renderCalendar();
  };
  go.addEventListener('click',jump);
  picker.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();jump();}});
 }
 $('prevMonth').onclick=()=>shiftMonth(-1);$('nextMonth').onclick=()=>shiftMonth(1);$('todayMonth').onclick=()=>{const d=new Date();calY=d.getFullYear();calM=d.getMonth()+1;selected=d.getDate();numberVariant=0;renderCalendar();};renderCalendar();}
function renderCalendar(){
 $('monthLabel').textContent=`${calY}년 ${calM}월`;if($('calendarYear'))$('calendarYear').value=calY;
 const first=new Date(Date.UTC(calY,calM-1,1)).getUTCDay(),length=new Date(Date.UTC(calY,calM,0)).getUTCDate(),terms=C.termsInMonth(calY,calM);
 const datesByDay={};for(const t of terms){const date=C.koreanLocalParts(t[1]).day;(datesByDay[date]??=[]).push(t[0]);}
 const personal=results?.find(x=>x.key===activeTime)||results?.[0];
 const symbols=personal&&F?Array.from({length},(_,i)=>F.symbolicDayFlags(personal,calY,calM,i+1)):null;
 const summary=$('calendarSymbolSummary');
 if(summary){
  if(symbols){const harmonyCount=symbols.filter(x=>x.harmony).length,wealthCount=symbols.filter(x=>x.wealth).length;
   summary.innerHTML=`<strong>${calY}년 ${calM}월 개인별 상징일</strong><span class="summary-count harmony">조화 ${harmonyCount}일</span><span class="summary-count wealth">재물 ${wealthCount}일</span><small>두 표식이 같은 날짜에 표시될 수도 있습니다.</small>`;
  }else summary.textContent='출생정보를 분석하면 개인별 조화·재물 상징일이 달력에 나타납니다.';
 }
 const total=first+length<=35?35:42;let html='';for(let i=0;i<total;i++){const day=i-first+1;if(day<1||day>length){html+='<span class="cal-cell outside" aria-hidden="true"></span>';continue;}
 const g=C.dayGanzhi(calY,calM,day),term=(datesByDay[day]||[]).join('·'),symbol=symbols?.[day-1];
 const symbolsHtml=symbol&&(symbol.harmony||symbol.wealth)?`<span class="day-symbols">${symbol.harmony?'<span class="day-symbol harmony">조화</span>':''}${symbol.wealth?'<span class="day-symbol wealth">재물</span>':''}</span>`:'';
 const symbolAria=symbol?`${symbol.harmony?' 조화 상징일':''}${symbol.wealth?' 재물 상징일':''}`:'';
 html+=`<button type="button" data-day="${day}" class="cal-cell ${selected===day?'selected':''} ${symbol?.harmony?'symbol-harmony':''} ${symbol?.wealth?'symbol-wealth':''}" aria-label="${calM}월 ${day}일 ${g.ko}일${term?' '+term:''}${symbolAria}" aria-pressed="${selected===day}"><span class="day-number">${day}</span><span class="cal-ganji"><span class="${colors[g.stemElement]}-text">${g.stem}</span><span class="${colors[g.branchElement]}-text">${g.branch}</span></span>${term?`<span class="cal-term">${term}</span>`:`<span class="el-pair"><i class="dot ${colors[g.stemElement]}"></i><i class="dot ${colors[g.branchElement]}"></i></span>`}${symbolsHtml}</button>`;}
 $('calendarGrid').innerHTML=html;
 $('calendarGrid').querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>{selected=Number(el.dataset.day);renderCalendar();});
 renderDayDetails(terms);renderNumbers();
 try{renderPersonalAdditions();}catch(ex){console.warn('[흐름 갱신 오류]',ex);}
}
function renderDayDetails(terms){
 const g=C.dayGanzhi(calY,calM,selected),l=C.solarToLunar(calY,calM,selected);
 const termToday=terms.filter(t=>C.koreanLocalParts(t[1]).day===selected);
 const noonMs=Date.UTC(calY,calM-1,selected,3),ym=C.yearMonthGanzhi(noonMs);
 const tMsg=termToday.map(t=>`${t[0]} · ${fmtSeoulMs(t[1]).split(' ')[1]} (한국 법정시 기준)`).join(' / ');
 const personal=results?.find(x=>x.key===activeTime);const ten=personal?C.tenGod(personal.day.stemI,g.stemI):null;
 const symbol=personal&&F?F.symbolicDayFlags(personal,calY,calM,selected):null;
 const symbolPanel=symbol?(symbol.harmony||symbol.wealth?
 `<div class="symbol-day-detail"><strong>선택한 날짜의 상징일 표시</strong><div class="symbol-day-tags">${symbol.harmony?'<span class="symbol-detail-tag harmony">조화 상징일</span>':''}${symbol.wealth?'<span class="symbol-detail-tag wealth">재물 상징일</span>':''}</div><ul>${[...symbol.harmonyReasons,...symbol.wealthReasons].map(x=>`<li>${e(x)}</li>`).join('')}</ul><p>천간합·육합이 있어도 다른 합충 관계가 사라지는 것은 아닙니다. 재성은 십성의 명칭이며 실제 수익이나 재물 발생을 나타내지 않습니다.</p></div>`:
 `<div class="symbol-day-detail none"><strong>이 날짜의 상징일 표시</strong><p>이번 날짜에는 설정된 천간합·육합 또는 정재·편재 기준에 해당하는 표식이 없습니다. 이를 불리한 날짜로 해석하지 않습니다.</p></div>`):'';
 $('dateDetails').innerHTML=`<div class="detail-title">${calY}년 ${calM}월 ${selected}일 · ${g.ko} (${g.hanja})</div><div class="detail-meta"><span>천간 ${g.stem} · ${g.stemElement}</span><span>지지 ${g.branch} · ${g.branchElement}</span><span>월주(12시 기준) ${ym.month.hanja}</span>${l?`<span>음력 ${l.year}년 ${l.leap?'윤':''}${l.month}월 ${l.day}일</span>`:'<span>음력: 미검증 범위</span>'}</div>${tMsg?`<p><b>절기</b> ${e(tMsg)} · 절입 당일은 시간에 따라 월주가 달라집니다.</p>`:''}<p>천간의 ${g.stemElement}은 ${C.explain[g.stemElement]}이며, 지지는 ${g.branchElement} 오행의 전통적 상징을 갖습니다.${personal?` 입력한 사주 일간(${personal.day.stem})과 이날의 천간(${g.stem}) 사이의 십성 관계는 <b>${ten}</b>입니다.`:' 출생정보를 입력하면 개인 일간과의 십성 관계도 확인할 수 있습니다.'}</p>${symbolPanel}<p>날짜별 설명은 명리학의 전통적 상징이며 실제 사건·재물 획득·운세의 적중을 예측하지 않습니다.</p>`;
}

function renderNumbers(){
 if(!results||!birth||!S)return;
 const p=results.find(x=>x.key===activeTime)||results[0];
 // 월의 중간(15일) 시점에 적용되는 절입 기준 월주를 사용합니다.
 const middle=Date.UTC(calY,calM-1,15,3);
 let ym;
 try{ym=C.yearMonthGanzhi(middle);}catch(err){$('numbersGrid').textContent='조회 월의 절기 자료가 부족하여 숫자를 생성할 수 없습니다.';return;}
 const out=S.generate(p,ym.month,birth.solar,calY,calM,numberVariant,activeTime);
 $('numbersMeta').textContent=`${calY}년 ${calM}월 · 일간 ${p.day.hanja} · 월운 ${ym.month.hanja} · ${p.label} · ${numberVariant===0?'기본 조합':'변형 '+numberVariant+'회'}`;
 $('numbersGrid').innerHTML=out.groups.map(group=>`<article class="number-card"><div class="number-card-head"><strong>그룹 ${group.index}</strong><span class="number-focus">${group.focus} 오행 강조</span></div><div class="number-balls" aria-label="그룹 ${group.index}: ${group.numbers.join(', ')}">${group.numbers.map(n=>`<span class="number-ball ${colors[S.elementForNumber(n)]}" title="${n} · ${S.elementForNumber(n)} 오행">${n}</span>`).join('')}</div><p class="number-card-desc">다섯 오행을 고르게 포함하고 ${group.focus}의 숫자 상징을 하나 더 배치한 조합입니다.</p></article>`).join('');
 $('numbersNotice').textContent='';
}
function renderPersonalAdditions(){
 if(!F||!results||!birth)return;
 const p=results.find(x=>x.key===activeTime)||results[0];
 if(!p)return;
 F.drawFlow({p,year:calY,month:calM,selected,onSelect:day=>{selected=day;renderCalendar();}});
 F.drawOutlook({p,year:calY});
}
function initNumbers(){
 $('refreshNumbers').addEventListener('click',()=>{if(results){numberVariant++;renderNumbers();}});
 $('copyNumbers').addEventListener('click',async()=>{
  if(!results||!birth)return;
  const p=results.find(x=>x.key===activeTime)||results[0];
  const ym=C.yearMonthGanzhi(Date.UTC(calY,calM-1,15,3));
  const groups=S.generate(p,ym.month,birth.solar,calY,calM,numberVariant,activeTime).groups;
  const content=`[${calY}년 ${calM}월 오행 상징 숫자]\n`+groups.map(g=>`그룹 ${g.index} (${g.focus}): ${g.numbers.join(', ')}`).join('\n')+'\n전통 오행의 상징적 조합이며 재물 획득 등을 예측하지 않습니다.';
  try{
   if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(content);}
   else{const ta=document.createElement('textarea');ta.value=content;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();const ok=document.execCommand('copy');ta.remove();if(!ok)throw Error('복사를 지원하지 않는 브라우저입니다.');}
   $('numbersNotice').textContent='5개 그룹의 숫자를 복사했습니다.';
  }catch(_){$('numbersNotice').textContent='복사가 제한된 환경입니다. 화면에서 숫자를 확인해 주세요.';}
 });
}

try{
 initForm();initCalendar();
 try{if(S)initNumbers();}catch(err){console.warn('[부가 콘텐츠 초기화 오류]',err);}
 $('viewResults').addEventListener('click',jumpToResult);
 $('appInitNotice').hidden=true;
}catch(initializationError){
 console.error('[앱 초기화 오류]',initializationError);
 const panel=$('appInitNotice');if(panel){panel.textContent='앱 준비 과정에서 오류가 발생했습니다: '+(initializationError.message||initializationError)+' — 전체 파일을 다시 업로드하거나 단일 HTML 파일로 실행해 주세요.';panel.hidden=false;}
}
if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
