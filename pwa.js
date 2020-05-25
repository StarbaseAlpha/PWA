'use strict';

function PWA() {

  const app = (swURL, onInstallReady=null, onUpdateReady=null, onRefreshReady=null, cacheName="resources") => {

    navigator.serviceWorker.register(swURL);

    const getServiceWorker = async () => {
      return await navigator.serviceWorker.getRegistration();
    };

    const RESET = async () => {
      caches.delete(cacheName);
      await getServiceWorker().then(reg=>{
        reg.unregister().then(()=>{
          location.reload();
        }).catch(err=>{
          location.reload();
        });
      });
    };

    window.addEventListener('beforeinstallprompt', (e) => {
      let install = async (cb) => {
        e.prompt();
        e.userChoice.then(result => {
        if (cb && typeof cb === 'function') {
          cb(result);
        }
        });
      };
      if (onInstallReady && typeof onInstallReady === 'function') {
        onInstallReady(install);
      }
    });

    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data.msg && e.data.msg === 'refresh') {
        if (e.data && e.data.url && location.href === e.data.url) {
          if (onRefreshReady && typeof onRefreshReady === 'function') {
            onRefreshReady(true);
          }
        }
      }
    });

    navigator.serviceWorker.getRegistration().then(reg=>{
      if (reg) {
        reg.addEventListener('updatefound', ()=>{
          if (onUpdateReady && typeof onUpdateReady === 'function') {
            onUpdateReady(true);
          }
        });
      }
    });

    return {getServiceWorker, RESET};

  };

  const sw = (resources, offlineURL=null, cacheName="resources") => {

    if (offlineURL && !cacheName.includes(offlineURL)) {
      cacheName.push(offlineURL);
    }

    self.addEventListener('install', async (e) => {
      console.log("Installing Service Worker...");
      await caches.delete(cacheName);
      let cache = await caches.open(cacheName);
      await cache.addAll(resources);
      return self.skipWaiting();
    });

    self.addEventListener('activate', async (e) => {
      console.log('Service Worker Activated!');
    });

    const fetchNew = async (request) => {
        return fetch(request).then(async response=>{
          if (response.status === 200) {
            let cache = await caches.open(cacheName);
            let cached = await cache.match(request);
            if (cached && response.headers.get('eTag') !== cached.headers.get('eTag')) {
              await cache.put(request, response.clone());
              let allClients = await clients.matchAll();
              for(let client of allClients) {
                client.postMessage({"msg":"refresh", "url":request.url});
              }
              return;
            }
          }
        }).catch(err=>{
          return;
        });
    };

    self.addEventListener('fetch', async (e) => {
      if (e.request.method !== 'GET') {
        return;
      }
      e.respondWith((async ()=> {
        let cache = await caches.open(cacheName);
        let cached = await cache.match(e.request, {"ignoreSearch":true});
        if (cached) {
          e.waitUntil(fetchNew(e.request));
          return cached;
        } else {
          return fetch(e.request).then(async response=>{
            if (response.status === 200) {
              await cache.put(e.request, response.clone());
            }
            return response;
          }).catch(err=>{
            return cache.match('/offline');
          });
        }
      })());
    });

    let SW = {};
    return SW;

  };

  return {app, sw};

}
