// pwa.js - kemampuan pasang aplikasi SIMA.
// File terpisah supaya logika login (app.js) tidak tercampur.
(function () {
  'use strict';

  var DISMISS_KEY = 'sima_install_dismissed';

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

  // 2) Banner "Pasang aplikasi SIMA" yang melayang di bawah layar.
  //    Hanya di browser (tidak di aplikasi terpasang), dan bisa ditutup (X).
  var banner = null;
  var promptTertunda = null;

  function sudahDitutup() {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; }
  }

  function tutupBanner(ingat) {
    if (!banner) return;
    banner.classList.remove('show');
    if (ingat) { try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {} }
  }

  function buatBanner(modeIos) {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'installFloat';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Pasang aplikasi SIMA');
    banner.innerHTML =
      '<div class="ifIcon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M12 4L2 8.5L12 13L22 8.5L12 4Z" fill="currentColor"/>' +
        '<path d="M6 10.3V15C6 15 8.5 17 12 17C15.5 17 18 15 18 15V10.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M21 9.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '<circle cx="21" cy="16.5" r="1.1" fill="currentColor"/></svg></div>' +
      '<div class="ifText"><div class="ifTitle">Pasang aplikasi SIMA</div>' +
        '<div class="ifSub">' + (modeIos
          ? 'Ketuk tombol Bagikan, lalu pilih \u201CTambah ke Layar Utama\u201D.'
          : 'Buka lebih cepat dari layar utama, tampil layar penuh.') + '</div></div>' +
      (modeIos ? '' : '<button type="button" class="ifBtn">Pasang</button>') +
      '<button type="button" class="ifClose" aria-label="Tutup">\u00D7</button>';
    document.body.appendChild(banner);

    banner.querySelector('.ifClose').addEventListener('click', function () { tutupBanner(true); });

    var tombol = banner.querySelector('.ifBtn');
    if (tombol) {
      tombol.addEventListener('click', function () {
        if (!promptTertunda) return;
        promptTertunda.prompt();
        promptTertunda.userChoice.finally(function () {
          promptTertunda = null;
          tutupBanner(false);
        });
      });
    }
  }

  function tampilkanBanner() {
    if (!banner || sudahDitutup()) return;
    // Tunda sedikit supaya animasi muncul terlihat
    setTimeout(function () { banner.classList.add('show'); }, 600);
  }

  if (!isStandalone()) {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      promptTertunda = e;
      buatBanner(false);
      tampilkanBanner();
    });

    window.addEventListener('appinstalled', function () {
      promptTertunda = null;
      tutupBanner(false);
    });

    // iPhone/iPad tidak punya tombol pasang otomatis, beri petunjuk singkat
    var ua = window.navigator.userAgent || '';
    var iOS = /iphone|ipad|ipod/i.test(ua) ||
              (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1);
    if (iOS) {
      window.addEventListener('DOMContentLoaded', function () {
        buatBanner(true);
        tampilkanBanner();
      });
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
