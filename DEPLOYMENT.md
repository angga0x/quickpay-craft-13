# Panduan Deployment Produksi

Panduan ini menjelaskan cara men-deploy aplikasi QuickPay Pojokdigi ke lingkungan produksi dengan menggunakan URL berikut:

- **URL Frontend**: `https://pojokdigi.com`
- **URL Backend**: `https://api.pojokdigi.com`

## Persiapan

1. Pastikan Anda memiliki akses ke server hosting untuk kedua domain.
2. Pastikan Node.js (versi 18 atau lebih tinggi) dan npm (versi 9 atau lebih tinggi) terinstal di server produksi.

## Langkah-langkah Deployment

### 1. Persiapkan Repositori

```bash
# Clone repositori
git clone [url-repositori] pojokdigi
cd pojokdigi

# Instal dependensi
npm install
```

### 2. Konfigurasi Environment Variables

#### Backend (.env)

Buat file `backend/.env` dengan konfigurasi berikut:

```
# Server Configuration
PORT=3000
NODE_ENV=production

# Digiflazz API Configuration
DIGIFLAZZ_URL=https://api.digiflazz.com/v1
DIGIFLAZZ_USERNAME=<username_digiflazz_anda>
DIGIFLAZZ_DEV_KEY=<dev_key_digiflazz_anda>
DIGIFLAZZ_PROD_KEY=<prod_key_digiflazz_anda>

# Tokopay API Configuration
TOKOPAY_MERCHANT_ID=<merchant_id_tokopay_anda>
TOKOPAY_SECRET=<secret_tokopay_anda>
TOKOPAY_API_URL=https://api.tokopay.id/v1

# Frontend URL (for CORS)
FRONTEND_URL=https://pojokdigi.com

# Public URL (for callbacks)
PUBLIC_URL=https://api.pojokdigi.com
```

#### Frontend (.env.production)

Pastikan file `.env.production` berisi:

```
# Frontend Production Environment

# API URLs
VITE_API_URL=https://api.pojokdigi.com/api
VITE_BACKEND_URL=https://api.pojokdigi.com

# Application
VITE_APP_NAME=PojokDigi
VITE_APP_URL=https://pojokdigi.com
```

### 3. Build Aplikasi

Bangun aplikasi untuk produksi:

```bash
npm run build
```

Perintah ini akan:
- Membangun frontend (menghasilkan file di folder `dist/`)
- Membangun backend (menghasilkan file di folder `backend/dist/`)

### 4. Deployment Frontend ke pojokdigi.com

Unggah semua file dalam folder `dist/` ke document root server web Anda untuk domain `pojokdigi.com`.

Jika menggunakan Nginx, tambahkan konfigurasi berikut:

```nginx
server {
    listen 80;
    server_name pojokdigi.com www.pojokdigi.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name pojokdigi.com www.pojokdigi.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /path/to/dist;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5. Deployment Backend ke api.pojokdigi.com

1. Transfer seluruh folder proyek ke server Anda
2. Konfigurasikan Nginx sebagai reverse proxy:

```nginx
server {
    listen 80;
    server_name api.pojokdigi.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.pojokdigi.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Jalankan backend server sebagai layanan dengan PM2:

```bash
# Instal PM2 jika belum ada
npm install -g pm2

# Mulai aplikasi
cd /path/to/project
pm2 start npm --name "pojokdigi-backend" -- run start

# Pastikan aplikasi mulai otomatis pada reboot
pm2 startup
pm2 save
```

## Verifikasi Deployment

1. Buka https://pojokdigi.com di browser Anda
2. Pastikan aplikasi memuat dengan benar dan dapat melakukan transaksi
3. Verifikasi bahwa callback URL bekerja dengan menguji transaksi demo

## Pemeliharaan

Untuk memperbarui aplikasi:

```bash
# Ambil perubahan terbaru
git pull

# Instal dependensi baru
npm install

# Bangun ulang aplikasi
npm run build

# Mulai ulang backend
pm2 restart pojokdigi-backend
```

## Pemecahan Masalah

Jika terjadi masalah dengan deployment:

1. Periksa log backend: `pm2 logs pojokdigi-backend`
2. Pastikan variabel lingkungan dikonfigurasi dengan benar
3. Periksa konfigurasi CORS dan pastikan domain sudah benar

Untuk bantuan lebih lanjut, hubungi tim dukungan. 