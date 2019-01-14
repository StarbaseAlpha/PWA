'use strict';

function PWA() {

  const init = (swPath) => {

    let installer;
    let onInstallReady;
    let onUpdateReady;
    let installButton;
    let updateButton;

    let pwa = {};
    pwa.sw;

    installButton = document.createElement('button');
    installButton.innerHTML = "Install App";

    updateButton = document.createElement('button');
    updateButton.innerHTML = "Update App";

    if('serviceWorker' in navigator) {
      navigator.serviceWorker.register(swPath).then(reg=>{
        pwa.sw = reg;
        let update = () => {
          return pwa.sw.update();
        };
        pwa.sw.onupdatefound = (e) => {
          if (onUpdateReady && typeof onUpdateReady === 'function') {
            onUpdateReady(updateButton,e);
          }
        };
        updateButton.onclick = () => {
          updateButton.innerHTML = "Updating...";
          pwa.sw.update().then(()=> {
            location.reload();
          });
        };
      });
    };

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installer = e;
      installButton.onclick = (e) => {
        installer.prompt();
      };
      if (onInstallReady && typeof onInstallReady === 'function') {
        onInstallReady(installButton,installer);
      }
    });

    pwa.onInstallReady = (cb) => {
      onInstallReady = cb;
    };

    pwa.onUpdateReady = (cb) => {
      onUpdateReady = cb;
    };

    pwa.update = () => {
      return pwa.sw.update();
    };

    return pwa;

  };

  const SWCache = (resources) => {
    self.addEventListener('install', function(event) {
      event.waitUntil(
        caches.open('sw-cache').then(cache=> {
          return cache.addAll(resources);
        })
      );
    });
    self.addEventListener('fetch', function(event) {
      if (event.request.method === 'GET') {
        event.respondWith(
          caches.match(event.request).then(function(response) {
            return response || fetch(event.request, {"redirect":"follow"}).then(response=>{
              return response;
            })
          })
        );
      }
    });
  };

  return {"init":init, "SWCache":SWCache}

}
