/* Mail - auto update service worker (network-first) */
var CACHE='mail-v1';
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

self.addEventListener('notificationclick',function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(cs){
    if(cs.length)return cs[0].focus();
    return self.clients.openWindow('./');
  }));
});
