// =========================================================
// app.js — Frontend GitHub (satu-satunya frontend publik)
// =========================================================
// Frontend TIDAK menyimpan password/secret/credential DI SERVER.
// "Ingat saya" hanya menyimpan data secara LOKAL di browser
// pengguna (localStorage), tidak pernah dikirim ke tempat lain
// selain proses login normal ke Apps Script Master.
// Frontend TIDAK menentukan tenant/database secara bebas —
// seluruhnya diputuskan oleh Apps Script Master di server.
// =========================================================

var REMEMBER_KEY = 'sima_remember_v1';
// Alamat SIMA (cluster) terakhir yang berhasil dibuka, TANPA kode handoff.
// Dipakai untuk memulihkan SIMA saat aplikasi terpasang di-refresh. Bukan
// sesi/password: sesi tetap disimpan & divalidasi oleh SIMA sendiri (sesuai
// timeout per role dari Superadmin).
var BACKEND_KEY = 'sima_backend_url_v1';

function simpanBackend(url) {
  try { localStorage.setItem(BACKEND_KEY, url); } catch (e) {}
}
function lupakanBackend() {
  try { localStorage.removeItem(BACKEND_KEY); } catch (e) {}
}
function bacaBackend() {
  try {
    var u = localStorage.getItem(BACKEND_KEY) || '';
    return /^https:\/\/script\.google\.com\//.test(u) ? u : '';
  } catch (e) { return ''; }
}

// Aplikasi terpasang di-refresh / dibuka ulang: langsung masuk lagi ke SIMA
// (SIMA yang memutuskan sesi masih berlaku atau perlu login, sesuai timeout role).
function pulihkanSesi() {
  if (!(window.SIMA_PWA && window.SIMA_PWA.isStandalone())) return;
  var url = bacaBackend();
  if (!url) return;
  showLoginLoading();
  var ok = window.SIMA_PWA.bukaBackend(url, {
    batasMs: 25000,
    onGagal: function () { lupakanBackend(); }
  });
  if (!ok) hideLoginLoading();
}
document.addEventListener('DOMContentLoaded', pulihkanSesi);

function toggleForm(target) {
  var isLogin = target === 'login';
  document.getElementById('formLogin').classList.toggle('hidden', !isLogin);
  document.getElementById('formRegister').classList.toggle('hidden', isLogin);
  document.getElementById('formTitle').textContent = isLogin ? 'Halaman Login SIMA' : 'Daftar Lembaga';
  document.getElementById('formSub').textContent = '';
  setMsg('loginMsg', '');
  setMsg('registerMsg', '');
}

function togglePassword() {
  var input = document.getElementById('loginPassword');
  var isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
}

function setMsg(id, text, kind) {
  var el = document.getElementById(id);
  el.textContent = text || '';
  el.className = 'msg' + (kind ? (' ' + kind) : '');
}

function configUrl(key) {
  var url = (window.SIMA_CONFIG || {})[key];
  if (!url || url.indexOf('PASTE_URL') !== -1) {
    throw new Error(key + ' belum dikonfigurasi di config.js');
  }
  return url;
}

function masterUrl() { return configUrl('MASTER_URL'); }

async function callMaster(action, payload) {
  var res = await fetch(masterUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // hindari CORS preflight pada Apps Script
    body: JSON.stringify(Object.assign({ action: action }, payload))
  });
  return res.json();
}

// --- "Ingat saya": simpan/kembalikan username & password secara LOKAL saja ---
function loadRemembered() {
  try {
    var raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return;
    var data = JSON.parse(atob(raw));
    if (data && data.u) {
      document.getElementById('loginUsername').value = data.u;
      document.getElementById('loginPassword').value = data.p ? atob(data.p) : '';
      document.getElementById('rememberMe').checked = true;
    }
  } catch (e) {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

function saveRemembered(username, password, remember) {
  if (!remember) {
    localStorage.removeItem(REMEMBER_KEY);
    return;
  }
  var data = { u: username, p: btoa(password) };
  localStorage.setItem(REMEMBER_KEY, btoa(JSON.stringify(data)));
}

document.addEventListener('DOMContentLoaded', loadRemembered);

// --- Pemanasan Master (kurangi cold start Apps Script saat login) ---
// Apps Script yang lama tidak dipakai butuh beberapa detik untuk "bangun".
// Satu panggilan ringan saat halaman dibuka / kolom password disentuh membuat
// instance Master sudah hangat ketika tombol Masuk ditekan. Hasilnya diabaikan
// (action 'ping' boleh dijawab UNKNOWN_ACTION; yang penting instance berjalan).
var _warmAt = 0;
function warmMaster() {
  var now = Date.now();
  if (now - _warmAt < 60000) return; // maksimal sekali per menit
  _warmAt = now;
  try {
    fetch(masterUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'ping' }),
      keepalive: true
    }).catch(function () {});
  } catch (e) { /* config belum diisi: abaikan */ }
}
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(warmMaster, 300);
  var pw = document.getElementById('loginPassword');
  var us = document.getElementById('loginUsername');
  if (pw) pw.addEventListener('focus', warmMaster);
  if (us) us.addEventListener('focus', warmMaster);
});

// --- Loading layar penuh saat login (sama dengan layar di dalam SIMA) ---
var LOGIN_LOADING_TEXT = 'Memuat Sistem Manajemen Administrasi...';

function showLoginLoading() {
  if (document.getElementById('loginLoading')) return;
  var el = document.createElement('div');
  el.id = 'loginLoading';
  el.className = 'loginLoading';
  el.innerHTML = '<div class="loginLoadingInner"><div class="loginLoadingSpinner"></div>' +
    '<p class="loginLoadingText"></p></div>';
  el.querySelector('.loginLoadingText').textContent = LOGIN_LOADING_TEXT;
  document.body.appendChild(el);
}

function hideLoginLoading() {
  var el = document.getElementById('loginLoading');
  if (el) el.remove();
}

async function doLogin(e) {
  e.preventDefault();
  var btn = document.getElementById('loginBtn');
  setMsg('loginMsg', '');
  btn.disabled = true; btn.textContent = 'Memeriksa...';

  var username = document.getElementById('loginUsername').value.trim();
  var password = document.getElementById('loginPassword').value;
  var remember = document.getElementById('rememberMe').checked;
  var berhasil = false;
  showLoginLoading();

  try {
    // Satu alamat untuk semua cluster: Master menentukan cluster pemilik akun
    // (admin lembaga, guru, petugas, dst.), lalu cluster itu menjalankan login
    // yang sama seperti halaman login SIMA di Chrome.
    var res = await callMaster('webLogin', {
      username: username,
      password: password,
      device: (navigator.userAgent || '').slice(0, 120)
    });
    if (res.ok && res.handoff && res.backendUrl) {
      berhasil = true; // loading tetap tampil sampai SIMA terbuka
      saveRemembered(username, password, remember);
      setMsg('loginMsg', 'Berhasil, membuka SIMA...', 'ok');
      var base = res.backendUrl;
      simpanBackend(base); // untuk pemulihan sesi saat refresh (mode terpasang)
      // Kode sekali pakai (berlaku 90 detik), BUKAN sesi/password.
      var target = base + (base.indexOf('?') === -1 ? '?' : '&') +
        'h=' + encodeURIComponent(res.handoff);
      // Aplikasi terpasang: SIMA dimuat di iframe (lihat pwa.js).
      // Browser biasa: pindah halaman.
      if (!(window.SIMA_PWA && window.SIMA_PWA.bukaBackend(target))) {
        window.location.href = target;
      }
    } else {
      setMsg('loginMsg', humanizeError(res.message), 'err');
    }
  } catch (err) {
    setMsg('loginMsg', 'Tidak dapat menghubungi server: ' + err.message, 'err');
  } finally {
    if (!berhasil) hideLoginLoading();
    btn.disabled = false; btn.textContent = 'Masuk';
  }
  return false;
}

async function doRegister(e) {
  e.preventDefault();
  var btn = document.getElementById('registerBtn');
  setMsg('registerMsg', '');
  btn.disabled = true; btn.textContent = 'Mengirim...';

  var namaLembaga = document.getElementById('regNama').value.trim();
  var nsm = document.getElementById('regNsm').value.trim();
  var email = document.getElementById('regEmail').value.trim();
  var noHP = document.getElementById('regHp').value.trim();
  var username = document.getElementById('regUsername').value.trim();
  var password = document.getElementById('regPassword').value;
  var password2 = document.getElementById('regPassword2').value;

  if (password.length < 8) {
    setMsg('registerMsg', 'Password minimal 8 karakter.', 'err');
    btn.disabled = false; btn.textContent = 'Daftar';
    return false;
  }
  if (password !== password2) {
    setMsg('registerMsg', 'Ulangi Password tidak sama dengan Password.', 'err');
    btn.disabled = false; btn.textContent = 'Daftar';
    return false;
  }

  try {
    var res = await callMaster('tenantRegister', {
      namaLembaga: namaLembaga,
      nsm: nsm,
      email: email,
      noHP: noHP,
      username: username,
      password: password
    });
    if (res.ok) {
      document.getElementById('formRegister').reset();
      toggleForm('login');
      setMsg('loginMsg', 'Pendaftaran terkirim (' + res.tenantId + '). Email konfirmasi telah dikirim ke ' + email + '. Menunggu persetujuan Admin Pusat.', 'ok');
    } else {
      setMsg('registerMsg', humanizeError(res.message), 'err');
    }
  } catch (err) {
    setMsg('registerMsg', 'Tidak dapat menghubungi server: ' + err.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Daftar';
  }
  return false;
}

// --- Lupa Password Admin Lembaga ---
// Halaman reset milik SIMA (kirim tautan reset ke email lembaga). Master
// menentukan cluster admin lembaga dari username, lalu halamannya dibuka di
// lapisan layar penuh dengan tombol Kembali, supaya tidak keluar dari aplikasi.
async function openForgot() {
  var username = document.getElementById('loginUsername').value.trim();
  if (!username) {
    setMsg('loginMsg', 'Isi kolom Username dengan username admin lembaga, lalu klik \u201CLupa Password\u201D lagi.', 'err');
    return;
  }
  setMsg('loginMsg', 'Membuka halaman reset password...', 'ok');
  var res;
  try {
    res = await callMaster('forgotTarget', { username: username });
  } catch (err) {
    setMsg('loginMsg', 'Tidak dapat menghubungi server: ' + err.message, 'err');
    return;
  }
  if (!res.ok || !res.url) {
    setMsg('loginMsg', humanizeError(res.message), 'err');
    return;
  }
  setMsg('loginMsg', '');
  showForgotOverlay(res.url);
}

function showForgotOverlay(url) {
  var overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'forgotOverlay';

  var bar = document.createElement('div');
  bar.className = 'overlayBar';

  var back = document.createElement('button');
  back.type = 'button';
  back.textContent = '\u2190 Kembali ke login';
  back.addEventListener('click', closeForgot);

  var ext = document.createElement('a');
  ext.href = url; ext.target = '_blank'; ext.rel = 'noopener';
  ext.textContent = 'Buka di tab baru';

  bar.appendChild(back); bar.appendChild(ext);

  var frame = document.createElement('iframe');
  frame.title = 'Lupa Password';
  frame.src = url;

  overlay.appendChild(bar); overlay.appendChild(frame);
  document.body.appendChild(overlay);
  document.body.classList.add('overlayOpen');
}

function closeForgot() {
  var el = document.getElementById('forgotOverlay');
  if (el) el.remove();
  document.body.classList.remove('overlayOpen');
}

function humanizeError(code) {
  var map = {
    TENANT_NOT_FOUND: 'Username tidak ditemukan',
    PASSWORD_SALAH: 'Password salah',
    TENANT_NOT_ACTIVE: 'Akun belum aktif / masih menunggu persetujuan Superadmin',
    CLUSTER_NOT_FOUND: 'Cluster tenant tidak ditemukan, hubungi Superadmin',
    CLUSTER_NOT_AVAILABLE: 'Server sedang tidak tersedia, coba lagi nanti',
    UNAUTHORIZED: 'Ditolak server (UNAUTHORIZED). Periksa MASTER_URL di config.js: harus alamat Super Admin.',
    UNKNOWN_ACTION: 'Master Super Admin belum diperbarui untuk login ini (deploy ulang versi terbaru).'
  };
  return map[code] || code || 'Terjadi kesalahan';
}
