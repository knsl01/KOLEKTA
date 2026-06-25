# KOLEKTA — Enterprise Architecture Review
*Ditinjau sebagai CPO + Enterprise Software Architect · 2026-06-25*
*Fokus: keberlangsungan produk 5–10 tahun. Bukan review UI.*

---

## RINGKASAN EKSEKUTIF

Redesign V2 (5-tab + FAB) **benar untuk hari ini, salah untuk visi**.
Ia menyelesaikan masalah *navigasi*, tapi tidak menyelesaikan masalah *arsitektur produk*.

Visi Kolekta bukan "aplikasi collection yang lebih rapi" — melainkan **platform**.
Platform tidak dirancang dengan *menu*. Platform dirancang dengan tiga hal:

```
  1. OBJEK INTI   (apa pusat data — di Kolekta: CASE / Account)
  2. SCOPE        (konteks: Org > Company > Branch > Team > Me)
  3. MODUL        (kapabilitas yang bisa dipasang/dilepas tanpa merombak nav)
```

V2 tidak punya ketiganya secara eksplisit. Itu utang arsitektur yang murah
ditanam sekarang, sangat mahal di-retrofit nanti.

---

## 1. AUDIT ULANG REDESIGN V2

Yang BENAR di V2 dan harus dipertahankan:
- Bottom-nav ≤5 + FAB → batasan sehat, memaksa disiplin.
- Pemisahan *baca* (tab) vs *buat* (FAB) → mental model konsisten.
- "More" sebagai peredam ekor-panjang → ide bagus, tapi implementasinya salah (lihat bawah).
- Object "Case" sudah muncul implisit di tab Cases → fondasi benar, belum dieksplisitkan.

Yang RAPUH untuk jangka panjang:
- **"More" = laci sampah.** Sudah 7 item di 2x sudah sesak, di 5x tak terpakai.
- **"Reports" mencampur dua dunia**: laporan operasional (harian/kunjungan) vs BI/analitik eksekutif. Keduanya akan bercabang jauh.
- **Tidak ada SCOPE SWITCHER.** Tenant terkunci saat login. Multi-company & multi-branch mustahil ditempel belakangan tanpa membongkar header & seluruh query.
- **AI tidak punya rumah.** Kalau jadi tab, salah. AI harus jadi *lapisan*, bukan *tujuan*.
- **Navigasi feature-centric, bukan role/object-centric.** Collector, Credit Control, Supervisor, Legal dipaksa lewat 5 pintu yang sama.

---

## 2. BOTTLENECK SAAT FITUR BERTAMBAH

```
SAAT 2x  (≈ 12–18 bulan)
  ► "More" overflow: Pelanggan, Audit, Riwayat kerja, Kalkulator, Integrasi,
    Backup, Pengaturan + (Approval, Dokumen) → 9+ baris tanpa hierarki.
  ► FAB tembus 5 aksi → menu radial pecah (batas ergonomis FAB ~4–5).
  ► Reports mulai berkelahi: CFO mau cockpit, collector mau laporan harian.

SAAT 5x  (≈ 2–4 tahun)
  ► Bottom-nav tak bisa merepresentasikan modul per-peran (Legal ≠ Field ≠ Exec).
  ► Tidak ada pencarian lintas-modul (cari "PT Tata Mulia" harus tahu dia di mana).
  ► Notifikasi terfragmentasi: chat, approval, SLA, AI → tak ada satu Inbox.
  ► Tanpa scope switcher, multi-company memaksa user logout-login antar entitas.
  ► "More" mati total sebagai pola.

SAAT 10x  (≈ 5+ tahun)
  ► Navigasi datar runtuh secara fundamental.
  ► Wajib: app-shell + module registry, object graph, RBAC/policy engine,
    automation studio, API platform, audit berskala jutaan event.
  ► Jika belum ada OBJEK INTI + SCOPE + MODUL sejak awal → rewrite, bukan refactor.
```

**Bottleneck tunggal terbesar: tidak adanya SCOPE (Org/Company/Branch).**
Semua hal lain bisa ditambal. Ini tidak — ia menyentuh data model, auth, query, audit, dan setiap layar sekaligus.

---

## 3. MENU YANG AKAN PENUH

| Menu | Nasib | Sebab |
|---|---|---|
| **More** | Overflow paling cepat | Tempat default segala fitur baru → jadi laci sampah |
| **Reports** | Pecah jadi 2 | Ops reporting vs Executive BI divergen total |
| **FAB** | Mentok 5 aksi | Tambah debitur, laporan, reminder, dokumen, lalu? |
| **Cases** | Aman bila jadi OBJEK INTI | Tapi rapuh bila tetap sekadar "daftar tagihan" |
| **Chat** | Berkembang jadi Inbox | Akan menyerap approval, mention, AI, sistem |

---

## 4. FITUR PENTING YANG BELUM PUNYA TEMPAT

Fitur ini tidak ada di V2 dan tidak akan muat tanpa perubahan struktural:

```
► Scope / Context Switcher  (Org > Company > Branch)      — paling kritis
► Global Search lintas-objek (Cmd-K / cari universal)
► Unified Inbox             (approval + mention + SLA + sistem)
► AI Copilot Layer          (invokable dari mana saja, bukan tab)
► Approval / Workflow Engine (status, delegasi, eskalasi)
► Automation Studio         (rule builder: "jika DPD>90 → somasi otomatis")
► Document Management Repo   (sentral, bukan nempel per-case saja)
► RBAC / Permission Console  (peran, kebijakan, scope akses)
► Admin Console terpisah     (tenant/member/billing ≠ "More" user)
► CRM Timeline               (relasi debitur, bukan cuma master data)
► Asset Recovery Pipeline    (jaminan → sita → lelang → realisasi)
► Live GPS / Route           (bukan cuma titik kunjungan statis)
► Telephony / Dialer + log   (panggilan keluar tercatat ke case)
► Payment / Settlement        (gateway, rekonsiliasi, dispute)
► Executive Cockpit          (persona surface CFO/Direksi)
► Notification Center         (preferensi, channel, digest)
► API / Integration Hub       (ERP, akuntansi, webhook)
► SLA / Queue Management      (antrian kerja, beban, target)
► Audit & Compliance at scale (retensi, ekspor regulator)
```

---

## 5. EVALUASI KESIAPAN V2 TERHADAP VISI

```
LEGEND:  [SIAP]  [SEBAGIAN]  [KOSONG]
```

| Kapabilitas | Status V2 | Kenapa |
|---|---|---|
| AI Assistant | KOSONG | Tak ada lapisan invokasi; kalau jadi tab → salah arsitektur |
| Legal Workspace | SEBAGIAN | Hidup di dalam Case detail; tak ada antrian/workspace legal |
| Approval Workflow | KOSONG | Tak ada konsep inbox/approval sama sekali |
| Asset Recovery | SEBAGIAN | Field "jaminan" ada; pipeline sita→lelang→realisasi tidak |
| GPS Tracking | SEBAGIAN | Titik kunjungan tercatat; live route/geofence tidak |
| CRM | KOSONG | "Pelanggan" hanya master data; tak ada timeline relasi |
| ERP Integration | KOSONG | "Integrasi" cuma placeholder di More |
| Multi Company | KOSONG | Tenant terkunci di login; tak ada scope switcher |
| Multi Branch | KOSONG | Tak ada hierarki organisasi |
| Executive Analytics | SEBAGIAN | Analitik ada tapi tercampur ops report; tak ada cockpit |

Skor kesiapan enterprise V2: **2.5 / 10.**
(Bagus sebagai produk, belum sebagai platform.)

---

## A. SITEMAP V2 — CURRENT REDESIGN

```
[ Bottom Nav ]  Dashboard · Cases · Chat · Reports · More      + FAB
```
Datar, feature-centric, single-tenant, single-persona.

+ Kelebihan: cepat dipahami, 2-tap ke aksi, beban kognitif rendah, cepat dibangun.
− Kekurangan: tak ada scope/AI/approval; "More" & "Reports" cepat penuh; tak role-aware.
► Risiko: terasa "selesai" lalu founder menumpuk fitur ke More → busuk perlahan; retrofit multi-company = rewrite.
◆ Kompleksitas implementasi: RENDAH (1–2 sprint). Ini titik kita sekarang.

---

## B. SITEMAP V3 — ENTERPRISE READY

Tiga primitif baru ditanam: **SCOPE**, **OBJEK INTI (Case)**, **AI Layer + Module Registry**.

```
┌───────────────────────────────────────────────────────────────┐
│ TOP BAR  [Org ▸ Company ▸ Branch ▾]    [⌕ Search]   [AI ⌘K]    │  ← scope + AI = global
├───────────────────────────────────────────────────────────────┤
│ HOME (role-adaptive)                                            │
│   ▸ Konten berubah per peran: Collector / Credit / Spv / Legal │
│   ▸ Tugas hari ini · KPI peran · Aktivitas · Quick actions     │
├───────────────────────────────────────────────────────────────┤
│ WORK  (hub modul operasional — Case sbg objek inti)            │
│   ├ Cases / Accounts        (daftar + detail 360°)             │
│   ├ Follow-up & Queue       (SLA, antrian kerja)               │
│   ├ Field & GPS             (kunjungan, route, foto)           │
│   ├ Legal & Eskalasi        (somasi, MOM, perkara)            │
│   ├ Asset Recovery          (jaminan → sita → lelang)         │
│   └ Approvals               (yang menunggu keputusan saya)     │
├───────────────────────────────────────────────────────────────┤
│ INBOX  (terpadu)                                                │
│   ├ Chat (personal/grup) + Call                                │
│   ├ Approvals & Mentions                                       │
│   └ Notifikasi sistem & SLA                                    │
├───────────────────────────────────────────────────────────────┤
│ INSIGHTS                                                        │
│   ├ Operational Reports (harian, kunjungan, collection)       │
│   ├ Analytics (DSO, PTP, leaderboard, heatmap)                │
│   └ Executive Cockpit (ringkasan untuk pimpinan)              │
├───────────────────────────────────────────────────────────────┤
│ ADMIN CONSOLE  (terpisah dari user biasa)                      │
│   ├ Pelanggan / CRM master                                     │
│   ├ Users, Roles & Permissions (RBAC)                         │
│   ├ Integrasi / API / ERP                                     │
│   ├ Audit Log & Compliance                                    │
│   ├ Backup / Restore                                          │
│   └ Pengaturan (org, branch, tema, kalkulator)               │
└───────────────────────────────────────────────────────────────┘
Bottom nav user akhir tetap 5:  Home · Work · Inbox · Insights · More(→Admin)
FAB kontekstual (aksi berubah mengikuti modul aktif).
```

+ Kelebihan: scope multi-company/branch sejak hari-1; AI & search global; "More" tak lagi laci sampah karena Admin Console dipisah; role-adaptive; Case 360 jadi tulang punggung; modul bisa tambah tanpa nambah tab.
− Kekurangan: lebih banyak konsep untuk dipelajari; butuh data model & RBAC matang; Home role-adaptive perlu logika peran.
► Risiko: over-engineering bila pasar masih kecil; butuh disiplin agar "Work" tak ikut jadi laci.
◆ Kompleksitas: SEDANG–TINGGI (data model + scope + RBAC adalah pekerjaan nyata, bukan UI). 1–2 kuartal untuk fondasi.

---

## C. SITEMAP V4 — 5-YEAR VISION (Platform)

App-shell + object graph + automation + AI agents + marketplace.

```
GLOBAL LAYER (selalu ada)
  [Org Switcher]  [Universal Search]  [AI Copilot ⌘K]  [Inbox]  [Profile/Scope]

OBJECT GRAPH (pusat data — semua modul menempel di sini)
  Account ─┬─ Cases ─┬─ Activities / Comms / Calls
           │         ├─ Documents (DMS)
           │         ├─ Legal Matters
           │         ├─ Field Visits / GPS
           │         ├─ Approvals / Workflow runs
           │         ├─ Payments / Settlements
           │         └─ AI summaries / next-best-action
           └─ Relationships (CRM timeline)

MODULE SHELL (dipasang per-tenant; tiap modul = "app")
  ├ Collection        ├ Credit Control     ├ Legal Operations
  ├ Field Collection  ├ Asset Recovery     ├ CRM
  ├ Document Mgmt     ├ Automation Studio  ├ Executive Analytics
  ├ Integrations/ERP  ├ AI Agents          └ Marketplace (modul pihak-3)

PLATFORM SERVICES (lintas modul)
  ▸ Identity & RBAC / Policy Engine        ▸ Workflow & Approval Engine
  ▸ Notification & Inbox bus               ▸ Audit/Compliance & retensi
  ▸ Open API / Webhooks / ERP connectors   ▸ AI orchestration (copilot+agents)
  ▸ Multi-tenant: Org > Company > Branch > Team > User
  ▸ Data warehouse / BI untuk Executive Cockpit

PERSONA SURFACES (entry berbeda, platform sama)
  ▸ Collector App (mobile, field-first)    ▸ Legal Workspace (desktop)
  ▸ Credit/Supervisor Console              ▸ Executive Cockpit (read-mostly)
  ▸ Admin / Platform Console
```

+ Kelebihan: pertumbuhan fitur = pasang modul, bukan rombak nav; AI sebagai orkestrator lintas-objek; siap multi-tenant penuh, ERP, marketplace, automation; tiap persona dapat surface optimalnya.
− Kekurangan: kompleksitas organisasi & engineering besar; butuh tim platform; berlebihan jika dipaksakan dini.
► Risiko: "second-system syndrome" — membangun platform sebelum punya pengguna; biaya & waktu membengkak; bisa kehilangan kesederhanaan yang justru jadi kekuatan awal.
◆ Kompleksitas: TINGGI (multi-tahun, multi-tim). Ini *north star*, bukan backlog kuartal ini.

---

## REKOMENDASI AKHIR — "Jika saya founder Kolekta"

**Saya akan menjalankan V2 sebagai produk, tetapi meng-arsitektur-i menuju V3 sejak baris kode pertama, dan menjadikan V4 sebagai kompas yang tak pernah saya langgar.**

Alasan:
1. **Bangun V2 di permukaan** — pasar Indonesia butuh produk yang dipahami dalam 30 detik. Kesederhanaan adalah fitur, bukan kelemahan. Jangan tampilkan kompleksitas V3/V4 ke collector.

2. **Tanam 3 primitif V3 SEKARANG** (murah sekarang, mahal nanti — ini garis yang tak bisa ditawar):
   - **SCOPE** (Org > Company > Branch) di data model + header, walau awalnya cuma 1 company. Retrofit multi-tenant = rewrite; menanamnya hari-1 nyaris gratis.
   - **CASE sebagai objek inti** — semua (dokumen, legal, GPS, approval, pembayaran, AI) menempel ke Case. Ini mencegah silo.
   - **AI sebagai lapisan (⌘K / command bar)**, bukan tab — dan abstraksi **module registry** sehingga fitur baru = modul terdaftar, bukan menu baru.

3. **Pisahkan Admin Console dari "More" segera** — ini mematikan "laci sampah" sebelum lahir, dan memberi rumah jelas bagi RBAC, Integrasi, Audit, Backup.

4. **Pecah Reports → Insights** (Ops Reports | Analytics | Executive Cockpit) begitu pengguna pimpinan pertama datang. Jangan biarkan CFO dan collector berbagi satu layar.

5. **V4 tidak dibangun — tapi tidak boleh dikontradiksi.** Setiap keputusan V2/V3 harus lulus uji: *"apakah ini menghalangi object-graph, multi-tenant, atau module-shell di masa depan?"* Jika ya, ubah sekarang.

Prioritas eksekusi (urutan founder):
```
  1. Scalability      → SCOPE + object-centric Case + module registry  (tanam di V2)
  2. Modularity       → Admin Console terpisah + Insights terpisah     (V2.5)
  3. Enterprise       → RBAC, multi-branch, approval engine            (V3)
  4. AI Integration   → command-bar layer dulu, agents kemudian        (V3→V4)
  5. UX               → jaga "paham 30 detik" di SETIAP tahap          (selalu)
```

Inti filosofinya: **kompleksitas boleh tumbuh di belakang layar (arsitektur), tapi tidak boleh bocor ke depan layar (pengalaman).** V2 untuk mata pengguna, V3 untuk struktur kode, V4 untuk arah. Pilih V3 sebagai *target operasi*; jangan pernah membangun menu yang menutup jalan ke V4.
