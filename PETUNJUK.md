# Petunjuk: memasang frontend GitHub SIMA (versi 2)

## Yang berubah
- `config.js`: MASTER_URL sekarang alamat **Super Admin** (sebelumnya salah memakai alamat SIMA,
  sehingga login gagal dengan UNAUTHORIZED). Ditambah SIMA_URL (alamat SIMA) untuk Lupa Password.
- Tampilan login disamakan dengan halaman SIMA di Chrome (kepala hijau, tombol "Masuk ke Sistem").
- Tombol "Lupa Password Admin Lembaga?" ditambahkan (membuka halaman reset milik SIMA).
- Form daftar disamakan dengan SIMA (NPSN, Ulangi Password, minimal 8 karakter).
- Tombol "Pasang aplikasi SIMA" menjadi banner melayang di bawah layar, bisa ditutup (X).
- `sw.js`: versi cache naik ke `sima-shell-v2`.

## Cara memasang
1. Buka repo GitHub tempat `frontend_github` dipakai.
2. Upload SEMUA file dan folder `icons/` dari paket ini, timpa yang lama.
3. Tunggu 1-2 menit sampai GitHub Pages selesai.
4. Buka alamat situs di Chrome, tekan Ctrl+Shift+R (muat ulang penuh).
   Kalau tampilan lama masih muncul: F12 > Application > Service Workers > Unregister, lalu muat ulang.

## Catatan
- Login dari halaman ini hanya untuk akun admin lembaga (yang ada di TenantRegistry Master).
- Banner pasang hanya muncul di browser yang mendukung pasang (Chrome/Edge), dan tidak
  muncul bila aplikasi sudah terpasang.
