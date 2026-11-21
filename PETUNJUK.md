# Petunjuk: memasang PWA SIMA di GitHub

## Yang berubah
File baru: `manifest.json`, `sw.js`, `pwa.js`, `pwa.css`, folder `icons/` (4 ikon).
File lama yang diubah sedikit:
- `index.html`: tambahan tag PWA di kepala, ukuran dan warna logo, 1 baris `<script src="pwa.js">`.
- `app.js`: 1 perubahan, yaitu pindah halaman setelah login (lihat bagian bawah).
- `style.css`: warna biru diganti hijau, logo gaya baru.
- `config.js`: alamat Master (MASTER_URL) sudah diganti ke alamat terbaru dari Anda.

## Cara memasang
1. Buka repo GitHub tempat `frontend_github` dipakai.
2. Upload SEMUA file dan folder `icons/` dari paket ini, timpa yang lama.
3. Tunggu 1-2 menit sampai GitHub Pages selesai.
4. Buka alamat situs di Chrome, tekan Ctrl+Shift+R (muat ulang penuh).
5. Pasang: klik tombol "Pasang aplikasi SIMA" atau ikon pasang di address bar.

## Cara kerja setelah login
- Browser biasa: sama seperti dulu (pindah ke backend SIMA).
- Aplikasi terpasang: backend dimuat di dalam jendela aplikasi (layar penuh).

## Kalau mau ganti ikon atau warna
Ganti file di folder `icons/` dengan nama yang sama, lalu naikkan angka
`sima-shell-v1` di `sw.js` menjadi `v2`.
