
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const context={window:{},Intl,Date,console};vm.createContext(context);
for(const file of ['data/terms.js','data/lunar.js','js/core.js','js/fortuneFlow.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const C=context.window.SajuCore,F=context.window.SajuFortune;
const p=C.computePillars(C.resolveKoreaWall(1982,6,25,11,33)[0],126.978,true)[0];
const pair=[1,0,11,10,9,8,7,6,5,4,3,2];
let harmony=0,wealth=0;
for(let d=1;d<=30;d++){
 const g=C.dayGanzhi(2026,11,d),actual=F.symbolicDayFlags(p,2026,11,d);
 const expectedHarmony=((p.day.stemI+5)%10===g.stemI||pair[p.day.branchI]===g.branchI);
 const expectedWealth=['정재','편재'].includes(C.tenGod(p.day.stemI,g.stemI));
 assert.strictEqual(actual.harmony,expectedHarmony,'harmony '+d);
 assert.strictEqual(actual.wealth,expectedWealth,'wealth '+d);
 assert.strictEqual(actual.harmonyReasons.length>0,expectedHarmony);
 assert.strictEqual(actual.wealthReasons.length>0,expectedWealth);
 harmony+=actual.harmony?1:0;wealth+=actual.wealth?1:0;
}
assert(harmony>0&&wealth>0,'Both categories exist');
console.log('PASS personal symbolic days: harmony '+harmony+', wealth '+wealth);
