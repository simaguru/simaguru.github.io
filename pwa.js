// pwa.js - kemampuan pasang aplikasi SIMA.
// File terpisah supaya logika login (app.js) tidak tercampur.
(function () {
  'use strict';

  // Apakah sedang berjalan sebagai aplikasi terpasang (bukan tab browser)?
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }

  // 1) Daftarkan service worker (syarat agar Chrome menawarkan pasang)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').catch(function (err) {
        console.warn('Service worker gagal didaftarkan:', err);
      });
    });
  }

  // 2) Tombol "Pasang aplikasi" (hanya di browser, tidak di aplikasi terpasang)
  var foot = document.querySelector('.card .foot');
  var tombol = null;
  var petunjukIos = null;
  var promptTertunda = null;

  function buatTombol() {
    if (tombol || !foot) return;
    tombol = document.createElement('button');
    tombol.type = 'button';
    tombol.className = 'installBtn hidden';
    tombol.textContent = 'Pasang aplikasi SIMA';
    foot.parentNode.insertBefore(tombol, foot);
    tombol.addEventListener('click', function () {
      if (!promptTertunda) return;
      promptTertunda.prompt();
      promptTertunda.userChoice.finally(function () {
        promptTertunda = null;
        tombol.classList.add('hidden');
      });
    });
  }

  if (!isStandalone()) {
    buatTombol();

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      promptTertunda = e;
      if (tombol) tombol.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', function () {
      promptTertunda = null;
      if (tombol) tombol.classList.add('hidden');
    });

    // iPhone/iPad tidak punya tombol pasang otomatis, beri petunjuk singkat
    var ua = window.navigator.userAgent || '';
    var iOS = /iphone|ipad|ipod/i.test(ua) ||
              (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1);
    if (iOS && foot) {
      petunjukIos = document.createElement('div');
      petunjukIos.className = 'installHint';
      petunjukIos.textContent = 'Untuk memasang di iPhone/iPad: ketuk tombol Bagikan, lalu pilih "Tambah ke Layar Utama".';
      foot.parentNode.insertBefore(petunjukIos, foot);
    }
  }

  // 3) Setelah login: saat berjalan sebagai aplikasi terpasang, backend dimuat
  //    di iframe pada halaman yang sama supaya tetap layar penuh.
  //    Di browser biasa: kembalikan false, app.js tetap pindah halaman seperti dulu.
  function bukaBackend(url) {
    if (!isStandalone()) return false;

    var kanvas = document.querySelector('.canvas');
    var frame = document.createElement('iframe');
    frame.id = 'sima-frame';
    frame.title = 'SIMA';
    frame.setAttribute('allow', 'clipboard-read; clipboard-write');
    frame.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    frame.style.visibility = 'hidden';

    var tampil = function () {
      frame.style.visibility = 'visible';
      if (kanvas) kanvas.style.display = 'none';
    };
    frame.addEventListener('load', tampil);
    setTimeout(tampil, 8000); // cadangan bila event load tidak terpicu

    frame.src = url;
    document.body.appendChild(frame);
    return true;
  }

  window.SIMA_PWA = { isStandalone: isStandalone, bukaBackend: bukaBackend };
})();
