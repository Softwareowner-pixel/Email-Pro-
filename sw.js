/* Mail - auto update service worker (network-first) */
var CACHE='mail-v4';
var FILES=['./','index.html','manifest.json','icon-192.png'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES).catch(function(){});}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));})
    .then(function(){return self.clients.claim();})
  );
});

/* Hamesha pehle internet se naya file lo, net na ho to purani cache se kholo */
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET'||r.url.indexOf(self.location.origin)!==0)return;
  e.respondWith(
    fetch(r,{cache:'no-store'}).then(function(res){
      var cp=res.clone();
      caches.open(CACHE).then(function(c){c.put(r,cp)}).catch(function(){});
      return res;
    }).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html');});})
  );
});

/* ---------- BAND APP PAR PUSH (Cloudflare Worker se aata hai) ---------- */
/* Ye handler na ho to push aati to ha lekin notification dikhti nahi */
self.addEventListener('push',function(e){
  var title='Mail', body='New email', data={};
  try{
    if(e.data){
      var t=e.data.text();
      try{ data=JSON.parse(t)||{}; }catch(_){ if(t)body=t; }
      if(data.title)title=data.title;
      if(data.body||data.text||data.msg)body=data.body||data.text||data.msg;
    }
  }catch(_){}
  e.waitUntil(self.registration.showNotification(title,{
    body:body,
    tag:'dc-push',
    renotify:true,
    icon:'icon-192.png',
    badge:'icon-192.png',
    vibrate:[120,60,120],
    data:data
  }));
});

/* push subscription expire ho jaye to app khulne par pushRegister() dobara bana dega */
self.addEventListener('pushsubscriptionchange',function(e){
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    cs.forEach(function(c){ try{c.postMessage({type:'resub'});}catch(_){} });
  }));
});

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  var id=(e.notification.data&&e.notification.data.id)||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    if(cs.length){ if(id){ try{cs[0].postMessage({type:'open',id:id});}catch(_){} } return cs[0].focus(); }
    return self.clients.openWindow(id?'./?c='+id:'./');
  }));
});
