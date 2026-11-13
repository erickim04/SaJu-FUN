/* 사주 달력 1차: 실제 날짜/간지 계산. 가중 분석/용신 판단은 보류. */
(function(global){
'use strict';
const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ST_KO=['갑','을','병','정','무','기','경','신','임','계'];
const BR_KO=['자','축','인','묘','진','사','오','미','신','유','술','해'];
const STEM_E=['목','목','화','화','토','토','금','금','수','수'];
const BRANCH_E=['수','토','목','목','토','화','화','토','금','금','토','수'];
const E_INDEX=['목','화','토','금','수'];
const HIDDEN=[['癸'],['己','癸','辛'],['甲','丙','戊'],['乙'],['戊','乙','癸'],['丙','戊','庚'],['丁','己'],['己','丁','乙'],['庚','壬','戊'],['辛'],['戊','辛','丁'],['壬','甲']];
const SOLAR_MONTH_START=['입춘','경칩','청명','입하','망종','소서','입추','백로','한로','입동','대설','소한'];
const mod=(x,n)=>(x%n+n)%n;
const fmtDate=d=>d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
const dUTC=(y,m,d)=>new Date(Date.UTC(y,m-1,d));
const toYmd=(date)=>({y:date.getUTCFullYear(),m:date.getUTCMonth()+1,d:date.getUTCDate(),h:date.getUTCHours(),mi:date.getUTCMinutes()});
const isoToMs=s=>Date.parse(s+'T00:00:00Z');
function validGregorian(y,m,d){if(!Number.isInteger(y)||y<1900||y>2100||!Number.isInteger(m)||m<1||m>12||!Number.isInteger(d)||d<1||d>31)return false;return fmtDate(dUTC(y,m,d))===`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function lunarToSolar(y,m,d,leap){
 const ls=global.SAJU_LUNAR_MONTHS||[];if(y<1900||y>2050)throw Error('현재 음력 출생일 입력은 1900~2050년 자료에서만 지원합니다.');
 const i=ls.findIndex(a=>a[1]===y&&a[2]===m&&a[3]===(leap?1:0));
 if(i<0)throw Error('선택하신 연·월에 해당 음력 '+(leap?'윤달':'평달')+'이 없습니다.');
 const s=isoToMs(ls[i][0]); const next=(ls[i+1]&&isoToMs(ls[i+1][0]))||Date.UTC(2051,0,1);
 if(s+(d-1)*86400000>Date.UTC(2050,11,31))throw Error('2050년 말의 음력 데이터는 일부 미지원입니다. 해당 날짜는 양력으로 입력해 주세요.');
 if(!Number.isInteger(d)||d<1||s+(d-1)*86400000>=next)throw Error('해당 음력 월에 존재하지 않는 날짜입니다.');
 const t=new Date(s+(d-1)*86400000);return toYmd(t);
}
function solarToLunar(y,m,d){const t=Date.UTC(y,m-1,d);const ls=global.SAJU_LUNAR_MONTHS||[];
 let lo=0,hi=ls.length-1,idx=-1;while(lo<=hi){const mid=(lo+hi)>>1;if(isoToMs(ls[mid][0])<=t){idx=mid;lo=mid+1;}else hi=mid-1;}
 if(idx<0||y>2050)return null;
 const a=ls[idx];const day=Math.round((t-isoToMs(a[0]))/86400000)+1;
 return {year:a[1],month:a[2],day,leap:!!a[3]};
}
const TERMS=()=>global.SAJU_TERMS||[];
function termBefore(ms, names){const terms=TERMS();let lo=0,hi=terms.length-1,idx=-1;while(lo<=hi){let mid=(lo+hi)>>1;if(terms[mid][1]<=ms){idx=mid;lo=mid+1}else hi=mid-1;}
 for(let j=idx;j>=0;j--)if(!names||names.includes(terms[j][0]))return terms[j];return null;}
function termAfter(ms,names){for(const a of TERMS())if(a[1]>ms&&(!names||names.includes(a[0])))return a;return null;}
function termsInMonth(y,m){return TERMS().filter(a=>{const date=koreanLocalParts(a[1]);return date.year===y&&date.month===m});}
function ganzhi(i){const n=mod(i,60);return{index:n,stem:STEMS[n%10],branch:BRANCHES[n%12],hanja:STEMS[n%10]+BRANCHES[n%12],ko:ST_KO[n%10]+BR_KO[n%12],stemI:n%10,branchI:n%12,stemElement:STEM_E[n%10],branchElement:BRANCH_E[n%12]};}
function dayGanzhi(y,m,d){if(!validGregorian(y,m,d))throw Error('유효한 날짜가 아닙니다.'); const delta=Math.round((Date.UTC(y,m-1,d)-Date.UTC(2026,10,9))/86400000);return ganzhi(23+delta);}
function yearMonthGanzhi(utcMs){
 const ipchun=termBefore(utcMs,['입춘']);if(!ipchun)throw Error('입춘 자료가 없습니다.');
 const year=koreanLocalParts(ipchun[1]).year;const yG=ganzhi(year-1984);
 const term=termBefore(utcMs,SOLAR_MONTH_START);if(!term)throw Error('절입 시각 자료가 없습니다.');
 const slot=SOLAR_MONTH_START.indexOf(term[0]);
 const monthStem=mod(2*(yG.stemI%5)+2+slot,10);
 const monthBranch=mod(2+slot,12);
 const monthG={stem:STEMS[monthStem],branch:BRANCHES[monthBranch],hanja:STEMS[monthStem]+BRANCHES[monthBranch],ko:ST_KO[monthStem]+BR_KO[monthBranch],stemI:monthStem,branchI:monthBranch,stemElement:STEM_E[monthStem],branchElement:BRANCH_E[monthBranch]};
 return {year:yG,month:monthG,monthEntry:term,solarYear:year};
}
const koreaFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function koreanLocalParts(t){const out={};for(const x of koreaFormatter.formatToParts(new Date(t)))if(['year','month','day','hour','minute'].includes(x.type))out[x.type]=Number(x.value);return out;}
function resolveKoreaWall(y,m,d,h,mi){
 const desired=`${y}-${m}-${d}-${h}-${mi}`,result=[];const presumed=Date.UTC(y,m-1,d,h,mi);
 for(const secs of [8*3600+27*60+52,8.5*3600,9*3600,9.5*3600,10*3600]){
  const utc=presumed-secs*1000;const p=koreanLocalParts(utc);
  if(`${p.year}-${p.month}-${p.day}-${p.hour}-${p.minute}`===desired&&!result.includes(utc))result.push(utc);
 }
 result.sort((a,b)=>a-b);return result;
}
function eqTimeMinutes(utcMs){
 // NOAA의 균시차 근삿값; 정밀 천문 역서의 진태양시가 아님
 const d=new Date(utcMs),y=d.getUTCFullYear();let yd=(utcMs-Date.UTC(y,0,1))/86400000+1;
 const g=2*Math.PI/365*(yd-1+(d.getUTCHours()-12)/24);
 return 229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
}
function timesFor(utcMs, longitude){
 const local=koreanLocalParts(utcMs);const mean=toYmd(new Date(utcMs+longitude*4*60000));const eot=eqTimeMinutes(utcMs);
 const trueTime=toYmd(new Date(utcMs+(longitude*4+eot)*60000));
 return[{key:'standard',label:'기록된 법정시',value:{y:local.year,m:local.month,d:local.day,h:local.hour,mi:local.minute},note:'과거 표준시·서머타임 반영'},{key:'mean',label:'지방평균태양시',value:mean,note:'경도 '+longitude.toFixed(3)+'° 적용'},{key:'true',label:'진태양시(근사)',value:trueTime,note:'경도 + 균시차 약 '+eot.toFixed(1)+'분'}];
}
function hourGanzhi(dayStemI,h){const b=mod(Math.floor((h+1)/2),12),s=mod((dayStemI%5)*2+b,10);return{hanja:STEMS[s]+BRANCHES[b],ko:ST_KO[s]+BR_KO[b],stem:STEMS[s],branch:BRANCHES[b],stemI:s,branchI:b,stemElement:STEM_E[s],branchElement:BRANCH_E[b]};}
function computePillars(utcMs,longitude,hasTime){const ym=yearMonthGanzhi(utcMs);
 return timesFor(utcMs,longitude).map(item=>{const a=item.value;
 const dg=dayGanzhi(a.y,a.m,a.d);const midHour=hasTime?hourGanzhi(a.h===23?ganzhi(dg.index+1).stemI:dg.stemI,a.h):null;
 const time23date=a.h===23?toYmd(new Date(Date.UTC(a.y,a.m-1,a.d)+86400000)):a;
 const dg23=dayGanzhi(time23date.y,time23date.m,time23date.d);
 const hr23=hasTime?hourGanzhi(dg23.stemI,a.h):null;
 return {...item,year:ym.year,month:ym.month,day:dg,hour:midHour,alternativeDay:dg23,alternativeHour:hr23,hasTime,entry:ym.monthEntry};
 });
}
function elementsOfPillars(p){const counts={목:0,화:0,토:0,금:0,수:0};for(const g of [p.year,p.month,p.day,...(p.hour?[p.hour]:[])]){counts[g.stemElement]++;counts[g.branchElement]++;}return counts;}
function tenGod(dayStemI, targetStemI){const owner=E_INDEX.indexOf(STEM_E[dayStemI]),target=E_INDEX.indexOf(STEM_E[targetStemI]);const same=(dayStemI%2)===(targetStemI%2);
 if(owner===target)return same?'비견':'겁재';
 if(mod(owner+1,5)===target)return same?'식신':'상관';
 if(mod(owner+2,5)===target)return same?'편재':'정재';
 if(mod(target+1,5)===owner)return same?'편인':'정인';
 return same?'편관':'정관';
}
const CITY_LIST=[
['서울특별시','서울',126.978],['부산광역시','부산',129.075],['대구광역시','대구',128.602],['인천광역시','인천',126.705],['광주광역시','광주',126.852],['대전광역시','대전',127.384],['울산광역시','울산',129.312],['세종특별자치시','세종',127.289],
['경기도','수원',127.029],['경기도','성남',127.127],['경기도','고양',126.833],['경기도','용인',127.178],['경기도','부천',126.767],['경기도','안산',126.831],['경기도','안양',126.953],['경기도','화성',126.832],['경기도','오산',127.077],['경기도','평택',127.112],['경기도','파주',126.78],['경기도','김포',126.715],['경기도','의정부',127.034],['경기도','남양주',127.216],['경기도','구리',127.129],
['강원특별자치도','춘천',127.73],['강원특별자치도','원주',127.946],['강원특별자치도','강릉',128.877],['강원특별자치도','속초',128.591],
['충청북도','청주',127.49],['충청북도','충주',127.925],['충청남도','천안',127.15],['충청남도','아산',127.003],['충청남도','공주',127.121],
['전북특별자치도','전주',127.148],['전북특별자치도','익산',126.958],['전북특별자치도','군산',126.737],
['전라남도','목포',126.392],['전라남도','여수',127.66],['전라남도','순천',127.488],
['경상북도','포항',129.366],['경상북도','경주',129.224],['경상북도','구미',128.344],['경상북도','안동',128.729],
['경상남도','창원',128.68],['경상남도','진주',128.108],['경상남도','김해',128.89],['경상남도','양산',129.037],['경상남도','거제',128.622],
['제주특별자치도','제주',126.531],['제주특별자치도','서귀포',126.56]
].map((c,i)=>({id:i,province:c[0],name:c[1],longitude:c[2]}));
function pad(n){return String(n).padStart(2,'0')}
function humanDate(v){return `${v.y}.${pad(v.m)}.${pad(v.d)} ${pad(v.h)}:${pad(v.mi)}`;}
const explain={목:'성장·발전·확장의 상징',화:'활동·표현·열기의 상징',토:'안정·조율·중심의 상징',금:'정리·결단·규칙의 상징',수:'유연·사고·적응의 상징'};
global.SajuCore={STEMS,BRANCHES,ST_KO,BR_KO,STEM_E,BRANCH_E,E_INDEX,HIDDEN,SOLAR_MONTH_START,CITY_LIST,mod,pad,fmtDate,validGregorian,lunarToSolar,solarToLunar,termBefore,termAfter,termsInMonth,ganzhi,dayGanzhi,yearMonthGanzhi,resolveKoreaWall,koreanLocalParts,eqTimeMinutes,timesFor,computePillars,elementsOfPillars,tenGod,humanDate,explain};
})(window);
