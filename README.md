# 🚀 Runway Desk — Listing Calls Auto-Submit

Bot otomatis untuk submit listing calls di **Runway Desk** (`runway.edel.finance`).  
Support multi-account, auto-claim round, dan auto-submit picks.

**Author:** OPICKABU

---

## 📋 Fitur

- ✅ **Multi-Account** — Jalankan beberapa akun sekaligus
- ✅ **Auto-Check** — Cek listing round setiap 1 menit
- ✅ **Auto-Claim** — Claim round otomatis kalau belum di-claim
- ✅ **Auto-Submit** — Submit picks secara random (assetA atau assetB)
- ✅ **Smart Sleep** — Tidur sampai window berikutnya, hemat resource
- ✅ **Session Cookie** — Pakai `edel_session` dari browser

---

## ⚙️ Requirements

- **Node.js** v16 atau lebih baru
- **Session cookie** dari Runway Desk (edel_session)
- **Platform:** Windows (PowerShell), Termux (Android), VPS (Linux)

---

## 🛠️ Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/runway-desk-bot.git
cd runway-desk-bot
```

### 2. Install Dependencies

Tidak ada dependencies external — murni Node.js standard library.

```bash
# Tidak perlu npm install
# Langsung jalan dengan node
```

### 3. Setup Accounts

Edit file `accounts.txt` dan masukkan session cookie:

```txt
# accounts.txt
# Format: edel_session=<token>
# Satu akun per baris

edel_session=eyJ2Ij...ASO8
edel_session=eyJ2Ij...mcrQ
```

---

## 🔑 Cara Mendapatkan Session Cookie

1. Buka **runway.edel.finance** di browser
2. Login dengan **passkey (WebAuthn)**
3. Buka **Developer Tools** → `F12`
4. Pilih tab **Application** → **Cookies**
5. Cari cookie `edel_session`
6. Copy value-nya

```
edel_session=eyJ2IjoiMyIsInR5cCI6IkpXVCJ9...
```

7. Paste ke `accounts.txt` dengan format:
   ```
   edel_session=eyJ2IjoiMyIsInR5cCI6IkpXVCJ9...
   ```

---

## 🚀 Cara Menjalankan

### Jalankan Manual

```bash
node run.js
```

### Jalankan di Background (Linux/Mac)

```bash
nohup node run.js > output.log 2>&1 &
```

### Jalankan dengan PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Jalankan bot
pm2 start run.js --name runway-bot

# Lihat log
pm2 logs runway-bot

# Restart
pm2 restart runway-bot

# Stop
pm2 stop runway-bot
```

---

## 📊 Output Contoh

```
  ██████╗ ██████╗ ██╗ ██████╗██╗  ██╗ █████╗ ██████╗ ██╗   ██╗
 ██╔═══██╗██╔══██╗██║██╔════╝██║ ██╔╝██╔══██╗██╔══██╗██║   ██║
 ██║   ██║██████╔╝██║██║     █████╔╝ ███████║██████╔╝██║   ██║
 ██║   ██║██╔═══╝ ██║██║     ██╔═██╗ ██╔══██║██╔══██╗██║   ██║
 ╚██████╔╝██║     ██║╚██████╗██║  ██╗██║  ██║██████╔╝╚██████╔╝
  ╚═════╝ ╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝

  Runway Desk — Listing Calls Auto-Submit
  Multi-Account Edition
  =========================================

==================================================
[2026-06-27T10:00:00.000Z] Checking all accounts...
==================================================

[INFO] 2 account(s) loaded

[ACC 1/2] Processing: eyJ2IjoiMyIsInR5cC...
[ACC 1/2] [STATUS] OPEN | [STAKE] 100 EDELx
[ACC 1/2] [TIME] Closes in: 5m 30s
[ACC 1/2] [FOUND] 3 listing calls!
[ACC 1/2] [PICKS]
[ACC 1/2]   Call 1: asset-abc123
[ACC 1/2]   Call 2: asset-def456
[ACC 1/2]   Call 3: asset-ghi789
[ACC 1/2] [SUCCESS] Submitted! ✓

[ACC 2/2] Processing: eyJ2IjoiMyIsInR5cC...
[ACC 2/2] [OK] Already submitted.

[DONE] All accounts processed. Sleeping until 2026-06-27T11:00:00.000Z (59m 0s)...
```

---

## ⚠️ Catatan Penting

### Keamanan

- **JANGAN** commit `accounts.txt` ke GitHub
- **JANGAN** share session cookie ke orang lain
- File `.gitignore` sudah dikonfigurasi untuk blokir file sensitif

### Session Cookie

- Session cookie bisa **expired** — update secara berkala
- Kalau muncul error `401` atau `403`, berarti cookie sudah tidak valid
- Login ulang di browser dan copy cookie baru

### Rate Limit

- Bot sudah delay **10 detik** antar akun
- Jangan jalankan terlalu banyak akun sekaligus
- Default check interval: **1 menit**

---

## 🔧 Konfigurasi

Edit bagian `CONFIG` di `run.js`:

```javascript
const CONFIG = {
  accountsFile: path.join(__dirname, 'accounts.txt'),
  baseUrl: 'runway.edel.finance',
  checkInterval: 60000,           // Check setiap 60 detik
  delayBetweenAccounts: 10000,    // Delay 10 detik antar akun
};
```

---

## 📁 Struktur File

```
runway-desk-bot/
├── run.js           # Script utama bot
├── accounts.txt     # Session cookie (JANGAN di-commit!)
├── .gitignore       # Blokir file sensitif
└── README.md        # Dokumentasi ini
```

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `accounts.txt not found` | Buat file `accounts.txt` dengan session cookie |
| `401 Unauthorized` | Session cookie expired — login ulang di browser |
| `FIXTURE_CYCLE_EXHAUSTED` | Tidak ada listing calls aktif — tunggu window berikutnya |
| Bot diam tidak jalan | Cek koneksi internet dan pastikan cookie valid |

---

## 📝 License

MIT — Bebas dipakai dan dimodifikasi.

---

**Made with ❤️ by OPICKABU**
