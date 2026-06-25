# KOLEKTA — Liquid Glass Design System
*Visual design system · iOS 26 "Liquid Glass" × enterprise Collection Control*
*Catatan: ini layer visual saja — Information Architecture, workflow & navigasi TIDAK berubah.*

> Status: **dua tingkat glass live** di aplikasi (Pengaturan → Tema):
> - **Liquid Glass** (`soft`) — frosted halus, light-first, untuk yang ingin kalem & terang.
> - **Liquid Glass Pro** (`pro`) — *TRUE* liquid glass ala iOS 26 / Apple Vision Pro: dark-first, permukaan putih-translusen tipis + backdrop-blur kuat, specular highlight, tepi cahaya, sheen diagonal (refraction), panel mengambang berlapis.
>
> ### Token Liquid Glass Pro (yang benar-benar dipakai di kode)
> - Glass surface: `rgba(255,255,255,0.10)` (light) / `0.08` (dark) di atas material navy gelap
> - Border/edge: `rgba(255,255,255,0.24)` + specular `inset 0 1px 0 rgba(255,255,255,.45)`
> - Backdrop blur: **30px**, saturate **180%**
> - Sheen (refraction): `linear-gradient(135deg, rgba(255,255,255,.16) → .02)`
> - Drop shadow float: `0 18px 44px -14px rgba(0,0,0,.62)`
> - Material latar: 3 radial bloom (navy/gold/blue) + linear navy, `fixed`
> - Teks token solid terang (`#F3F7FC` / `#BAC6D8`) demi keterbacaan di atas kaca gelap
>
> Mockup high-fidelity = screenshot aplikasi sungguhan yang dikirim bersama dokumen ini.

---

## 1. DESIGN PHILOSOPHY

**"Frosted clarity."** Permukaan terasa seperti kaca beku premium yang melayang di atas material navy yang dalam — tetapi **keterbacaan selalu menang atas estetika**. Glass dipakai untuk *hierarki & kedalaman*, bukan dekorasi.

Tiga aturan non-negotiable:
1. **Readability first** — opasitas permukaan ≥ 0.55 (gelap) / ≥ 0.66 (terang); teks selalu token solid, bukan transparan.
2. **Depth, not noise** — blur menandai *lapisan* (apa di atas apa), bukan efek pamer. Maksimal 3 lapisan glass bertumpuk.
3. **Field-ready** — kontras teks lulus WCAG AA; di bawah sinar matahari tetap terbaca karena material di belakang glass adalah navy gelap/lembut, bukan foto ramai.

Referensi rasa: Apple Liquid Glass (material) · Linear (ketenangan) · Stripe (kepercayaan data) · Notion (kelegaan) · Arc (kehalusan motion). **Bukan** neon/cyberpunk/gaming.

---

## 2. GLASS DESIGN SYSTEM

### 2.1 Color System (token)
Token solid untuk teks/aksen; permukaan semi-transparan.

| Token | Light | Dark | Pakai |
|---|---|---|---|
| `bg` (material base) | `#E7EEF7` + gradient navy/gold | `#0C1622` + gradient | Latar aplikasi (fixed mesh) |
| `surface` | `rgba(255,255,255,0.66)` | `rgba(26,41,58,0.55)` | Semua kartu/chrome (frosted) |
| `ink` | `#13243B` | `#EAF1FB` | Teks utama |
| `sub` | `#52647D` | `#9FADC2` | Teks sekunder |
| `brand` (Deep Navy) | `#1B3A5B` | `#6AA0D6` | Primary, tab aktif |
| `brand2` (Midnight) | `#2C5C82` | `#5A8FC4` | Sekunder/ikon |
| `brass` (Soft Gold) | `#A9772F` | `#D6A85E` | Aksen premium, FAB |
| `line` | `rgba(120,142,176,0.30)` | `rgba(255,255,255,0.14)` | Tepi frosted |
| `green/amber/red` | `#2E7D63 / #A9762A / #B0463F` | `#4FB389 / #E0A646 / #E27266` | Status |
| `slate` | `#5E6E84` | `#8C9AAE` | Netral |

Palet inti: **Deep Navy · Midnight Blue · Slate · White Frost · Soft Gold**. Tanpa neon, gradient dibatasi pada *background material* saja.

### 2.2 Background Material (adaptive)
Mesh dua radial + linear, `background-attachment: fixed` agar blur punya "isi" untuk dibiaskan:
```
radial(navy 20%) top-left  +  radial(gold 13%) top-right  +  linear(160°, frost→slate)
```
Dark: navy lebih dalam, aksen gold 12%.

### 2.3 Glass Layers (3 tingkat)
| Layer | Opasitas | Blur | Contoh |
|---|---|---|---|
| **L1 Base chrome** | 0.72 | 22px | Bottom nav, sidebar |
| **L2 Card** | 0.66 / 0.55 | 18px | KPI, case card, panel |
| **L3 Floating** | 0.66 / 0.55 | 18px + shadow kuat | Modal, command palette, FAB menu |

`saturate(165–170%)` untuk warna di belakang tetap hidup tanpa norak.

### 2.4 Elevation Scale
| Level | Shadow | Pakai |
|---|---|---|
| E0 | none | latar |
| E1 | `0 1px 1px /04 + 0 10px 30px -12px /18` | kartu diam |
| E2 | `0 18px 50px -16px /34` | floating/modal |
| Tepi cahaya | border `rgba(255,255,255,.45)` (L) / `.10` (D) | semua kartu |

### 2.5 Blur Scale
`sm 12 · md 18 (default kartu) · lg 22 (chrome) · xl 28 (modal opsional)`. Tidak melebihi 28px (performa + keterbacaan di HP lapangan).

### 2.6 Typography
- Font: `system-ui / -apple-system / Segoe UI / Roboto` (native, cepat). Angka/uang: monospace (`SF Mono/Roboto Mono`) untuk rata kolom.
- Skala: Display 26/800 · H1 20/700 · H2 14/600 · Body 13–14/400-500 · Caption 11/500 · Micro 10/600 (label uppercase, tracking .08em).
- Aturan: nominal selalu mono + tabular; label seksi uppercase + sub color.

### 2.7 Spacing & Grid
- Spacing: skala 4 → `4·8·12·16·24·32`. Padding kartu 16; gap grid 12.
- Radius: kartu `16` (rounded-xl), floating/tombol besar `20–24` (rounded-2xl), chip `999`.
- Grid: mobile 1–2 kol; KPI 2 kol (mobile) / 4 kol (≥lg); konten max-width `48rem` terpusat; desktop sidebar `15rem` + konten fluid.

### 2.8 Icon System
Lucide, stroke 2px, 16/18/20/22. Ikon dalam "ikon-chip": kotak `rounded-xl`, bg `brand2 @ 14%`, warna `brand`. Konsisten di Quick Actions, More, Reports hub, Command Palette.

### 2.9 Motion Guidelines
- Easing utama `cubic-bezier(.22,.61,.36,1)`; durasi 180–300ms.
- Entrans kartu/tab: fade+rise 6px. Modal/palette: rise 14px. Press: `scale(.96)`.
- FAB: rotate 45° (+→×) 200ms. Hormati `prefers-reduced-motion` (semua animasi off).

---

## 3. UI COMPONENT LIBRARY

Format tiap komponen: Visual · Tokens · Border · Shadow · Blur · Elevation · Hover · Active · Dark.

**1. Dashboard Card / Panel** — frosted putih, sudut 16. Tokens: bg `surface`, teks `ink/sub`. Border `line` 1px + tepi cahaya. Shadow E1. Blur 18. Elev L2. Hover: shadow naik halus. Active: `scale(.99)`. Dark: surface navy 0.55.

**2. KPI Card** — angka mono besar + label sub; aksen warna status (overdue=red). Border `line`. Shadow E1. Blur 18. L2. Hover none (statis). Dark: ink terang, angka tetap mono.

**3. Bottom Navigation** — bar frosted L1 (opasitas 0.72) menempel bawah, border-top `line`. Item aktif: `brand`, ikon 22 + label 10.5. Blur 22. Elev L1. Active item: warna brand; badge unread `red`. Dark: bar navy 0.72.

**4. Sidebar / More** — sidebar desktop frosted 0.60, grup label uppercase. More (mobile) = list `divide-y` di kartu frosted. Border `line`. Blur 22 (sidebar). Hover baris: `bg black/5`. Active (tab): fill `brand`, teks putih. Dark: navy 0.58.

**5. Floating Action Button** — bulat-rounded 24, **solid `brass`** (aksen, sengaja tak transparan agar menonjol), shadow E2. Menu item: ikon-chip frosted + label pill frosted. Hover: shadow lebih dalam. Active/open: rotate 45° jadi ×, overlay dim. Dark: brass lebih terang.

**6. Search Bar / Command Palette (⌘K)** — input frosted L3, blur 18, shadow E2, rise-in. Baris hasil: ikon-chip + teks; hover `bg black/5`. Slot AI: strip `brand @ 5%` + badge `brass`. Dark: panel navy 0.55.

**7. Tables / List** — baris `divide-y line`, nominal kanan mono. Header micro-uppercase sub. Hover baris `black/5`. Zebra tidak dipakai (pakai divider tipis). Dark: divider `white .08`.

**8. Case Card** — accent bar kiri (warna = bucket umur), nama bold, meta sub, badge (Kol/PRIO/status pill), nominal mono. Border `line`. Shadow E1. Blur 18. Hover: angkat. Active/expand: panel detail turun. Dark: navy 0.55.

**9. Chat Interface** — bubble frosted; bubble saya `brand` solid (kontras), lawan `surface` frosted. Background pola titik halus. Composer: bar frosted L1 + safe-area. Dark: bubble navy.

**10. Analytics** — kartu chart frosted, grid garis `line`, bar `brand`, tertagih `green`. Tooltip frosted L3. Legend caption. Dark: surface navy, garis `white .1`.

**11. Notification System** — toast pill `toast` (navy 0.88, sedikit blur), tengah-bawah, auto-hide. Badge angka `red`/`brass`. Banner inline (mis. sinkron gagal) pakai surface frosted. Dark: toast hampir hitam 0.9.

**12. Modal Dialog** — kartu L3 frosted, blur 18–28, shadow E2, rise 14px, overlay `rgba(0,0,0,.45)`. Tombol primary `brand`. Dark: navy 0.55.

**13. Dropdown / Select** — kontrol frosted, border `line`, chevron sub. Open: panel L3 frosted. Hover opsi `black/5`, selected `brand2` chip. Dark: navy.

**14. Form Input** — field bg `bg`/frosted, border `line`, fokus: border `brand2` + ring lembut. Label caption sub. Error: border/teks `red`. Dark: field navy, placeholder `sub`.

**15. Date Picker** — input date native distyle frosted; tampil tanggal `id-ID`. Sel terpilih `brand`. Dark: navy surface.

**16. Attachment Viewer / Lightbox** — overlay gelap pekat (di sini glass diminimalkan demi fokus konten foto/PDF), kontrol melayang frosted, tombol unduh `brand`. Dark: identik (sudah gelap).

**+ Komponen lain (otomatis ikut sistem):** Chips/Tags (frosted/solid status), Segmented control (Cases & Reports sub-nav: trek `bg`, aktif `brand`), Progress bar (trek `line`, isi status), Avatar (kotak rounded warna inisial), Badge, Tabs, Tooltip, Empty-state (kartu dashed `line`), Skeleton (shimmer frosted). Semua mewarisi token, blur, radius, dan motion yang sama.

---

## 4–8. MOCKUP & DARK MODE (high-fidelity)
Karena tema sudah live, mockup = **screenshot aplikasi nyata** (dilampirkan):
- **Mobile — Light** (`glass-dash-light.png`)
- **Mobile — Dark** (`glass-dash-dark.png`)
- **Desktop — Light** (`glass-desktop.png`)
- Tablet: layout desktop fluid menyesuaikan ≥`lg`; di bawah itu memakai layout mobile (grid KPI 2 kolom) — sudah responsif via breakpoint yang sama.

Semua komponen di atas tampil dalam screenshot tersebut dengan frosted surface, tepi cahaya, dan material navy.

---

## TARGET TERCAPAI
Saat dibuka dengan tema Liquid Glass, Kolekta terasa seperti **perpaduan Apple (material), Stripe (kepercayaan data), dan Salesforce enterprise (kelengkapan)** — modern, premium, profesional, dan tetap cepat & terbaca untuk collector di lapangan. Tema lain (Hutan/Baja/Arsip/Pink) tetap tersedia; Liquid Glass adalah opsi, bukan paksaan.
