/* v1.5: 사주 일진 기반 월간 상대 흐름 및 전통적 해설 — 예측 지표가 아닌 상징적 해석 */
(function(global){
'use strict';
const C=global.SajuCore;
if(!C)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const EL=C.E_INDEX;
const W={비견:0.35,겁재:-0.6,식신:1.4,상관:0.4,편재:0.7,정재:1.2,편관:-1.1,정관:1.1,편인:0.4,정인:0.9};
const GROUP={비견:'비겁',겁재:'비겁',식신:'식상',상관:'식상',편재:'재성',정재:'재성',편관:'관성',정관:'관성',편인:'인성',정인:'인성'};
const THEME={비겁:'독립성과 협력 관계',식상:'표현과 결과물 정리',재성:'자원·일정 관리',관성:'역할과 책임의 기준',인성:'배움과 정보의 정리'};
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const relation=(a,b)=>{const ai=EL.indexOf(a),bi=EL.indexOf(b);if(ai===bi)return '같은 오행';if((ai+1)%5===bi)return '내가 생하는 관계';if((bi+1)%5===ai)return '나를 생하는 관계';if((ai+2)%5===bi)return '내가 극하는 관계';return '나를 극하는 관계';};
function rawDay(p,y,m,d){
 const g=C.dayGanzhi(y,m,d),ten=C.tenGod(p.day.stemI,g.stemI);
 const r=relation(p.day.stemElement,g.branchElement);
 let val=W[ten];
 const reasons=[`일간 ${p.day.stem}과 일진 천간 ${g.stem}의 십성 ${ten}(${val>=0?'+':''}${val.toFixed(2)})`];
 const branchWeights={'같은 오행':0.35,'내가 생하는 관계':0.2,'나를 생하는 관계':0.65,'내가 극하는 관계':-0.3,'나를 극하는 관계':-0.65};
 val+=branchWeights[r];reasons.push(`일진 지지 ${g.branchElement}은 일간의 ${r}(${branchWeights[r]>=0?'+':''}${branchWeights[r].toFixed(2)})`);
 if((g.branchI+6)%12===p.day.branchI){val-=1.5;reasons.push('일진과 일지 사이에 충(沖)이 있어 조정의 상징(-1.50)');}
 if((g.branchI+6)%12===p.month.branchI){val-=0.65;reasons.push('일진과 월지 사이에 충(沖)이 있어 점검의 상징(-0.65)');}
 if(g.branchI===p.day.branchI){val+=0.25;reasons.push('일지와 같은 지지가 반복(+0.25)');}
 return {day:d,g,ten,raw:Math.round(val*100)/100,reasons};
}
function monthFlow(p,y,m){
 const length=new Date(Date.UTC(y,m,0)).getUTCDate(),arr=[];
 for(let d=1;d<=length;d++)arr.push(rawDay(p,y,m,d));
 const avg=arr.reduce((a,b)=>a+b.raw,0)/arr.length;
 return arr.map(x=>({...x,score:Math.round(clamp((x.raw-avg)*1.25,-4.5,4.5)*10)/10}));
}
// 달력 표식: 십간합·육합 및 일간 기준 재성. 개인의 실제 운·재물 발생을 예측하지 않는 상징 규칙.
const BRANCH_SIX_HARMONY=[1,0,11,10,9,8,7,6,5,4,3,2];
function symbolicDayFlags(p,y,m,d){
 const g=C.dayGanzhi(y,m,d), reasonsHarmony=[],reasonsWealth=[];
 if((p.day.stemI+5)%10===g.stemI){
   reasonsHarmony.push(`일간 ${p.day.stem}과 해당 일의 천간 ${g.stem}은 천간 오합(五合) 짝입니다.`);
 }
 if(BRANCH_SIX_HARMONY[p.day.branchI]===g.branchI){
   reasonsHarmony.push(`일지 ${p.day.branch}와 해당 일의 지지 ${g.branch}는 지지 육합(六合) 짝입니다.`);
 }
 const ten=C.tenGod(p.day.stemI,g.stemI);
 if(ten==='정재'||ten==='편재'){
   reasonsWealth.push(`일간 ${p.day.stem}과 해당 일의 천간 ${g.stem}의 십성이 ${ten}(재성)입니다.`);
 }
 return {day:d,g,harmony:reasonsHarmony.length>0,wealth:reasonsWealth.length>0,harmonyReasons:reasonsHarmony,wealthReasons:reasonsWealth,ten};
}
function describeLevel(s){return s>=1.2?'상대적으로 높은 구간':s<=-1.2?'상대적으로 낮은 구간':'중간 구간';}
function drawFlow({p,year,month,selected,onSelect}){
 const empty=$('flowEmpty'),body=$('flowBody');if(!empty||!body)return;
 const data=monthFlow(p,year,month);
 empty.hidden=true;body.hidden=false;
 $('flowSubtitle').textContent=`${year}년 ${month}월 · ${data.length}일 · 사주 일간 ${p.day.hanja} 기준`;
 const width=760,height=278,L=42,R=15,T=24,B=42,plotW=width-L-R,plotH=height-T-B;
 const x=d=>L+(d-1)*plotW/Math.max(1,data.length-1);
 const y=s=>T+(4.5-s)*plotH/9;
 const grid=[4,2,0,-2,-4].map(n=>`<line x1="${L}" x2="${width-R}" y1="${y(n)}" y2="${y(n)}" stroke="${n===0?'#8a9a9b':'#e7eeec'}" stroke-width="${n===0?1.7:1}" stroke-dasharray="${n===0?'0':'4 4'}"/><text x="${L-10}" y="${y(n)+4}" text-anchor="end" font-size="12" fill="#6f8381">${n>0?'+':''}${n}</text>`).join('');
 const path=data.map((item,i)=>`${i?'L':'M'}${x(item.day).toFixed(2)},${y(item.score).toFixed(2)}`).join(' ');
 const ticks=[1,5,10,15,20,25,data.length].filter((v,i,a)=>a.indexOf(v)===i).map(d=>`<text x="${x(d)}" y="${height-11}" font-size="11" text-anchor="middle" fill="#607976">${d}일</text>`).join('');
 const bubbles=data.map(item=>`<circle class="flow-dot${item.day===selected?' is-picked':''}" data-flow-day="${item.day}" tabindex="0" role="button" aria-label="${month}월 ${item.day}일: 상대 흐름 ${item.score>0?'+':''}${item.score}" cx="${x(item.day)}" cy="${y(item.score)}" r="${item.day===selected?7:4.3}" fill="${item.day===selected?'#185f56':item.score>=0?'#439579':'#c18670'}" stroke="#ffffff" stroke-width="1.5"><title>${month}월 ${item.day}일 · ${item.g.ko} · ${item.score>0?'+':''}${item.score} (${describeLevel(item.score)})</title></circle>`).join('');
 $('flowChart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${year}년 ${month}월 날짜별 전통 오행 상대 흐름 선 그래프. 0은 이 달의 평균이며 위아래는 상대적 차이입니다.">${grid}<path d="${path}" fill="none" stroke="#2d8076" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${bubbles}${ticks}<text x="${L}" y="14" font-size="11" fill="#6e817f">상대 흐름 (월 평균 0)</text></svg>`;
 for(const b of $('flowChart').querySelectorAll('[data-flow-day]')){
  const act=()=>onSelect(Number(b.getAttribute('data-flow-day')));
  b.addEventListener('click',act);b.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();act();}});
 }
 const item=data.find(x=>x.day===selected)||data[0];
 $('flowDetail').innerHTML=`<div class="flow-detail-top"><strong>${year}년 ${month}월 ${item.day}일 · ${item.g.ko} (${item.g.hanja})</strong><span class="flow-tag ${item.score>=1.2?'higher':item.score<=-1.2?'lower':'middle'}">${describeLevel(item.score)} · ${item.score>0?'+':''}${item.score.toFixed(1)}</span></div><p class="flow-overview">${item.score>1.2?'다른 날짜보다 전통적인 생조·관계 해석이 상대적으로 두드러집니다.':item.score<-1.2?'이 달의 다른 날짜보다 점검·조정의 상징이 상대적으로 많이 반영되었습니다.':'이 달의 평균 부근으로 해석되는 날입니다.'}</p><ul>${item.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul>`;
 $('flowExplainer').textContent='※ 오행·십성·지지 충 관계에 설정한 가중치를 합한 뒤, 해당 월 평균을 0으로 맞춰 상대적인 높낮이를 표현했습니다. 월이 바뀌면 기준도 바뀝니다. 이는 앱의 시각화 규칙이지 미래 사건·건강·사고·재물 발생 가능성을 뜻하는 객관적 점수가 아닙니다.';
}
global.SajuFortune={monthFlow,drawFlow,symbolicDayFlags};
})(window);
