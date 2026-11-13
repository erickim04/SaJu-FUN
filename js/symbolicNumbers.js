/* 개인용 오행 상징 숫자 생성기: 예측/당첨 확률 모델이 아닙니다. */
(function(global){
'use strict';
// 하도(河圖) 숫자 상징을 1~45로 반복 확장한 앱 내부 표현 규칙.
// 1·6=수, 2·7=화, 3·8=목, 4·9=금, 5·0=토. 자연수의 끝자리만 사용.
const ELEMENTS=['목','화','토','금','수'];
const DIGIT_TO_ELEMENT={0:'토',1:'수',2:'화',3:'목',4:'금',5:'토',6:'수',7:'화',8:'목',9:'금'};
function elementForNumber(number){
 if(!Number.isInteger(number)||number<1||number>45)throw Error('숫자 범위는 1~45입니다.');
 return DIGIT_TO_ELEMENT[number%10];
}
function hashString(text){
 let h=2166136261;
 for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
 return h>>>0;
}
function randomGenerator(seed){
 let a=seed>>>0;
 return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function shuffled(list,random){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function generate(p,monthPillar,sol,year,month,variant=0,timeMode='standard'){
 if(!p||!monthPillar||!sol||!Number.isInteger(year)||!Number.isInteger(month))throw Error('사주 계산 결과와 조회 월이 필요합니다.');
 const identity=[p.year.hanja,p.month.hanja,p.day.hanja,p.hour?.hanja||'시미상',p.value.y,p.value.m,p.value.d,p.value.h,p.value.mi,sol.y,sol.m,sol.d,monthPillar.hanja,year,month,timeMode,variant].join('|');
 const seed=hashString(identity);
 const random=randomGenerator(seed);
 const pools={};for(const element of ELEMENTS)pools[element]=shuffled(Array.from({length:45},(_,i)=>i+1).filter(n=>elementForNumber(n)===element),random);
 const first=(ELEMENTS.indexOf(p.day.stemElement)+ELEMENTS.indexOf(monthPillar.stemElement))%5;
 const groups=[];
 for(let g=0;g<5;g++){
  const focus=ELEMENTS[(first+g)%5];
  const nums=ELEMENTS.map(el=>pools[el].pop());
  nums.push(pools[focus].pop());
  nums.sort((a,b)=>a-b);
  groups.push({index:g+1,focus,numbers:nums});
 }
 return {groups,monthPillar,seed,year,month,method:'오행 5가지 1개씩 + 강조 오행 1개',methodDetail:'끝자리 오행 대응: 1·6 수, 2·7 화, 3·8 목, 4·9 금, 5·0 토'};
}
global.SajuSymbolicNumbers={generate,elementForNumber,ELEMENTS};
})(window);
