const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'); const context={window:{}, Intl,Date,console};
vm.createContext(context); for(const file of ['data/terms.js','data/lunar.js','js/core.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf-8'),context,{filename:file});
const C=context.window.SajuCore;
function same(a,b,txt){assert.strictEqual(a,b,txt)}
console.log('1. Basic sexagenary day...');
same(C.dayGanzhi(2026,11,9).hanja,'丁亥','2026-11-09');
same(C.dayGanzhi(2026,11,13).hanja,'辛卯','2026-11-13');
same(C.dayGanzhi(1982,6,25).hanja,'己卯','1982-06-25');
same(C.dayGanzhi(1900,1,1).hanja,'甲戌','1900-01-01');
same(C.dayGanzhi(2100,12,31).hanja.length,2,'year2100');
console.log('2. Lunar / leap month...');
const lm=C.lunarToSolar(2025,6,1,true);same(`${lm.y}-${lm.m}-${lm.d}`,'2025-7-25');
const ln=C.lunarToSolar(2025,6,1,false);same(`${ln.y}-${ln.m}-${ln.d}`,'2025-6-25');
const so=C.solarToLunar(2026,11,9);same(`${so.year}/${so.month}/${so.day}`, '2026/10/1');
assert.throws(()=>C.lunarToSolar(2051,1,1,false));assert.throws(()=>C.lunarToSolar(2026,6,1,true));
console.log('3. Solar terms / month pillar transitions...');
const terms=C.termsInMonth(2026,11);const ipdong=terms.find(x=>x[0]==='입동');
const stamp=new Date(ipdong[1]+9*3600000),time=stamp.toISOString().slice(11,16);same(time,'18:52');
same(C.yearMonthGanzhi(ipdong[1]-60000).month.hanja,'戊戌');
same(C.yearMonthGanzhi(ipdong[1]+60000).month.hanja,'己亥');
same(C.yearMonthGanzhi(ipdong[1]+60000).year.hanja,'丙午');
console.log('4. Seoul civil time / DST...');
const regular=C.resolveKoreaWall(1982,6,25,11,33);same(regular.length,1);const pts=C.computePillars(regular[0],126.978,true);
same(pts[0].year.hanja,'壬戌');same(pts[0].month.hanja,'丙午');same(pts[0].day.hanja,'己卯');
const springGap=C.resolveKoreaWall(1987,5,10,2,30);same(springGap.length,0,'KST DST spring gap');
const fall=C.resolveKoreaWall(1987,10,11,2,30);same(fall.length,2,'KST DST fallback overlap');
const pre=C.resolveKoreaWall(1955,1,1,12,0);same(pre.length,1); // UTC+8:30
console.log('5. Day boundary comparison...');
const late=C.resolveKoreaWall(2026,11,9,23,30);
const out=C.computePillars(late[0],126.978,true)[0];same(out.day.hanja,'丁亥');same(out.alternativeDay.hanja,'戊子');
console.log('6. Elements / ten gods...');
same(C.tenGod(0,7),'정관');same(C.tenGod(0,6),'편관');same(C.tenGod(0,8),'편인');same(C.tenGod(0,5),'정재');
const count=C.elementsOfPillars(pts[0]);same(Object.values(count).reduce((a,b)=>a+b),8);
console.log('ALL TESTS PASSED');
console.log('7. Five symbolic number groups / deterministic composition...');
vm.runInContext(fs.readFileSync(path.join(root,'js/symbolicNumbers.js'),'utf-8'),context,{filename:'js/symbolicNumbers.js'});
const S=context.window.SajuSymbolicNumbers;
const monthPillar=C.yearMonthGanzhi(Date.UTC(2026,10,15,3)).month;
const solar={y:1982,m:6,d:25};
for(const seedVariant of [0,1,2,5,100]){
 const generated=S.generate(pts[0],monthPillar,solar,2026,11,seedVariant);
 same(generated.groups.length,5);
 const all=generated.groups.flatMap(g=>g.numbers);
 same(all.length,30);same(new Set(all).size,30,'no repeated number across five groups');
 assert(all.every(n=>Number.isInteger(n)&&n>=1&&n<=45));
 for(const group of generated.groups){
   same(group.numbers.length,6);
   same(new Set(group.numbers).size,6);
   const categories=group.numbers.map(S.elementForNumber);
   for(const el of ['목','화','토','금','수'])assert(categories.includes(el));
   same(categories.filter(el=>el===group.focus).length,2);
   same(group.numbers.slice().sort((a,b)=>a-b).join(','),group.numbers.join(','),'ascending display');
 }
 same(JSON.stringify(S.generate(pts[0],monthPillar,solar,2026,11,seedVariant).groups),JSON.stringify(generated.groups),'deterministic input');
}
const groupsA=S.generate(pts[0],monthPillar,solar,2026,11,0).groups;
assert.notStrictEqual(JSON.stringify(groupsA),JSON.stringify(S.generate(pts[0],monthPillar,solar,2026,11,1).groups));
assert.notStrictEqual(JSON.stringify(groupsA),JSON.stringify(S.generate(pts[0],monthPillar,solar,2026,12,0).groups));
console.log('SYMBOLIC NUMBER TESTS PASSED');
