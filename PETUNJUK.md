# Petunjuk: frontend GitHub SIMA (versi 5)

## Prinsip
Halaman GitHub hanya SATU alamat untuk semua cluster. Satu-satunya alamat di `config.js`
adalah Master Super Admin; Master menentukan cluster pemilik akun (admin, guru, semua role).
Saat cluster bertambah, halaman ini TIDAK perlu diubah.

## Yang berubah dari versi 4
- `config.js`: hanya `MASTER_URL` (tidak ada alamat SIMA).
- Login memanggil Master `webLogin`; Master memilih cluster, cluster menjalankan login SIMA,
  lalu browser dibuka ke cluster itu dengan kode sekali pakai.
- "Lupa Password Admin Lembaga?": isi kolom Username lebih dulu, lalu klik tautannya.

## Urutan memasang
1. Perbarui Master Super Admin DAN Master SIMA (paket `Update_Login_GitHub_Master_dan_SIMA`), deploy versi baru.
2. Di GitHub: Add file > Upload files, seret file di dalam folder `frontend_github`
   (berubah: `app.js`, `config.js`, `index.html`, `PETUNJUK.md`).
3. Tunggu 1-2 menit, buka situs, tekan Ctrl+Shift+R.

## Versi 6.1 — refresh tidak lagi kembali ke login (mode aplikasi terpasang)
- `app.js`: alamat SIMA disimpan (`sima_backend_url_v1`, tanpa kode handoff) setelah login;
  saat aplikasi terpasang dibuka/di-refresh, SIMA dibuka lagi otomatis. SIMA sendiri yang
  menentukan sesi masih berlaku atau perlu login (timeout per role tetap berlaku).
- `pwa.js`: `bukaBackend` punya batas waktu pemulihan (25 dtk), `tutupBackend`, dan
  menerima pesan `sima:logout` dari SIMA untuk kembali ke halaman login GitHub.
- `sw.js`: cache naik ke v5.
- Opsional di SIMA (Auth.html, di dalam `clearAuthState()` / saat logout):
  `try { window.top.postMessage({ type: 'sima:logout' }, '*'); } catch (e) {}`
  Tanpa ini pun tetap jalan: pengguna melihat halaman login SIMA di dalam aplikasi.
