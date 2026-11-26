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
