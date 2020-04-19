'use strict';

function PWA() {

  const app = (swURL, onInstallReady=null, onUpdateReady=null) => {

    navigator.serviceWorker.register(swURL);

    const getServiceWorker = async () => {
      return await navigator.serviceWorker.getRegistration();
    };

    const RESET = async () => {
      caches.delete('resources');
      await getServiceWorker().unregister().then(()=>{
        location.reload();
      });
    };

    window.addEventListener('beforeinstallprompt', function (e) {
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

  const sw = (resources=[], offlineURL=null) => {

    if (offlineURL && !resources.includes(offlineURL)) {
      resources.push(offlineURL);
    }

    self.addEventListener('install', async (e) => {
      console.log("Installing Service Worker...");
      await caches.delete('resources');
      let cache = await caches.open('resources');
      await cache.addAll(resources);
      return self.skipWaiting();
    });

    self.addEventListener('activate', async (e) => {
      console.log('Service Worker Activated!');
    });

    self.addEventListener('fetch', e => {
      if (e.request.method !== 'GET') {
        return null;
      }
      e.respondWith(
        fetch(e.request).then(async response => {
          if (!response) {
            if (offlineURL) {
              return caches.match(offlineURL);
            } else {
              return null;
            }
          }
          if (response.status > 499) {
            let cached = await caches.match(e.request);
            if (cached) {
              return cached;
            } else {
              if (offlineURL) {
                return caches.match(offlineURL);
              }
            }
          }
          let cache = await caches.open('resources');
          cache.put(e.request, response.clone());
          return response;
        }).catch(async (err) => {
          let cached = await caches.match(e.request);
          if (cached) {
            return cached;
          } else {
            if (offlineURL) {
              return caches.match(offlineURL);
            }
          }
        })
      );
    });

    let SW = {};
    return SW;

  };

  return {app, sw};

}
