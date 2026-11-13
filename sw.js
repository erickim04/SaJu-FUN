const NAME='saju-calendar-v1-6-20261113';
const FILES=['./','./index.html','./style.css?v=1.6','./manifest.webmanifest','./js/core.js?v=1.6','./js/symbolicNumbers.js?v=1.6','./js/fortuneFlow.js?v=1.6','./js/app.js?v=1.6','./js/mobilePicker.js?v=1.6','./data/terms.js?v=1.6','./data/lunar.js?v=1.6','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(NAME).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request).then(res=>{if(res.ok&&new URL(e.request.url).origin===self.location.origin){const cp=res.clone();caches.open(NAME).then(c=>c.put(e.request,cp)).catch(()=>{});}return res;}).catch(()=>caches.match(e.request)));});
