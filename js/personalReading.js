/* v1.7 - 쉬운 개인 사주풀이; 계산된 원국·십성·세운을 자연어로 해설한다. */
(function(global){
'use strict';
const C=global.SajuCore;
if(!C)return;
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const GROUP={비견:'비겁',겁재:'비겁',식신:'식상',상관:'식상',편재:'재성',정재:'재성',편관:'관성',정관:'관성',편인:'인성',정인:'인성'};
const TEN={
 비견:['나와 비슷한 기운','자기 기준을 세우고 동료와 역할을 나누는 모습'],
 겁재:['나와 비슷하지만 경쟁하는 기운','경쟁과 협력이 동시에 생길 수 있어 경계와 역할을 분명히 하는 모습'],
 식신:['꾸준히 만들어 내는 기운','배운 것을 일상에서 반복해 결과물로 만드는 모습'],
 상관:['기존 틀을 바꾸어 표현하는 기운','자기 생각을 새 방식으로 드러내되 말과 표현을 조율하는 모습'],
 편재:['넓은 자원을 다루는 기운','다양한 정보와 자원을 살펴보고 선택지를 비교하는 모습'],
 정재:['계획적인 자원 관리의 기운','예산과 일정처럼 꾸준히 지키는 기준을 만드는 모습'],
 편관:['도전과 압박을 다루는 기운','요구되는 일이 많을 때 우선순위를 정하고 대응하는 모습'],
 정관:['책임과 질서를 중시하는 기운','약속과 규칙을 지키며 역할을 분명하게 하는 모습'],
 편인:['독특한 관점으로 배우는 기운','한 가지 주제를 깊이 파고들고 다른 방법도 검토하는 모습'],
 정인:['차근차근 배우고 정리하는 기운','신뢰할 만한 자료와 도움을 바탕으로 이해를 쌓는 모습']
};
const STEM={
 '甲':'큰 나무처럼 성장의 방향을 세우는 상징', '乙':'풀과 덩굴처럼 유연하게 적응하는 상징',
 '丙':'햇빛처럼 바깥으로 표현하는 상징', '丁':'등불처럼 섬세하게 집중하는 상징',
 '戊':'산처럼 중심을 잡고 지지하는 상징', '己':'흙처럼 세밀하게 돌보고 조율하는 상징',
 '庚':'단단한 금속처럼 기준을 세우고 결단하는 상징', '辛':'잘 다듬은 금속처럼 차이를 구별하고 정돈하는 상징',
 '壬':'큰 물처럼 넓게 생각하고 흐름을 살피는 상징', '癸':'비처럼 세심하게 관찰하고 스며드는 상징'
};
const ELEMENT={목:'성장·기획',화:'표현·활동',토:'조율·안정',금:'기준·정리',수:'사고·적응'};
const SEASON={
 0:'겨울의 차분한 기운',1:'겨울 끝의 차분한 기운',2:'봄의 자라는 기운',3:'봄의 자라는 기운',4:'봄에서 여름으로 넘어가는 기운',
 5:'여름의 활발한 기운',6:'여름의 활발한 기운',7:'여름에서 가을로 넘어가는 기운',8:'가을의 정리하는 기운',9:'가을의 정리하는 기운',
 10:'가을에서 겨울로 넘어가는 기운',11:'겨울의 차분한 기운'
};
const BY_GROUP={
 비겁:{overall:'내 기준과 다른 사람과의 협력이 함께 중요해지는 상징입니다.',work:'독립적인 역할을 선명하게 하되 팀의 협력 범위를 조율하는 모습',money:'남과 비교하는 소비보다 내가 지킬 수 있는 생활 예산을 정하는 모습',study:'혼자 해보는 연습과 함께 토론·피드백을 병행하는 모습',caution:'의견이 다를 때 먼저 상대의 설명을 들어보는 모습'},
 식상:{overall:'아이디어를 말이나 결과물로 만들어 보는 상징입니다.',work:'실제로 해낸 일을 포트폴리오나 기록으로 남겨 전달하는 모습',money:'새로운 계획의 비용과 필요한 시간을 먼저 계산하는 모습',study:'읽는 것에서 그치지 않고 써보거나 문제를 풀어 익히는 모습',caution:'표현이 앞서지 않도록 말의 전달 방식을 한번 다듬는 모습'},
 재성:{overall:'돈뿐 아니라 시간·물건·약속을 계획적으로 관리하는 상징입니다.',work:'일의 조건과 일정, 필요한 자원을 실제 숫자로 비교하는 모습',money:'들어오는 것과 나가는 것을 분리해 장부처럼 점검하는 모습',study:'목표를 작게 나누어 계획표에 따라 실천하는 모습',caution:'결정 전에 비용이나 부담을 확인하고 서두르지 않는 모습'},
 관성:{overall:'책임·규칙·평가 기준을 정돈하는 상징입니다.',work:'맡은 역할과 평가 기준을 명확히 정하고 성과를 설명하는 모습',money:'고정적으로 지켜야 할 비용과 약속을 점검하는 모습',study:'시험 범위나 평가 기준을 확인해 기초부터 연습하는 모습',caution:'해야 할 일이 많으면 우선순위를 나누어 무리하지 않는 모습'},
 인성:{overall:'배움·준비·자료 정리를 통해 기반을 다지는 상징입니다.',work:'새 기술이나 지식을 익혀 맡을 수 있는 일을 넓히는 모습',money:'금액을 결정하기 전에 충분히 읽고 비교해 보는 모습',study:'자료를 정리하고 복습하는 과정에 집중하는 모습',caution:'생각만 길어지지 않도록 작은 실천으로 이어가는 모습'}
};
const BRANCH_HARMONY=[1,0,11,10,9,8,7,6,5,4,3,2];
function natalInfo(p){
 const counts=C.elementsOfPillars(p), max=Math.max(...Object.values(counts));
 const high=Object.keys(counts).filter(k=>counts[k]===max);
 const all=[p.year.stemI,p.month.stemI,...(p.hour?[p.hour.stemI]:[])];
 const natalTens=all.map(i=>C.tenGod(p.day.stemI,i));
 const byGroup=natalTens.map(x=>GROUP[x]);
 return {counts,high,main:high[0],tens:natalTens,groups:byGroup,season:SEASON[p.month.branchI],hasHour:!!p.hour};
}
function annual(p,year){
 const g=C.yearMonthGanzhi(Date.UTC(year,6,1,3)).year;
 const ten=C.tenGod(p.day.stemI,g.stemI);const group=GROUP[ten];
 const clash=(p.day.branchI+6)%12===g.branchI;
 const harmony=BRANCH_HARMONY[p.day.branchI]===g.branchI;
 const same=p.day.branchI===g.branchI;
 const monthClash=(p.month.branchI+6)%12===g.branchI;
 const branchText=clash?'태어난 날의 지지와 그해 지지가 충(沖) 관계라, 전통적으로 변화·조정을 떠올립니다.':harmony?'태어난 날의 지지와 그해 지지가 육합(六合) 관계라, 전통적으로 연결·협력을 떠올립니다.':same?'태어난 날의 지지와 같은 글자가 반복되어, 기존 방식이나 습관을 다시 살펴보는 상징입니다.':'태어난 날의 지지와 그해 지지 사이에 정면 충이나 육합은 나타나지 않습니다.';
 return {year,g,ten,group,clash,harmony,same,monthClash,branchText,short:TEN[ten][0],meaning:TEN[ten][1],theme:BY_GROUP[group]};
}
function miniEvidence(p,a,n,extra=''){
 const proof=[`나의 일간(나를 나타내는 글자): ${p.day.ko} 중 ${p.day.stem}`,
 `해당 연도: ${a.year}년 ${a.g.ko}(${a.g.hanja})`,
 `해당 연도 천간과의 십성: ${a.ten} — ${a.short}`,
 `해당 연도 지지와 나의 일지: ${a.clash?'충(서로 마주보는 관계)':a.harmony?'육합(짝을 이루는 관계)':a.same?'같은 지지':'특별한 정면 충·육합 없음'}`];
 if(extra)proof.push(extra);
 return proof;
}
function makeCard(name,summary,easy,details,proof){return {name,summary,easy,details,proof};}
function workCards(p,a,n){
 const base=`${a.year}년에는 ${a.ten}(${a.short})이 세운의 천간에 놓입니다.`;
 const w=a.theme.work;
 return [
  makeCard('직장운 종합',`일의 방향을 잡을 때는 ${w}을 떠올려 보세요.`,base+` 쉽게 말해 ${a.meaning}이라는 주제로 일과 역할을 돌아보는 해석입니다.`, '일간과 세운 천간의 십성은 역할·표현·협력·자원·학습 중 어떤 주제가 강조되는지를 분류하는 전통적인 언어입니다. 직업이나 합격·승진의 실제 결과를 판정하는 방식은 아닙니다.',miniEvidence(p,a,n)),
  makeCard('이직운', a.group==='관성'?'새 일자리의 역할과 책임 범위를 차분히 비교해 보세요.':a.group==='식상'?'내가 해온 일을 보여주는 자료를 정리해 보세요.':a.group==='재성'?'보수와 조건을 숫자로 비교해 보는 해석입니다.':'변화 자체보다 준비 정도를 확인해 보는 시기라는 상징입니다.',`이직을 생각한다면 ${w}이 중요하다는 뜻으로 읽을 수 있습니다. ${a.branchText}`, '현실에서는 새 근무지의 업무·조건·지원 시기를 별도로 검토해야 합니다. 사주만으로 이직 성공 여부나 특정 월을 확정할 수는 없습니다.',miniEvidence(p,a,n)),
  makeCard('퇴사운',a.clash?'변화의 상징이 보여도 결정은 충분한 준비 후에 하세요.':'지금 역할을 정리하고 다음 계획을 점검하는 해석입니다.',`명리학에서 충(沖)은 무조건 퇴사를 뜻하지 않습니다. ${a.branchText} 마음에 드는 변화라도 현재의 조건과 이후 계획을 비교하는 것이 좋습니다.`, '자발적 퇴사나 권고사직의 실제 가능성을 계산하지 않으며, 준비 상태와 일정은 개인 사정을 중심으로 판단해야 합니다.',miniEvidence(p,a,n)),
  makeCard('창업운',a.group==='식상'?'아이디어를 작게 만들어 확인하는 해석이 강조됩니다.':a.group==='재성'?'자원과 비용을 미리 계산하는 관점이 강조됩니다.':'새로운 계획은 준비와 검증에 초점을 맞추는 해석입니다.',`창업을 주제로 읽으면 ${a.theme.money}이 중요하다는 상징입니다. 새로운 시도는 작은 규모의 시험과 필요한 역량 정리부터 접근할 수 있습니다.`, '창업 결과나 수익을 예측하지 않습니다. 기획·표현을 뜻하는 식상과 자원 관리를 뜻하는 재성 등을 명리학의 상징으로만 활용했습니다.',miniEvidence(p,a,n)),
  makeCard('승진운',a.group==='관성'?'책임과 평가 기준을 이해하는 해석이 두드러집니다.':'성과를 차근차근 정리하는 해석입니다.',`승진이라는 관점에서는 ${w}이 핵심 키워드입니다. 동료와 협력한 과정, 실무에서 확인된 결과를 스스로 이해하기 쉽게 설명해 볼 수 있습니다.`, '관성은 조직·직책·규칙에 대응되는 십성입니다. 관성이 없거나 나타나지 않았다고 해서 승진이 불가능하다는 뜻은 아닙니다.',miniEvidence(p,a,n))
 ];
}
function moneyCard(p,a,n){return makeCard('재물운',a.group==='재성'?'돈과 자원을 꾸준히 관리하는 재성의 상징이 드러납니다.':a.group==='식상'?'계획을 실행에 옮길 때 드는 비용을 점검해 보세요.':'금전 결과보다 현재의 자원 관리 방식에 초점을 맞춰 보세요.',`명리학에서 재성은 내가 관리하고 다루는 대상의 상징입니다. ${a.year}년에는 ${a.ten}의 의미가 더해지며, ${a.theme.money}을 생활 속 예시로 이해할 수 있습니다.`, '재성이라는 글자는 실제 소득·당첨·투자 성과의 예측값이 아닙니다. 올해에 재성 십성이 나타나는지 여부만으로 돈이 생기는 날짜를 알 수 없습니다.',miniEvidence(p,a,n));}
function studyCard(p,a,n){return makeCard('학업운',a.group==='인성'?'자료를 이해하고 복습해 지식을 쌓는 흐름으로 풀이합니다.':a.group==='식상'?'배운 내용을 직접 설명하거나 연습하는 해석이 강조됩니다.':'꾸준한 공부 습관을 만드는 관점에서 읽어보세요.',`학습을 주제로 보면 ${a.theme.study}이 올해의 상징적 키워드입니다. ${a.ten}은 '${a.short}'을 뜻하며, 이를 공부하는 방법에 연결하여 해석할 수 있습니다.`, '인성은 배움·이해, 식상은 표현·활용과 관련된 전통적인 십성입니다. 시험 합격 여부나 성적을 예측하는 계산은 아닙니다.',miniEvidence(p,a,n));}
function cautionCards(p,a,n){return [
 makeCard('주의사항 총평',a.clash?'변화가 많은 상황을 가정해 일정과 대화를 한 번 더 점검하세요.':'일상 균형과 소통을 살펴보는 해석입니다.',`올해의 세운은 ${a.ten}으로 풀이되며, ${a.branchText} 명리학에서는 이를 상황을 돌아보는 상징으로 읽습니다.`, '주의사항은 생활을 돌아보는 참고 문구이며 실제 위험도나 사건 발생 가능성을 계산한 결과가 아닙니다.',miniEvidence(p,a,n)),
 makeCard('건강·생활 리듬','몸의 상태를 추측하기보다 일상적인 휴식과 균형을 살펴보세요.',`올해의 ${a.short}이라는 상징을 생활 속에서 해석한다면 해야 할 일과 휴식의 균형을 점검하는 것으로 연결할 수 있습니다.`, '사주와 오행 분포로 질병이나 건강상태를 판단할 수 없습니다.',miniEvidence(p,a,n)),
 makeCard('사고·안전','사고를 예측하는 날짜 대신 평소의 안전 습관을 확인하세요.',`${a.branchText} 이 관계는 명리학의 글자 관계이며, 실제 사고의 원인이나 발생 시점을 뜻하지 않습니다.`, '충이 있으면 사고가 난다거나 합이 있으면 안전하다는 해석은 앱에서 제공하지 않습니다.',miniEvidence(p,a,n)),
 makeCard('구설·인간관계',a.group==='비겁'?'서로 다른 의견을 조율하는 태도를 떠올려 보세요.':a.group==='식상'?'표현할 때 말의 전달 방식을 점검해 보세요.':'대화에서 약속과 이해를 확인해 보는 해석입니다.',`${a.year}년 ${a.ten}의 의미는 ${a.meaning}입니다. 함께 일하거나 공부하는 상황에서 확인 질문과 협력의 방식을 생각해 볼 수 있습니다.`, '사주로 구설이 실제로 생긴다고 단정하지 않고, 일상적인 대인관계 주제로만 설명합니다.',miniEvidence(p,a,n))
];}
function annualCard(p,a,n){
 const interpret=`${a.year}년은 ${a.g.ko}(${a.g.hanja})년입니다. 나는 ${p.day.stem}(${p.day.stemElement}) 일간이며, 해당 연도 천간 ${a.g.stem}은 나와 ${a.ten} 관계입니다. 쉽게 말해 ${a.meaning}을 돌아보는 해석입니다.`;
 return makeCard(`${a.year}년 총운세`,a.theme.overall,interpret+` ${a.branchText}`,`사주 원국의 ${n.season}과 기본 오행 ${n.high.join('·')}이 상대적으로 많이 보인다는 점을 함께 표시했습니다. 다만 월령, 지장간, 대운, 용신을 종합한 전문 판정은 아직 포함하지 않습니다.`,miniEvidence(p,a,n,`원국의 단순 오행: ${Object.entries(n.counts).map(([k,v])=>`${k} ${v}`).join(' / ')}`));
}
function cardHtml(item,cls='fortune-entry'){
 return `<article class="${cls}"><h4>${escape(item.name)}</h4><p class="fortune-summary"><span class="reading-kicker">한 줄 총평</span>${escape(item.summary)}</p><div class="reading-explained"><strong>쉽게 풀어보면</strong><p>${escape(item.easy)}</p><p>${escape(item.details)}</p></div><details class="reading-evidence"><summary>이렇게 풀이한 명리학 근거 보기</summary><ul>${item.proof.map(t=>`<li>${escape(t)}</li>`).join('')}</ul></details></article>`;
}
function showRoot(p,n){
 const el= $('readingIntro');if(!el)return;
 const onlyKnown=n.hasHour?'8글자':'6글자';
 const facts=[`나는 ${p.day.stem}(${p.day.stemElement}) 일간입니다. 일간은 사주에서 자신을 대표하는 기준 글자입니다.`,
 `월주는 ${p.month.ko}이며, ${n.season}을 반영하는 출생 시기의 상징입니다.`,
 `사주 ${onlyKnown}의 단순 분포에서 ${n.high.join('·')} 오행이 가장 많이 보입니다. 개수가 많다고 반드시 유리한 것은 아닙니다.`,
 n.hasHour?'출생시간을 입력했으므로 시주까지 포함했습니다.':'출생시간을 모르므로 시주는 제외했습니다. 시주가 필요한 세밀한 판단은 보류합니다.'];
 el.innerHTML=`<div class="reading-intro-head"><span class="reading-leaf">☯</span><div><h3>먼저, 내 사주를 쉽게 읽어볼까요?</h3><p>처음 보는 사람도 이해할 수 있도록 중요한 용어부터 풀었습니다.</p></div></div><p class="reading-tagline">${escape(STEM[p.day.stem]||C.explain[p.day.stemElement])}</p><ul class="reading-intro-list">${facts.map(t=>`<li>${escape(t)}</li>`).join('')}</ul><div class="reading-glossary"><strong>용어 설명</strong><span><b>원국</b> 태어날 때의 사주 구성</span><span><b>일간</b> 나를 대표하는 글자</span><span><b>십성</b> 나와 다른 글자의 관계를 뜻하는 10가지 이름</span><span><b>세운</b> 해당 연도에 적용하는 연간지</span></div>`;
}
let yearChosen=null,yearAnchor=null;
function drawOutlook({p,year}){
 const empty=$('fortuneEmpty'),body=$('fortuneBody');if(!empty||!body)return;
 const n=natalInfo(p);const current=annual(p,year);const next=annual(p,year+1);
 if(yearAnchor!==year||yearChosen===null){yearChosen=year;yearAnchor=year;}
 const selected=(yearChosen===year+1)?next:current;
 empty.hidden=true;body.hidden=false;
 showRoot(p,n);
 $('fortuneYearLabel').textContent=`${year}년과 ${year+1}년의 총운세`;
 $('annualOverview').innerHTML=[current,next].map(a=>cardHtml(annualCard(p,a,n),'year-card')).join('');
 const tabs=$('readingYearTabs');
 if(tabs){tabs.querySelectorAll('[data-reading-year]').forEach(btn=>{const offset=Number(btn.dataset.readingYear);const val=year+offset;btn.textContent=`${val}년 ${offset===0?'올해':'내년'} 분야별 풀이`;btn.setAttribute('aria-pressed',String(val===selected.year));btn.onclick=()=>{yearChosen=val;drawOutlook({p,year});};});}
 $('readingSelectedYear').textContent=`${selected.year}년 ${selected.g.ko}년 기준 자세한 풀이`;
 $('workOutlook').innerHTML=workCards(p,selected,n).map(item=>cardHtml(item)).join('');
 $('moneyOutlook').innerHTML=cardHtml(moneyCard(p,selected,n));
 $('studyOutlook').innerHTML=cardHtml(studyCard(p,selected,n));
 $('cautionOutlook').innerHTML=cautionCards(p,selected,n).map(item=>cardHtml(item)).join('');
 $('fortuneMethod').innerHTML=`<strong>해설 방식과 한계</strong><p>일간 ${escape(p.day.hanja)}, 월주 ${escape(p.month.hanja)}, 원국 오행 분포, ${selected.year}년의 세운 ${escape(selected.g.hanja)}과 일간 사이의 십성(${escape(selected.ten)}) 및 지지 관계를 바탕으로 설명했습니다. 같은 명리학 관계라도 학파에 따라 풀이가 달라질 수 있습니다. 아직 계산하지 않은 대운·신강·신약·격국·용신을 반영한 것처럼 표시하지 않습니다. 이 앱은 전통 명리학을 읽기 쉽게 풀어 보는 참고용이며 실제 진로·재물·건강·사고 등을 예측하지 않습니다.</p>`;
}
global.SajuPersonalReading={drawOutlook,natalInfo,annual};
})(window);
