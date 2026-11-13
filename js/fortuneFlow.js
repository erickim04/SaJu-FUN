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
function yearContext(p,year){
 const ym=C.yearMonthGanzhi(Date.UTC(year,6,1,3));
 const g=ym.year,ten=C.tenGod(p.day.stemI,g.stemI),group=GROUP[ten];
 const clash=(g.branchI+6)%12===p.day.branchI;
 const natal=C.elementsOfPillars(p),dominant=Object.keys(natal).sort((a,b)=>natal[b]-natal[a])[0];
 return {year,g,ten,group,clash,dominant,theme:THEME[group]};
}
function yearBlurb(ctx){
 const emphasis={비겁:'협력 범위와 독립적인 역할을 조율하는 흐름',식상:'생각을 표현하고 결과물을 정돈하는 흐름',재성:'시간과 자원을 계획적으로 배분하는 흐름',관성:'책임과 기준을 정리하는 흐름',인성:'자료를 모으고 배우는 흐름'}[ctx.group];
 const adjust=ctx.clash?'일지와 세운 지지의 충 관계도 함께 나타나므로 변화가 잦은 상황에서는 일정·대화를 한 번 더 확인하는 상징으로 볼 수 있습니다.':'일지와 세운 지지의 정면 충 관계는 나타나지 않습니다. 그렇다고 실제 사건의 발생 여부를 판단할 수는 없습니다.';
 return {summary:`${ctx.year}년 ${ctx.g.ko}년은 ${emphasis}으로 풀이합니다.`,detail:`일간과 세운 천간의 관계는 ${ctx.ten}이며, 전통 명리학에서는 ${ctx.theme}을 떠올리는 상징입니다. ${adjust} 이 설명은 연도별 간지의 해석이지 미래 결과의 확정 예언이 아닙니다.`};
}
function workBlocks(ctx){
 const k=ctx.group;
 return [
  {name:'직장운 총평',summary:`${ctx.year}년에는 ${ctx.theme}의 상징을 직장과 진로 계획에 적용해 볼 수 있습니다.`,detail:`세운 ${ctx.g.ko}의 천간은 일간과 ${ctx.ten}의 관계입니다. 업무와 진로 관련 선택을 돌아보는 전통적 해석 소재로, 고용이나 진로 결과를 예측하는 계산은 아닙니다.`},
  {name:'이직운',summary:k==='관성'?'직무 조건과 책임 범위를 비교하는 해석이 강조됩니다.':'환경의 변화를 고민할 때 조건을 정리하는 해석입니다.',detail:`${ctx.year}년 ${ctx.g.ko}년의 ${ctx.ten}은 ${ctx.theme}의 상징입니다. 실제 이직 성사 여부는 알 수 없으므로 역할·보수·근무조건을 사실 중심으로 비교하는 데 참고하세요.`},
  {name:'퇴사운',summary:'정리·휴식·다음 단계에 필요한 준비를 점검하는 관점입니다.',detail:`세운의 ${ctx.ten} 관계를 기존 역할을 돌아보는 소재로 활용할 수 있습니다. 퇴사 시점은 운세 점수가 아니라 경제적 준비, 학업 또는 진로 계획과 현실 조건을 기준으로 결정하는 것이 적절합니다.`},
  {name:'창업운',summary:k==='식상'||k==='재성'?'아이디어를 구체화하고 자원을 점검하는 상징이 있습니다.':'아이디어를 작은 실험과 계획으로 정리하는 해석입니다.',detail:`${ctx.theme}이라는 전통적 의미에 맞춰 고객·비용·필요 역량을 살펴보는 소재로 풀이합니다. 창업 성공이나 수익 창출을 보장하거나 예측하는 결과는 아닙니다.`},
  {name:'승진운',summary:k==='관성'?'역할과 책임을 명확히 드러내는 해석이 강조됩니다.':'실력과 협업 성과를 꾸준히 정리하는 흐름입니다.',detail:`${ctx.ten}의 상징을 일의 기준과 성과 기록에 연결해 볼 수 있습니다. 승진은 조직·실제 성과·평가 등에 따라 결정되며 명리학만으로 알 수 없습니다.`}
 ];
}
function moneyBlock(ctx){
 return {name:'재물운',summary:ctx.group==='재성'?'자원 관리와 지출 계획을 돌아보는 해석이 두드러집니다.':'수입보다 먼저 일상적인 자원 관리에 집중하는 상징적 풀이입니다.',detail:`${ctx.year}년의 일간 대비 세운 천간은 ${ctx.ten}으로, ${ctx.theme}을 상징합니다. 지출·저축 목표를 점검하는 참고 소재로 활용할 수 있지만 재물 획득, 투자 수익, 특별한 행운의 발생을 예측하지는 않습니다.`};
}
function studyBlock(ctx){
 return {name:'학업운',summary:ctx.group==='인성'?'자료 이해와 학습 정리를 중심으로 읽을 수 있습니다.':ctx.group==='식상'?'학습한 내용을 표현하고 연습해보는 데 초점을 둔 해석입니다.':'꾸준한 학습 루틴과 목표 관리가 어울리는 전통적 해석입니다.',detail:`${ctx.ten}이라는 십성을 학습의 상징으로 연결해 보면 ${ctx.theme}이라는 주제가 나타납니다. 실제 성취는 학습시간·연습·피드백과 개인 환경에 영향을 받으므로 공부 계획을 세우는 참고 문구로 이용하세요.`};
}
function cautions(ctx){return [
 {name:'위기운 총평',summary:'건강·안전·소통을 두려운 예언이 아닌 일상 점검 주제로 풀이합니다.',detail:`${ctx.year}년 ${ctx.g.ko}의 ${ctx.ten}을 바탕으로 생활 리듬과 의사소통을 돌아보는 상징으로 해석합니다. 질병, 사고, 갈등의 발생을 예언하거나 위험 확률을 측정하는 기능은 아닙니다.`},
 {name:'건강 관련 주의',summary:'몸 상태를 단정하지 않고 휴식과 생활 균형을 점검하는 해석입니다.',detail:`${ctx.g.ko}년의 ${ctx.ten}을 생활 리듬을 돌아보는 상징으로 사용합니다. 충분한 수면·휴식과 평소 건강 관리가 중요하며, 사주로 질병이나 건강상태를 판단할 수는 없습니다.`},
 {name:'사고·안전 관련 주의',summary:'서두르지 않고 일상 안전수칙을 확인하자는 의미입니다.',detail:`세운과 일지의 관계${ctx.clash?'에서 충(沖)이 관찰되지만':'는 정면 충에 해당하지 않으며'}, 이것만으로 사고의 발생 여부를 판단할 수 없습니다. 이동·활동에서 익숙한 안전수칙을 지키는 정도의 참고 해석으로 제시합니다.`},
 {name:'구설·대인관계',summary:'의사소통 과정에서 확인과 배려를 중시하는 해석입니다.',detail:`${ctx.ten}에 따른 ${ctx.theme}의 상징을 사람들과의 협업에 연결해 설명합니다. 중요한 대화에서는 오해가 없도록 상황과 정보를 재확인해 보는 방식으로 활용할 수 있습니다.`}
];}
function blockHtml(item){return `<article class="fortune-entry"><h4>${esc(item.name)}</h4><p class="fortune-summary">한 줄 총평 · ${esc(item.summary)}</p><p class="fortune-detail">${esc(item.detail)}</p></article>`;}
function drawOutlook({p,year}){
 const empty=$('fortuneEmpty'),body=$('fortuneBody');if(!empty||!body)return;
 const current=yearContext(p,year),next=yearContext(p,year+1);
 empty.hidden=true;body.hidden=false;
 $('fortuneYearLabel').textContent=`올해 ${year}년 · 내년 ${year+1}년`;
 $('annualOverview').innerHTML=[current,next].map(ctx=>{const item=yearBlurb(ctx);return `<article class="year-card"><div class="year-card-head"><strong>${ctx.year}년 ${ctx.g.ko} (${ctx.g.hanja})</strong><span>${ctx.ten}</span></div><p class="fortune-summary">한 줄 총평 · ${esc(item.summary)}</p><p class="fortune-detail">${esc(item.detail)}</p></article>`;}).join('');
 $('workOutlook').innerHTML=workBlocks(current).map(blockHtml).join('');
 $('moneyOutlook').innerHTML=blockHtml(moneyBlock(current));
 $('studyOutlook').innerHTML=blockHtml(studyBlock(current));
 $('cautionOutlook').innerHTML=cautions(current).map(blockHtml).join('');
 $('fortuneMethod').textContent=`해설 기준: 일간 ${p.day.hanja}, 올해 세운 ${current.g.hanja}(${current.ten}), 내년 세운 ${next.g.hanja}(${next.ten}). 월운·대운·격국·용신의 검증되지 않은 결과를 이 해설에 포함하지 않았습니다. 직장·재물·학업·주의사항 상세 해설은 올해 세운을 기준으로 작성합니다. 건강·사고 등의 실제 발생 위험도를 산출하지 않습니다.`;
}
global.SajuFortune={monthFlow,yearContext,yearBlurb,drawFlow,drawOutlook,symbolicDayFlags};
})(window);
