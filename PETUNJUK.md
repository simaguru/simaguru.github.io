# Petunjuk: memasang frontend GitHub SIMA (versi 3)

## Yang berubah dari versi pertama
- `config.js`: MASTER_URL sekarang alamat **Super Admin** (sebelumnya memakai alamat SIMA,
  sehingga login gagal dengan UNAUTHORIZED). Ditambah SIMA_URL (alamat SIMA) untuk Lupa Password.
- Tampilan tetap gradasi awal (`style.css` versi pertama).
- Tombol "Lupa Password Admin Lembaga?" ditambahkan (membuka halaman reset milik SIMA).
- Form daftar: label NPSN, Ulangi Password, minimal 8 karakter.
- Tombol pasang aplikasi: bulat kecil bergambar HP di pojok kanan bawah, tanpa tombol tutup,
  hanya di halaman login (hilang saat halaman Lupa Password atau SIMA terbuka).
- `sw.js`: versi cache naik ke `sima-shell-v3`.

## Cara memasang
1. Di GitHub: Add file > Upload files. Seret SEMUA file di dalam folder `frontend_github`
   (bukan foldernya). `icons/` dan `manifest.json` tidak berubah, boleh dilewati.
2. Commit changes, tunggu 1-2 menit sampai GitHub Pages selesai.
3. Buka situs di Chrome, tekan Ctrl+Shift+R.
   Bila tampilan lama masih muncul: F12 > Application > Service Workers > Unregister, lalu muat ulang.
