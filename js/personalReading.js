/* v1.8: 선택한 달력 연도만, 쉬운 말로 설명하는 개인 사주풀이 */
(function(global){
'use strict';
const C=global.SajuCore;
if(!C)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const GROUP={비견:'비겁',겁재:'비겁',식신:'식상',상관:'식상',편재:'재성',정재:'재성',편관:'관성',정관:'관성',편인:'인성',정인:'인성'};
const STEM={
 '甲':'큰 나무','乙':'작은 풀','丙':'따뜻한 햇빛','丁':'작은 등불',
 '戊':'큰 산','己':'포근한 흙','庚':'단단한 쇠','辛':'반짝이는 보석',
 '壬':'큰 강','癸':'부드러운 빗물'
};
const SEASON={
 목:'나무처럼 배우고 자라는 모습',화:'불처럼 생각을 밖으로 보여 주는 모습',
 토:'흙처럼 차근차근 돌보는 모습',금:'쇠처럼 정리하고 기준을 세우는 모습',
 수:'물처럼 천천히 생각하고 방법을 찾는 모습'
};
const THEME={
 비겁:{name:'나와 다른 사람',one:'내 생각도 소중하고, 다른 사람의 생각도 들어 보는 것이 중요하다는 이야기예요.',
 example:'친구들과 모둠 숙제를 할 때처럼 각자 잘하는 일을 나누어 보면 좋아요.',
 work:'혼자 할 일과 함께 할 일을 나눠 보는 모습',money:'남이 가진 것과 비교하지 않고 내 지출을 살펴보는 모습',study:'혼자 풀어 보고 다른 사람과 답을 비교하는 모습',safety:'서로 생각이 다를 때 한 번 더 물어보는 모습'},
 식상:{name:'생각을 보여 주는 일',one:'머릿속 생각을 말이나 글, 작품처럼 밖으로 꺼내 보는 이야기예요.',
 example:'알고 있는 것을 친구에게 설명하거나 직접 만들어 보는 모습과 비슷해요.',
 work:'내가 만든 결과나 해낸 일을 보여 주는 모습',money:'새로운 일을 하기 전에 필요한 돈과 시간을 세어 보는 모습',study:'배운 것을 직접 쓰고 풀어 보며 익히는 모습',safety:'할 말을 차근차근 골라서 전하는 모습'},
 재성:{name:'돈과 시간을 챙기는 일',one:'내가 가진 돈과 시간, 물건을 아껴 쓰고 살펴보는 이야기예요.',
 example:'용돈 기입장에 쓴 돈을 적고 다음 주에 쓸 돈을 남겨 두는 모습과 비슷해요.',
 work:'일의 조건이나 시간을 표로 만들어 비교하는 모습',money:'들어온 돈과 쓴 돈을 따로 적어 보는 모습',study:'공부할 시간을 나누어 작은 계획을 지키는 모습',safety:'중요한 선택 전에 필요한 것을 한 번 더 확인하는 모습'},
 관성:{name:'약속과 맡은 일',one:'내가 맡은 일을 잘하고, 약속과 규칙을 생각해 보는 이야기예요.',
 example:'반에서 맡은 역할을 하거나 약속 시간을 지키는 모습과 비슷해요.',
 work:'내가 맡은 역할과 평가 기준을 알아보는 모습',money:'매달 꼭 써야 하는 돈을 먼저 챙기는 모습',study:'시험 범위를 확인하고 순서대로 공부하는 모습',safety:'할 일이 많으면 한 번에 하나씩 정리하는 모습'},
 인성:{name:'배우고 준비하는 일',one:'모르는 것을 배우고, 차근차근 준비하는 이야기에 가까워요.',
 example:'어려운 문제를 바로 포기하지 않고 책을 찾아보는 모습과 비슷해요.',
 work:'새로운 지식이나 기술을 배우는 모습',money:'돈을 쓰기 전에 정보를 찾아보고 비교하는 모습',study:'조금씩 읽고 여러 번 복습하는 모습',safety:'생각한 것을 작은 실천으로 옮기는 모습'}
};
const HARMONY=[1,0,11,10,9,8,7,6,5,4,3,2];
function natalInfo(p){
 const counts=C.elementsOfPillars(p),highCount=Math.max(...Object.values(counts));
 const high=Object.entries(counts).filter(([,v])=>v===highCount).map(([e])=>e);
 return {counts,high,hasHour:!!p.hour};
}
function annual(p,year){
 const g=C.yearMonthGanzhi(Date.UTC(year,6,1,3)).year;
 const ten=C.tenGod(p.day.stemI,g.stemI);const group=GROUP[ten];
 const clash=(p.day.branchI+6)%12===g.branchI;
 const harmony=HARMONY[p.day.branchI]===g.branchI;
 const same=p.day.branchI===g.branchI;
 return {year,g,ten,group,clash,harmony,same,theme:THEME[group]};
}
function relation(a){
 if(a.clash)return '그해 글자 중에는 내 사주 글자와 서로 마주 보는 짝이 있어요. 옛 풀이에서는 이를 “변화를 생각해 보는 표시”라고 부르지만, 실제 일이 생긴다는 뜻은 아니에요.';
 if(a.harmony)return '그해 글자 중에는 내 사주 글자와 손을 잡는 짝이 있어요. 옛 풀이에서는 “어울림”을 떠올리는 표시예요.';
 if(a.same)return '그해 글자와 내 사주 글자에 같은 글자가 있어요. 옛 풀이에서는 익숙한 일을 다시 살펴보는 표시로 읽어요.';
 return '내 사주 글자와 그해 글자 사이에 특별한 마주보기나 손잡기 짝은 보이지 않아요. 그 자체로 좋거나 나쁘다는 뜻은 아니에요.';
}
function evidence(p,a,n,add){
 const lines=[`내가 태어난 날을 나타내는 첫 글자: ${p.day.stem} (${p.day.stemElement})`,
 `${a.year}년의 글자: ${a.g.ko} (${a.g.hanja})`,
 `첫 글자의 관계 이름(십성): ${a.ten} / 쉬운 주제: ${a.theme.name}`,
 `태어난 날의 뒷글자와 ${a.year}년 뒷글자: ${a.clash?'충(서로 마주 보는 짝)':a.harmony?'육합(손을 잡는 짝)':a.same?'같은 글자가 반복됨':'특별한 충·육합 없음'}`];
 if(add)lines.push(add);
 return lines;
}
function card(name,summary,body,proof){return {name,summary,body,proof};}
function total(p,a,n){
 const bits=Object.entries(n.counts).map(([k,v])=>`${k} ${v}개`).join(', ');
 return card(`${a.year}년 전체 이야기`,a.theme.one,
 [`${a.year}년을 사주 방식으로 읽으면 “${a.theme.name}”이란 주제를 떠올려 볼 수 있어요.`,a.theme.example,relation(a),`내 사주에 어떤 글자가 있는지 살펴보며 내 생활을 돌아보는 참고 글이에요. ${a.year}년에 꼭 어떤 일이 생긴다는 뜻은 아니에요.`],
 evidence(p,a,n,`기본 오행 개수: ${bits}. 숫자만으로 좋은 운과 나쁜 운을 결정하지 않음`));
}
function work(p,a,n){
 const t=a.theme;
 const r=relation(a);
 return [
  card('직장·일의 전체 흐름',`일할 때는 ${t.work}을 떠올려 보세요.`,[
   `이해하기 쉽게 말하면, 학교나 회사에서 내가 맡은 일을 어떻게 해나갈지 생각해 보는 이야기예요.`,
   `${a.year}년에 ${t.name}이라는 주제를 전통적인 사주 이야기로 연결했어요. ${t.example}`],evidence(p,a,n)),
  card('이직운 · 직장을 옮기는 일','새로운 곳으로 옮길지 생각할 때는 준비할 것을 적어 보세요.',[
   `이직은 지금 하는 일을 그만두고 다른 직장에서 일하는 거예요.`,
   `${a.year}년의 상징을 이직에 연결하면 ${t.work}이란 주제로 생각해 볼 수 있어요.`,
   '실제로 직장을 옮길지는 일의 내용과 월급, 생활 상황을 보고 결정해야 해요.'],evidence(p,a,n)),
  card('퇴사운 · 일을 그만두는 일','그만두는 것보다 그다음 계획이 준비됐는지 먼저 살펴보세요.',[
   '퇴사는 다니던 직장에서 일을 그만두는 거예요.',
   r,
   '이 글자 관계만으로 퇴사할 일이 생기는지, 언제 그만두게 되는지는 알 수 없어요.'],evidence(p,a,n)),
  card('창업운 · 내 일을 시작하기','작은 계획부터 시험해 보고 필요한 것을 적어 보세요.',[
   '창업은 내 가게나 회사를 직접 시작하는 일이에요.',
   `전통적인 사주 이야기에서는 ${t.name}을 생각해 볼 수 있어요. ${t.money}이 도움이 되는 주제로 읽혀요.`,
   '실제로 시작할 때는 손님이 원하는 것과 비용을 꼭 따져 봐야 해요.'],evidence(p,a,n)),
  card('승진운 · 더 큰 역할 맡기','내가 잘한 일과 앞으로 맡을 일을 차근차근 정리해 보세요.',[
   '승진은 회사에서 더 큰 책임이나 새로운 직책을 맡는 일이에요.',
   `${a.year}년의 상징을 연결하면 ${t.work}을 떠올려 볼 수 있어요.`,
   '사주만으로 승진하는지, 언제 승진하는지는 알 수 없어요.'],evidence(p,a,n))
 ];
}
function money(p,a,n){
 return card('재물운 · 돈과 물건 챙기기',a.theme.money+'이란 주제로 생각해 볼 수 있어요.',[
  '재물운이란 돈이나 물건을 어떻게 다루는지와 연결해 옛날부터 풀이해 온 말이에요.',
  `${a.year}년을 사주 방식으로 읽으면 ${a.theme.example}`,
  '이 이야기는 돈이 들어오거나 부자가 된다는 약속이 아니에요.'],evidence(p,a,n));
}
function study(p,a,n){
 return card('학업운 · 배우고 익히기','잘 모르는 것을 조금씩 배워 가는 방법을 생각해 보세요.',[
  `공부를 주제로 읽으면 ${a.theme.study}이란 모습을 떠올릴 수 있어요.`,
  `${a.year}년의 사주 글자를 “${a.theme.name}”이란 주제와 연결한 설명이에요.`,
  '시험 점수나 합격 여부는 이 계산으로 알 수 없어요.'],evidence(p,a,n));
}
function caution(p,a,n){
 return [
  card('조심할 점 전체','무슨 일이 생길까 걱정하기보다 평소 생활을 잘 챙기는 이야기예요.',[
   `옛 사주 이야기에서는 ${a.year}년에 ${a.theme.name}이라는 주제를 떠올려 볼 수 있어요.`,
   relation(a),
   '사주 글자로 실제 위험이 생기는지를 알 수는 없어요.'],evidence(p,a,n)),
  card('건강 · 몸 돌보기','잘 쉬고, 몸이 불편하면 주변 어른이나 전문가에게 이야기하세요.',[
   '건강은 사주로 알아맞힐 수 있는 것이 아니에요.',
   '이 항목은 잠을 잘 자고, 식사와 휴식을 챙기는 습관을 떠올리는 참고 글이에요.'],evidence(p,a,n)),
  card('안전 · 사고 조심하기','평소처럼 교통규칙과 안전 수칙을 지키는 것이 중요해요.',[
   '달력의 어떤 날에 꼭 사고가 일어난다는 뜻이 아니에요.',
   '사주에 서로 마주 보는 글자가 있더라도 그것은 옛 풀이의 글자 관계일 뿐이에요.'],evidence(p,a,n)),
  card('구설 · 말로 생기는 오해','서로의 말을 끝까지 듣고 내 생각을 차근차근 말해 보세요.',[
   '구설은 말 때문에 서로 오해하거나 다투는 일을 뜻해요.',
   `${a.year}년의 사주 이야기를 대화에 연결하면 ${a.theme.safety}을 떠올릴 수 있어요.`,
   '누군가와 다툴 일이 생긴다는 예언은 아니에요.'],evidence(p,a,n))
 ];
}
function markup(item,cls='fortune-entry'){
 return `<article class="${cls}"><h4>${esc(item.name)}</h4><p class="fortune-summary"><span class="reading-kicker">한 줄로 말하면</span>${esc(item.summary)}</p><div class="reading-explained"><strong>쉽게 설명해 드릴게요</strong>${item.body.map(x=>`<p>${esc(x)}</p>`).join('')}</div><details class="reading-evidence"><summary>궁금한 사람만 보기 · 이렇게 풀이한 이유</summary><ul>${item.proof.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details></article>`;
}
function root(p,n,year){
 const el=$('readingIntro');if(!el)return;
 const count=n.hasHour?8:6;
 const s=STEM[p.day.stem]||'자연';
 const leading=n.high.join('·');
 const notes=[
  `사주란 내가 태어난 날짜와 시간을 옛날 글자로 적어 보는 방법이에요.`,
  `내 사주에는 ${s}에 빗대는 글자가 있어요. 옛사람들은 이런 자연의 모습으로 성격이나 생활을 비유했어요.`,
  `사주 ${count}글자에서 ${leading}의 숫자가 상대적으로 많아요. “많다”는 “더 좋다”와 같은 뜻은 아니에요.`,
  n.hasHour?'태어난 시간까지 넣어 계산했어요.':'태어난 시간이 없어서 시간에 해당하는 두 글자는 비워 두었어요.'
 ];
 el.innerHTML=`<div class="reading-intro-head"><span class="reading-leaf">☯</span><div><h3>내 사주부터 아주 쉽게 알아봐요</h3><p>옛날 글자를 생활 속 말로 바꾸어 설명해요.</p></div></div><p class="reading-tagline">지금 보는 풀이는 ${year}년 딱 한 해에 관한 이야기예요.</p><ul class="reading-intro-list">${notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="reading-glossary"><strong>어려운 말은 이렇게 읽으세요</strong><span><b>오행</b> 나무·불·흙·쇠·물의 다섯 이름</span><span><b>일간</b> 나를 나타내는 옛 글자</span><span><b>세운</b> 지금 고른 해의 글자</span><span><b>십성</b> 두 글자가 어떻게 만나는지 붙인 이름</span></div>`;
}
function drawOutlook({p,year}){
 const empty=$('fortuneEmpty'),body=$('fortuneBody');if(!empty||!body)return;
 const n=natalInfo(p),a=annual(p,year);
 empty.hidden=true;body.hidden=false;
 root(p,n,year);
 $('fortuneYearLabel').textContent=`${year}년 한 해의 전체 풀이`;
 $('annualOverview').innerHTML=markup(total(p,a,n),'year-card');
 const tabs=$('readingYearTabs');if(tabs)tabs.hidden=true;
 $('readingSelectedYear').textContent=`${year}년의 분야별 쉬운 풀이`;
 $('workOutlook').innerHTML=work(p,a,n).map(x=>markup(x)).join('');
 $('moneyOutlook').innerHTML=markup(money(p,a,n));
 $('studyOutlook').innerHTML=markup(study(p,a,n));
 $('cautionOutlook').innerHTML=caution(p,a,n).map(x=>markup(x)).join('');
 $('fortuneMethod').innerHTML=`<strong>이 글은 어떻게 만들었나요?</strong><p>태어난 날을 나타내는 글자와 ${year}년의 글자가 어떻게 이어지는지 살펴보았어요. 달력에서 다른 연도를 고르면 해당 연도의 설명만 새로 나와요. 이 풀이에 아직 계산하지 않은 대운·격국·용신 결과를 넣지 않았어요. 사주는 전통적인 이야기로, 실제 취업·돈·건강·사고를 미리 알아맞히는 방법은 아니에요.</p>`;
}
global.SajuPersonalReading={drawOutlook,natalInfo,annual};
})(window);
