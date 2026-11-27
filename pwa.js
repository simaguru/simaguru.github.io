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

  // 2) Tombol pasang melayang: kecil, gambar HP + tulisan "Instal Apps", di pojok kanan bawah.
  //    Hanya ada di halaman login ini, hanya di browser (tidak di aplikasi
  //    terpasang), dan tidak punya tombol tutup.
  var fab = null;
  var tip = null;
  var promptTertunda = null;

  var IKON_HP =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/>' +
      '<path d="M12 7.5v6M9.5 11.5 12 14l2.5-2.5"/>' +
      '<path d="M10.5 18.5h3"/>' +
    '</svg>';

  function buatFab(modeIos) {
    if (fab) return;
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'installFab';
    fab.setAttribute('aria-label', 'Instal Apps SIMA');
    fab.title = 'Instal Apps SIMA';
    fab.innerHTML = IKON_HP + '<span class="installLabel">Instal Apps</span>';
    document.body.appendChild(fab);

    if (modeIos) {
      // iPhone/iPad tidak punya tombol pasang otomatis: ketuk untuk petunjuk
      tip = document.createElement('div');
      tip.className = 'installTip';
      tip.textContent = 'Untuk memasang di iPhone/iPad: ketuk tombol Bagikan, lalu pilih \u201CTambah ke Layar Utama\u201D.';
      document.body.appendChild(tip);
      fab.addEventListener('click', function () { tip.classList.toggle('show'); });
      document.addEventListener('click', function (e) {
        if (tip && !tip.contains(e.target) && !fab.contains(e.target)) tip.classList.remove('show');
      });
    } else {
      fab.addEventListener('click', function () {
        if (!promptTertunda) return;
        promptTertunda.prompt();
        promptTertunda.userChoice.finally(function () {
          promptTertunda = null;
          sembunyiFab();
        });
      });
    }
  }

  function tampilkanFab() {
    if (!fab) return;
    setTimeout(function () { fab.classList.add('show'); }, 500);
  }

  function sembunyiFab() {
    if (fab) fab.classList.remove('show');
    if (tip) tip.classList.remove('show');
  }

  if (!isStandalone()) {
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      promptTertunda = e;
      buatFab(false);
      tampilkanFab();
    });

    window.addEventListener('appinstalled', function () {
      promptTertunda = null;
      sembunyiFab();
    });

    var ua = window.navigator.userAgent || '';
    var iOS = /iphone|ipad|ipod/i.test(ua) ||
              (/macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1);
    if (iOS) {
      window.addEventListener('DOMContentLoaded', function () {
        buatFab(true);
        tampilkanFab();
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
    document.body.classList.add('overlayOpen');

    var sudahTampil = false;
    var tampil = function () {
      if (sudahTampil) return;
      sudahTampil = true;
      frame.style.visibility = 'visible';
      if (kanvas) kanvas.style.display = 'none';
      // Serahkan ke layar loading di dalam SIMA (tampilannya sama).
      setTimeout(function () {
        if (typeof window.hideLoginLoading === 'function') window.hideLoginLoading();
      }, 1000);
    };
    frame.addEventListener('load', tampil);
    setTimeout(tampil, 8000); // cadangan bila event load tidak terpicu

    frame.src = url;
    document.body.appendChild(frame);
    return true;
  }

  window.SIMA_PWA = { isStandalone: isStandalone, bukaBackend: bukaBackend };
})();
