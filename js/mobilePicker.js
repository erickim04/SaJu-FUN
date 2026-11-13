/* v1.3 unified direct-entry + wheel selection, works on desktop and mobile */
(function(){
'use strict';
const ids=['calendarType','year','month','day','leapMonth','gender','province','city','hour','minute'];
const form=document.getElementById('birthForm');
if(!form)return;
const $=id=>document.getElementById(id);
const sels=new Map();
const numIds=new Set(['year','month','day','hour','minute']);
let current=null;
let scrollPending=false;
let ignoreWheelScroll=false;
let errorNode=null;
const sheet=document.createElement('div');
sheet.id='mobilePicker';sheet.className='mobile-picker-overlay';sheet.hidden=true;
sheet.innerHTML=`<div class="mobile-picker-backdrop" data-close="yes"></div>
<section class="mobile-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="mobilePickerTitle">
<div class="mobile-picker-handle" aria-hidden="true"></div>
<div class="mobile-picker-head"><h3 id="mobilePickerTitle">항목 선택</h3><button type="button" class="mobile-picker-close" aria-label="선택창 닫기">✕</button></div>
<label class="sr-only" for="mobilePickerFilter">검색 또는 값 입력</label>
<input id="mobilePickerFilter" type="text" autocomplete="off" placeholder="직접 입력하거나 목록에서 선택"/>
<p class="mobile-picker-guide">숫자·이름을 입력하거나 다이얼을 위아래로 움직이세요.</p>
<div class="mobile-picker-wheel-wrap"><div class="mobile-picker-selected-band" aria-hidden="true"></div><div id="mobilePickerWheel" class="mobile-picker-wheel" role="listbox" aria-label="선택 가능한 값"></div></div>
<div id="pickerError" class="picker-inline-error" role="status" hidden></div>
<div class="mobile-picker-actions"><button type="button" id="mobilePickerCancel" class="mobile-picker-cancel">취소</button><button type="button" id="mobilePickerConfirm" class="mobile-picker-confirm">선택 적용</button></div>
</section>`;
document.body.appendChild(sheet);
const wheel=$('mobilePickerWheel'), search=$('mobilePickerFilter');
const pickErr=$('pickerError');
const rowHeight=50;
const values=id=>id==='year'?Array.from({length:201},(_,i)=>({value:String(i+1900),label:String(i+1900)})):
 Array.from($(id).options).filter(o=>!o.disabled&&!o.hidden).map(o=>({value:String(o.value),label:o.textContent.trim()}));
const selectedLabel=(id)=>{
 if(id==='year')return $('year').value;
 const el=$(id);return el.selectedOptions[0]?.textContent.trim()||el.options[0]?.textContent.trim()||'';
};
function clean(s){return String(s||'').trim().replace(/\s+/g,'').toLowerCase();}
function match(id,str,items=values(id)){
 const txt=clean(str);
 if(!txt)return id==='hour'?items.find(x=>x.value===''):null;
 if(id==='year') {const n=Number(txt);return /^\d{4}$/.test(txt)&&n>=1900&&n<=2100?items.find(x=>Number(x.value)===n):null;}
 const alias={solar:['양','양력','solar'],lunar:['음','음력','lunar'],'0':['평달','평'],'1':['윤달','윤'],f:['여','여성'],m:['남','남성'],n:['미지정','지정안함','선택안함'], '':['모름','미입력','없음','모르겠음','-']};
 if(numIds.has(id)){
   const pattern=id==='hour'?/^(?:([0-9]|[01][0-9]|2[0-3])시?|오전(\d{1,2})시?|오후(\d{1,2})시?)$/:id==='minute'?/^(\d{1,2})분?$/:/^(\d{1,2})(?:월|일)?$/;
   if(id==='hour'&&['모름','미입력','없음','-'].includes(txt))return items.find(x=>x.value==='');
   const mt=txt.match(pattern);let n;
   if(id==='hour'&&mt){if(mt[1]!==undefined)n=Number(mt[1]);else if(mt[2]!==undefined)n=Number(mt[2])%12;else n=Number(mt[3])%12+12;}
   else if(mt)n=Number(mt[1]);
   if(n!==undefined)return items.find(x=>x.value!==''&&Number(x.value)===n)||null;
 }
 let exact=items.find(x=>clean(x.label)===txt||clean(x.value)===txt);
 if(exact)return exact;
 if(['calendarType','leapMonth','gender'].includes(id)){
   const found=items.find(x=>alias[x.value]?.includes(txt));if(found)return found;
 }
 const starts=items.filter(x=>clean(x.label).startsWith(txt));
 if(starts.length===1)return starts[0];
 const contains=items.filter(x=>clean(x.label).includes(txt));
 return contains.length===1?contains[0]:null;
}
function markInvalid(id,message){
 const entry=sels.get(id),inp=entry?.input;
 if(inp){inp.classList.add('combo-invalid');inp.setAttribute('aria-invalid','true');inp.title=message;}
 const inline=entry?.field.querySelector('.combo-hint');if(inline)inline.textContent=message;
}
function clearInvalid(id){
 const entry=sels.get(id);if(!entry)return;
 entry.input.classList.remove('combo-invalid');entry.input.removeAttribute('aria-invalid');entry.input.title='';
 const inline=entry.field.querySelector('.combo-hint');if(inline)inline.textContent='';
}
function sync(id,force=true){
 const e=sels.get(id);if(!e)return;
 const native=$(id);
 if(force||document.activeElement!==e.input)e.input.value=selectedLabel(id);
 const dis=!!native.disabled;e.input.disabled=dis;e.button.disabled=dis;
 e.button.setAttribute('aria-label',`${e.label} 다이얼로 선택`);
}
function syncAll(){for(const id of ids)sync(id);}
function selectValue(id,val){
 const el=$(id);
 if(id==='year'){
   const before=el.value;el.value=String(val);
   if(el.value!==before){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
 } else {
   el.value=String(val);
   el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));
 }
 // province selection dynamically rebuilds the city options in app.js
 if(id==='province')sync('city',true);
 if(id==='month'||id==='year'||id==='calendarType')sync('day',true);
 if(id==='hour')sync('minute',true);
 sync(id,true);clearInvalid(id);
}
function commit(id,showError=true){
 const e=sels.get(id);if(!e||e.input.disabled)return true;
 const txt=e.input.value.trim();
 const found=match(id,txt);
 if(!found){
   if(showError)markInvalid(id,`${e.label} 항목을 확인해 주세요. 직접 입력하거나 ⌄ 다이얼에서 선택하세요.`);
   return false;
 }
 selectValue(id,found.value);return true;
}
function commitAll(){
 // validate year and province before day and city; province changes city candidates
 const ordered=['calendarType','year','month','day','leapMonth','gender','province','city','hour','minute'];
 const typed = Object.fromEntries(ordered.map(id=>[id,sels.get(id)?.input.value]));
 for(const id of ordered){
   if(sels.get(id) && typed[id]!==undefined)sels.get(id).input.value=typed[id];
   if($(id).closest('[hidden]')||$(id).disabled)continue;
   if(!commit(id)){
     const entry=sels.get(id);entry.input.focus();entry.field.scrollIntoView({block:'center',behavior:'smooth'});
     return {ok:false,message:`${entry.label} 입력값을 확인해 주세요. 빨간 입력칸을 수정하거나 다이얼을 사용해 주세요.`};
   }
 }
 return {ok:true};
}
window.SajuEntry={commitAll,syncAll,version:'1.4'};
function setError(msg){pickErr.textContent=msg;pickErr.hidden=!msg;}
function paint(items,preferred){
 if(!current)return;
 current.items=items;
 wheel.replaceChildren();
 if(!items.length){const span=document.createElement('p');span.className='mobile-picker-no-results';span.textContent='일치하는 항목이 없습니다.';wheel.appendChild(span);current.pending=null;return;}
 const ix=Math.max(0,items.findIndex(x=>String(x.value)===String(preferred)));
 current.pending=items[ix].value;
 const fragment=document.createDocumentFragment();
 items.forEach((it,i)=>{
   const b=document.createElement('button');b.type='button';b.className='mobile-picker-item';
   b.dataset.index=String(i);b.setAttribute('role','option');b.textContent=it.label;
   b.addEventListener('click',()=>{search.value='';setIndex(i);});fragment.appendChild(b);
 });
 wheel.appendChild(fragment);
 setIndex(ix);
}
function setIndex(ix){
 if(!current||!current.items.length)return;
 const i=Math.max(0,Math.min(current.items.length-1,ix));
 current.pending=current.items[i].value;
 ignoreWheelScroll=true;wheel.scrollTop=i*rowHeight;
 wheel.querySelectorAll('.mobile-picker-item').forEach((el,k)=>{
   const active=k===i;el.classList.toggle('is-active',active);el.setAttribute('aria-selected',String(active));
 });
 requestAnimationFrame(()=>{ignoreWheelScroll=false;});
}
function open(id){
 const e=sels.get(id);if(!e||$(id).disabled)return;
 // Keep a valid currently typed value if one has not yet blurred.
 if(e.input.value.trim()&&match(id,e.input.value))commit(id,false);
 const entries=values(id);current={id,items:[],all:entries,pending:String($(id).value)};
 $('mobilePickerTitle').textContent=e.label+' 선택';
 search.value='';search.inputMode=numIds.has(id)?'numeric':'text';search.placeholder=numIds.has(id)?'숫자 입력 또는 아래에서 선택':'이름 입력 또는 아래에서 선택';
 sheet.hidden=false;document.documentElement.classList.add('mobile-picker-open');setError('');
 paint(entries,$(id).value);
 $('mobilePickerConfirm').focus({preventScroll:true});
}
function close(){sheet.hidden=true;document.documentElement.classList.remove('mobile-picker-open');const id=current?.id;current=null;if(id)sels.get(id)?.button.focus({preventScroll:true});}
function apply(){
 if(!current)return;
 const id=current.id;
 const typed=search.value.trim();
 if(typed){const chosen=match(id,typed);if(!chosen){setError('선택 가능한 항목을 정확하게 입력하거나 다이얼에서 선택해 주세요.');return;}selectValue(id,chosen.value);
 }else if(current.pending!==null){selectValue(id,current.pending);}
 else{setError('항목을 하나 선택해 주세요.');return;}
 close();
}
function searchUpdated(){
 if(!current)return;
 const q=search.value.trim();setError('');
 if(!q){paint(current.all,current.pending);return;}
 const direct=match(current.id,q,current.all);
 if(direct){paint(current.all,direct.value);return;}
 const filtered=current.all.filter(x=>clean(x.label).includes(clean(q))||clean(x.value).includes(clean(q)));
 paint(filtered,filtered[0]?.value);
}
wheel.addEventListener('pointerdown',()=>{if(current)search.value='';},{passive:true});
wheel.addEventListener('scroll',()=>{
 if(scrollPending||ignoreWheelScroll||!current||!current.items.length)return;
 scrollPending=true;
 requestAnimationFrame(()=>{
   scrollPending=false;
   if(!current||!current.items.length||ignoreWheelScroll)return;
   const n=Math.max(0,Math.min(current.items.length-1,Math.round(wheel.scrollTop/rowHeight)));
   current.pending=current.items[n].value;
   wheel.querySelectorAll('.mobile-picker-item').forEach((el,i)=>{
     const selected=i===n;el.classList.toggle('is-active',selected);el.setAttribute('aria-selected',String(selected));
   });
 });
},{passive:true});
search.addEventListener('input',searchUpdated);
search.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();apply();}});
$('mobilePickerConfirm').addEventListener('click',apply);
$('mobilePickerCancel').addEventListener('click',close);
sheet.querySelector('.mobile-picker-close').addEventListener('click',close);
sheet.querySelector('[data-close]').addEventListener('click',close);
sheet.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close();}});
function updateDays(){
 const y=Number($('year').value),m=Number($('month').value), type=$('calendarType').value;
 if(!(y>=1900&&y<=2100&&m>=1&&m<=12))return;
 const max=type==='lunar'?30:new Date(Date.UTC(y,m,0)).getUTCDate();
 const field=$('day');const old=Number(field.value)||1;
 if(field.options.length!==max){field.replaceChildren();for(let d=1;d<=max;d++){const op=document.createElement('option');op.value=String(d);op.textContent=d+'일';field.appendChild(op);}}
 field.value=String(Math.min(old,max));sync('day',true);
}
$('month').addEventListener('change',updateDays);
$('calendarType').addEventListener('change',updateDays);
$('year').addEventListener('input',updateDays);
function create(id){
 const native=$(id);if(!native)return;
 const field=native.closest('.field');if(!field)return;
 const label=field.querySelector('label[for="'+id+'"]')?.textContent.trim()||id;
 field.classList.add('has-combo');
 const wrap=document.createElement('div');wrap.className='combo-shell';
 const inp=id==='year'?native:document.createElement('input');
 if(id!=='year'){
   inp.type='text';inp.className='combo-direct';inp.autocomplete='off';
   inp.inputMode=numIds.has(id)?'numeric':'text';
   inp.setAttribute('aria-label',label+' 직접 입력');
   if(numIds.has(id))inp.pattern='[0-9]*';
 }else{inp.classList.add('combo-direct');inp.setAttribute('aria-label','출생 연도 직접 입력');}
 const btn=document.createElement('button');btn.type='button';btn.className='combo-wheel-btn';btn.textContent='⌄';btn.title=label+' 다이얼로 선택';
 const hint=document.createElement('span');hint.className='combo-hint';hint.setAttribute('aria-live','polite');
 if(id==='year')native.insertAdjacentElement('beforebegin',wrap);
 else native.insertAdjacentElement('afterend',wrap);
 wrap.appendChild(inp);wrap.appendChild(btn);field.appendChild(hint);
 sels.set(id,{field,input:inp,button:btn,label});
 btn.addEventListener('click',()=>open(id));
 if(id!=='year'){
   inp.addEventListener('change',()=>commit(id,false));
   inp.addEventListener('blur',()=>commit(id,false));
   inp.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();if(commit(id))form.requestSubmit();}});
   native.addEventListener('change',()=>{sync(id,true);if(id==='province')sync('city',true);if(id==='hour')sync('minute',true);});
 }else{
   inp.addEventListener('blur',()=>commit(id,false));
   inp.addEventListener('change',()=>commit(id,false));
 }
 sync(id,true);
}
for(const id of ids)create(id);
// Dynamic city options change after province selection, including while loading saved data.
new MutationObserver(()=>sync('city',true)).observe($('city'),{childList:true});
updateDays();syncAll();
})();
