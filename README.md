# QuickPay Pojokdigi

Solusi pembayaran modern yang terintegrasi dengan API Digiflazz.

## Struktur Proyek

```
quickpay-craft-13/
├── src/               # Kode sumber frontend
├── backend/           # Kode sumber backend
│   ├── src/          # File TypeScript backend
│   └── dist/         # Kode backend yang sudah dikompilasi
├── dist/             # Kode frontend yang sudah dikompilasi
└── public/           # Aset statis
```

## Prasyarat

- Node.js 18 atau lebih tinggi
- npm 9 atau lebih tinggi

## Pengaturan Pengembangan

1. Kloning repositori:
```bash
git clone [url-repositori]
cd quickpay-craft-13
```

2. Instal dependensi:
```bash
npm install
```

3. Siapkan variabel lingkungan:
```bash
# Salin file lingkungan contoh
cp backend/.env.example backend/.env
```

4. Perbarui variabel lingkungan di `backend/.env` dengan kredensial Anda:
- `DIGIFLAZZ_USERNAME`: Nama pengguna Digiflazz Anda
- `DIGIFLAZZ_DEV_KEY`: Kunci pengembangan Digiflazz Anda
- Variabel lain sesuai kebutuhan

5. Mulai server pengembangan:

Untuk frontend:
```bash
npm run dev
```

Untuk backend:
```bash
cd backend
npm run dev
```

## Membangun untuk Produksi

1. Bangun seluruh proyek (frontend dan backend):
```bash
npm run build
```

Ini akan:
- Membangun frontend (kompilasi TypeScript dan build Vite)
- Membangun backend (kompilasi TypeScript)
- Menginstal semua dependensi yang diperlukan

2. Output build akan berada di:
- Frontend: `./dist/`
- Backend: `./backend/dist/`

## Deployment Produksi

1. Siapkan variabel lingkungan produksi:
```bash
# Di backend/.env
NODE_ENV=production
FRONTEND_URL=https://pojokdigi.com
PUBLIC_URL=https://api.pojokdigi.com
DIGIFLAZZ_USERNAME=username_produksi_anda
DIGIFLAZZ_DEV_KEY=kunci_produksi_anda
```

2. Mulai server produksi:
```bash
npm run start
```

## Titik Akhir API (Endpoints)

### API Transaksi
- `POST /api/transaction`
  - Membuat transaksi baru
  - Body: `{ product_code, customer_id, ref_id }`

### API Callback
- `POST /api/callback/digiflazz`
  - Endpoint webhook untuk callback Digiflazz
  - Menangani pembaruan status transaksi

## Fitur

- Manajemen kunci API yang aman
- Pemrosesan transaksi
- Penanganan webhook untuk callback
- Lingkungan pengembangan dan produksi
- Konfigurasi CORS
- Dukungan TypeScript

## Catatan Keamanan

- Jangan pernah commit file `.env`
- Gunakan variabel lingkungan yang sesuai untuk lingkungan yang berbeda
- Jaga keamanan kunci API
- Validasi semua tanda tangan webhook yang masuk pada produksi

## Kontribusi

1. Buat branch fitur
2. Buat perubahan Anda
3. Kirim pull request

## Lisensi

ISC
