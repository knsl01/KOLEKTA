# Kolekta — UX Audit & Redesign
*Principal Product Design review · 2026-06-25*

> Backup kode sebelum perubahan apa pun: tag git **`backup-pre-redesign-20260625`**
> Undo kapan saja: `git reset --hard backup-pre-redesign-20260625`

---

## 1. Skor UX saat ini: **4 / 10**

Fungsionalitas lengkap dan ambisius (chat, voice/video, heatmap, audit log, leaderboard, dokumen somasi/MOM, storage foto). Tapi **arsitektur informasinya datar** — semua fitur diberi bobot visual yang sama, sehingga aplikasi terasa seperti *daftar fitur*, bukan *tempat kerja*. Pengguna baru tidak tahu harus mulai dari mana. Skor tinggi untuk kemampuan, rendah untuk pemandu jalan (wayfinding) & fokus.

---

## 2. Apa yang membuat user baru bingung dalam 10 detik pertama?

1. **Dua angka raksasa identik.** "Total piutang aktif Rp60 M" dan "Overdue Rp60 M" — nilainya sama persis, tidak ada kontras → user ragu apakah datanya benar atau bug.
2. **4 KPI card sederajat** (piutang, overdue, belum dihubungi, perlu ditagih ulang) menyita seluruh layar atas sebelum user melihat satu pun tugas.
3. **Top-tab (Hari/Tagihan/Analitik/Heat) + hamburger drawer berisi 12 menu** = dua sistem navigasi paralel yang tumpang tindih. "Heat" ada di tab *dan* di drawer; "Hari" ada di keduanya.
4. **CTA terbesar "Lapor pekerjaan & lapangan"** mendominasi, padahal itu tugas satu peran (collector lapangan), bukan aksi utama semua orang.
5. **"Perlu ditagih ulang: 0 ngendap/ingkar"** — istilah internal yang tidak bermakna bagi user baru, tapi diberi kartu penuh.
6. **Bahasa campur**: "Belum di-follow-up", "Ingkar janji", "Kol 5", "PRIO!", "TL", "DPD 90+" — jargon tanpa onboarding.

---

## 3. Komponen yang bisa DIHAPUS (dari layar utama)

| Komponen | Alasan |
|---|---|
| Kartu **"Perlu ditagih ulang / ngendap-ingkar"** bernilai 0 | Empty-state tidak layak jadi 1 dari 4 kartu utama. Jadikan baris kecil/filter. |
| **Top-tab bar** (Hari/Tagihan/Analitik/Heat) | Diganti total oleh bottom-nav. Hapus, jangan biarkan dua nav. |
| **Hamburger drawer 12-item** | Dibubarkan ke 5 tab + More. Drawer dihapus. |
| **Tombol "Riwayat" jam di header** | Pindah ke Reports/More. |
| Duplikasi KPI angka identik | Tampilkan satu angka utama + delta, bukan dua kembar. |

*Tidak ada fungsi yang dihapus — hanya elemen UI redundan di layar utama.*

## 4. Komponen yang harus DIPINDAH

| Dari | Ke |
|---|---|
| Lapor / Riwayat kerja (top CTA + drawer) | **FAB → "Buat laporan"** + tab Reports |
| Analitik (top-tab) | **Reports → Analytics** |
| Heat Map (top-tab + drawer) | **Reports → Heat** (Geografis/Kalender/Matriks) |
| Audit Log (drawer) | **More → Audit Log** |
| Pengaturan, Pelanggan, Kalkulator (drawer) | **More** |
| Chat (drawer, terkubur) | **Bottom-nav tab #3** (sejajar, tidak bisa hilang) |
| Backup/Restore (Settings dalam) | **More → Backup & Restore** (dinaikkan, ini pengaman penting) |

## 5. Komponen yang harus DIGABUNG

- **Hari Ini + 4 KPI + Follow-up panel** → satu **Dashboard** terurut prioritas.
- **Tagihan + Riwayat** → **Cases** (riwayat = filter/tab di dalam case).
- **Analitik + Heat Map + Leaderboard** → **Reports** (semua hal "lihat & analisa").
- **Lapor + Riwayat kerja + Laporan harian + Laporan kunjungan** → **Reports** (read) & **FAB** (create).
- **Personal + Group + Voice/Video** → **Chat** (segmented control).

## 6. Informasi yang terlalu memenuhi layar

- Dua KPI raksasa identik di atas lipatan (above the fold).
- CTA "Lapor" full-width navy → magnet mata yang salah sasaran.
- Tab + drawer = beban navigasi ganda.
- Badge bertumpuk di kartu invoice ("Kol 5 · PRIO! · TL · 📷") tanpa hierarki.

## 7. Informasi yang seharusnya muncul PALING ATAS

1. **Tugas hari ini** (yang harus dikerjakan SEKARANG) — saat ini ada di tengah-bawah.
2. **Overdue prioritas tinggi** dengan nominal + umur tunggakan.
3. **Follow-up belum dikerjakan** (angka 6) — sinyal kerja paling actionable.
4. **Quick actions** untuk 1-tap memulai tugas.

KPI ringkasan (Rp60 M dll.) tetap ada, tapi sebagai *strip ringkas*, bukan pahlawan layar.

## 8. Apakah struktur menu saat ini benar?

**Tidak.** Masalah utama: **dua sistem navigasi** (top-tab + drawer) yang isinya tumpang-tindih, dan **tidak ada hierarki** (12 item drawer sederajat). Fitur sehari-hari (Chat, Follow-up) terkubur sedalam fitur jarang-pakai (Kalkulator, Audit). Solusi: **satu** bottom-nav 5-tab + FAB + halaman More untuk ekor panjang.

---

## Sitemap baru

```
KOLEKTA
├── 1. DASHBOARD (command center)
│   ├── Strip KPI (Piutang · Overdue · DSO · Tertagih)
│   ├── Tugas Hari Ini
│   ├── Overdue Prioritas Tinggi
│   ├── Follow-up Belum Dikerjakan
│   ├── Aktivitas Terbaru (feed tim)
│   └── Quick Actions
├── 2. CASES
│   ├── Semua · Overdue · Follow-up · Janji Bayar · Kunjungan  (segmented)
│   ├── Cari + Filter + Aksi massal + Import/Export
│   └── Detail kasus → status, janji bayar/PTP, jaminan,
│        eskalasi (somasi), dokumen (MOM/Berita Acara), foto, riwayat
├── 3. CHAT
│   ├── Personal · Grup  (segmented)
│   └── Voice / Video call (Jitsi)
├── 4. REPORTS
│   ├── Analytics (DSO, PTP, tagihan vs tertagih, Leaderboard)
│   ├── Laporan Harian
│   ├── Laporan Kunjungan
│   ├── Collection Report (export)
│   └── Heat Map (Geografis · Kalender · Matriks)
├── 5. MORE
│   ├── Pelanggan (master debitur)
│   ├── Audit Log (atasan)
│   ├── Riwayat & Riwayat kerja
│   ├── Kalkulator
│   ├── Integrasi (WhatsApp/Email/Akuntansi/API) — slot masa depan
│   ├── Backup & Restore
│   └── Pengaturan (tema, peran, target, logout)
└── FAB (+)
    ├── Tambah Debitur
    ├── Buat Laporan
    ├── Buat Reminder
    └── Upload Dokumen
```

## User Flow baru (3 skenario inti)

```
A. Collector mulai kerja (target: 30 detik paham)
   Buka app → Dashboard → "Tugas Hari Ini" (paling atas)
   → tap kasus → tap "Follow-up" → catat hasil → selesai.   [2 tap ke aksi]

B. Lapor kunjungan lapangan
   FAB (+) → "Buat Laporan" → pilih debitur → isi + foto + GPS
   → simpan → muncul di Reports & Aktivitas Terbaru.

C. Supervisor cek performa
   Bottom-nav → Reports → Analytics → Leaderboard
   → tap petugas → lihat kasusnya.   [2 tap]
```

## Daftar fitur: PINDAH / GABUNG / HAPUS

**HAPUS (UI saja, fungsi tetap):** top-tab bar, hamburger drawer, kartu "ngendap/ingkar = 0", KPI kembar, tombol jam-riwayat di header.

**GABUNG:** Hari+KPI+Follow-up → Dashboard · Tagihan+Riwayat → Cases · Analitik+Heat+Leaderboard → Reports · Personal+Grup+Call → Chat.

**PINDAH:** Lapor → FAB+Reports · Audit/Pelanggan/Kalkulator/Backup/Settings → More · Chat → bottom-nav.

**FITUR YANG TIDAK DISEBUT DI PROMPT — tetap diberi rumah (tidak ada yang hilang):**
- Leaderboard petugas → **Reports › Analytics**
- DSO & PTP metrics → **Reports › Analytics**
- Eskalasi / Somasi → **Cases › detail kasus**
- Dokumen MOM / Berita Acara Kunjungan → **Cases › detail** & **FAB › Upload/Buat dokumen**
- Jaminan (tanah/sertifikat) → **Cases › detail**
- Aksi massal + Import/Export Excel → **Cases (toolbar)** & **Reports › Collection Report**
- Foto lapangan (Supabase Storage) → **Cases › detail** & **FAB › Upload Dokumen**
- Heat Map (Geografis/Kalender/Matriks) → **Reports › Heat**
- Riwayat kerja petugas → **Reports** (atasan) / **More › Riwayat kerja**
- Audit Log → **More** (atasan)
- Backup/Restore data → **More › Backup & Restore**
- Kalkulator → **More**
- Admin panel (tenant/member/files) → **More › Pengaturan** (atasan)
- Multi-peran (collector/credit control/supervisor/legal) → konten Dashboard & izin per peran
- **Integrasi** (baru, slot ekspansi) → **More › Integrasi**

## Prinsip modular (siap berkembang)
Setiap fitur baru masuk sebagai **kartu di Dashboard** (jika harian/actionable), **segment di Cases/Reports** (jika data), atau **baris di More** (jika alat/admin). Lima tab tidak pernah bertambah — pertumbuhan diserap oleh kartu, segment, dan More. Itu yang menjaga "paham dalam 30 detik" tetap berlaku saat produk membesar.
```
