// 최소 DOM 모형으로 실제 앱의 이벤트/화면 데이터 연결을 검사합니다.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const elements={};
function make(id){
 let value='',html='';
 return elements[id]={id,hidden:false,checked:false,disabled:false,events:{},
  get value(){return value;},set value(v){value=String(v);},
  get innerHTML(){return html;},set innerHTML(v){html=String(v); const selected=html.match(/<option value="([^"]*)" selected/);const first=html.match(/<option value="([^"]*)"/);if(selected||first)value=(selected||first)[1];},
  textContent:'',className:'',style:{},
  addEventListener(name,handler){this.events[name]=handler;},querySelectorAll(){return[];},scrollIntoView(){}
 };
}
const ids=['month','day','hour','minute','province','city','calendarType','leapField','birthForm','remember','formNotice','year','gender','leapMonth','resultEmpty','elementEmpty','resultBody','elementBody','numbersEmpty','numbersBody','resultIntro','timeTabs','pillars','comparison','ziCompare','resultWarning','elementsChart','simpleReading','technicalTable','monthLabel','prevMonth','nextMonth','todayMonth','calendarGrid','dateDetails','numbersMeta','numbersGrid','numbersNotice','refreshNumbers','copyNumbers','result-section'];
ids.forEach(make);
elements.calendarType.value='solar';elements.year.value='1982';elements.gender.value='f';elements.leapMonth.value='0';
const context={window:{},Date,Intl,console,document:{getElementById(id){return elements[id]||make(id);}},navigator:{},location:{protocol:'file:'},localStorage:{getItem(){return null;},setItem(){},removeItem(){}}};
vm.createContext(context);
for(const f of ['data/terms.js','data/lunar.js','js/core.js','js/symbolicNumbers.js','js/app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
assert.strictEqual(elements.numbersEmpty.hidden,false,'pre-analysis placeholder');
elements.birthForm.events.submit({preventDefault(){}});
assert.strictEqual(elements.numbersEmpty.hidden,true,'placeholder hidden after submit');
assert.strictEqual(elements.numbersBody.hidden,false,'number panel visible');
let cards=elements.numbersGrid.innerHTML.match(/class="number-card"/g)||[];
let balls=elements.numbersGrid.innerHTML.match(/class="number-ball /g)||[];
assert.strictEqual(cards.length,5);
assert.strictEqual(balls.length,30);
let first=elements.numbersGrid.innerHTML;
elements.refreshNumbers.events.click();
assert.notStrictEqual(elements.numbersGrid.innerHTML,first,'regeneration changes content');
elements.nextMonth.onclick();
assert(/월운/.test(elements.numbersMeta.textContent),'month still linked');
console.log('DOM SMOKE TESTS PASSED | 5 groups, 30 number balls, refresh and month change');
