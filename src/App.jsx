import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus, Search, Settings, Copy, Check, Trash2, Clock, AlertTriangle,
  Wallet, Bell, RotateCcw, X, MessageCircle, ChevronDown, FileText, Scale,
  FileSpreadsheet, Printer, Building2, User, Upload, Download, Cloud, RefreshCw, Pencil,
  BarChart3, ClipboardList, Send, Menu, SlidersHorizontal, CalendarClock, FileSignature, Truck, Camera, MapPin,
  LogOut, Lock, ShieldCheck, Flame, CalendarDays, Grid3x3, Calculator as CalcIcon, Divide, Percent, Delete,
  Moon, Sun,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

/* ---------- Tema (inline style, bukan arbitrary Tailwind) ---------- */
/* Tiap tema punya varian terang (light) & gelap (dark); mode gelap berlaku untuk semua tema. */
const THEMES = {
  hutan: {
    name: "Hutan",
    light: { bg: "#EEF1ED", surface: "#FFFFFF", ink: "#16241E", sub: "#5E6E66", brand: "#0C3B2E", brand2: "#15564A", brass: "#BE863A", line: "#DDE3DD", green: "#2F7D5B", amber: "#C0822A", red: "#B0463A", slate: "#6C7B73", toast: "#16241E" },
    dark: { bg: "#0E1A16", surface: "#16241F", ink: "#E7EFE9", sub: "#93A39B", brand: "#2E8B6F", brand2: "#38A083", brass: "#D6A24A", line: "#26352E", green: "#4FB389", amber: "#E0A646", red: "#E27266", slate: "#8A9A91", toast: "#05100C" },
  },
  baja: {
    name: "Baja",
    light: { bg: "#EDF0F4", surface: "#FFFFFF", ink: "#18222E", sub: "#5C6675", brand: "#1B3A5B", brand2: "#2C5C82", brass: "#B07A3C", line: "#DBE1EA", green: "#2E7D63", amber: "#B97F2A", red: "#B0463F", slate: "#66707E", toast: "#18222E" },
    dark: { bg: "#0E1722", surface: "#172533", ink: "#E5EDF6", sub: "#8E9BAD", brand: "#3F73A4", brand2: "#5288BE", brass: "#CE9E54", line: "#263444", green: "#46A883", amber: "#D79E45", red: "#DE6E63", slate: "#7E8B9C", toast: "#060E16" },
  },
  arsip: {
    name: "Arsip",
    light: { bg: "#F1EADB", surface: "#FBF6EC", ink: "#2A2317", sub: "#6E6450", brand: "#5A3D22", brand2: "#7A5A33", brass: "#A9762E", line: "#E2D7C2", green: "#4E7A4A", amber: "#A9761F", red: "#9E4A35", slate: "#7A6E55", toast: "#2A2317" },
    dark: { bg: "#1A150E", surface: "#251E13", ink: "#F0E7D6", sub: "#AB9C80", brand: "#A07E4C", brand2: "#B98F54", brass: "#CFA040", line: "#352A1B", green: "#7FA060", amber: "#CFA040", red: "#C56A4D", slate: "#9A8D71", toast: "#0E0A05" },
  },
  pink: {
    name: "Pink",
    light: { bg: "#FCEEF4", surface: "#FFFFFF", ink: "#2C141F", sub: "#7E5E6B", brand: "#9E2A5E", brand2: "#C24A7C", brass: "#BE7C42", line: "#F2DBE5", green: "#2F7D5B", amber: "#C0822A", red: "#C0413E", slate: "#8C6976", toast: "#2C141F" },
    dark: { bg: "#1C0E15", surface: "#28141E", ink: "#F6E4ED", sub: "#B98FA2", brand: "#D75A91", brand2: "#E771A4", brass: "#E0A65C", line: "#3A2230", green: "#4FB389", amber: "#E0A646", red: "#E27266", slate: "#A98C98", toast: "#0E0509" },
  },
};
// Pemetaan tema lama → keluarga + mode (kompatibilitas data tersimpan).
const LEGACY_TEMA = { tinta: { base: "hutan", gelap: true } };
function themePalette(key, gelap) {
  const leg = LEGACY_TEMA[key];
  if (leg) { key = leg.base; gelap = leg.gelap; }
  const fam = THEMES[key] || THEMES.hutan;
  return fam[gelap ? "dark" : "light"];
}
let T = themePalette("hutan", false);
const MONO = "ui-monospace, 'SF Mono', 'Roboto Mono', 'DejaVu Sans Mono', monospace";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const STATUS_META = {
  belum_dihubungi: { label: "Belum dihubungi", token: "slate" },
  sudah_followup: { label: "Sudah follow-up", token: "brand2" },
  janji_bayar: { label: "Janji bayar", token: "amber" },
  ingkar_janji: { label: "Ingkar janji", token: "red" },
  lunas: { label: "Lunas", token: "green" },
};
const STATUS_ORDER = ["belum_dihubungi", "sudah_followup", "janji_bayar", "ingkar_janji", "lunas"];
const HASIL = {
  ptp: { label: "Janji bayar (PTP)", status: "janji_bayar" },
  partial: { label: "Bayar sebagian", status: null },
  ingkar: { label: "Ingkar janji", status: "ingkar_janji" },
  rtp: { label: "Menolak bayar", status: "ingkar_janji" },
  notfound: { label: "Tidak di tempat", status: null },
  nocontact: { label: "Kontak terputus", status: null },
  lain: { label: "Catatan", status: null },
};
const HASIL_ORDER = ["ptp", "partial", "ingkar", "rtp", "notfound", "nocontact", "lain"];
const stColor = (st) => T[STATUS_META[st].token];
const stLabel = (st) => STATUS_META[st].label;
const NAV = [
  { id: "hari", icon: Bell, label: "Hari Ini" },
  { id: "tagihan", icon: Wallet, label: "Tagihan" },
  { id: "analitik", icon: BarChart3, label: "Analitik" },
  { id: "heatmap", icon: Flame, label: "Heat Map" },
  { id: "set", icon: Settings, label: "Pengaturan" },
];

/* ---------- Helpers ---------- */
const onlyDigits = (v) => String(v ?? "").replace(/[^0-9]/g, "");
const grpID = (v) => { const n = onlyDigits(v); return n ? Number(n).toLocaleString("id-ID") : ""; };
const rp = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(n || 0));
const rpc = (v) => {
  let n = Math.round(v || 0); const neg = n < 0 ? "-" : ""; n = Math.abs(n);
  const f = (x, d) => x.toFixed(d).replace(/\.0$/, "").replace(".", ",");
  if (n >= 1e9) return `${neg}Rp${f(n / 1e9, 1)} M`;
  if (n >= 1e6) return `${neg}Rp${f(n / 1e6, n < 1e7 ? 1 : 0)} jt`;
  if (n >= 1e3) return `${neg}Rp${Math.round(n / 1e3)} rb`;
  return `${neg}Rp${n}`;
};
const fmtTgl = (iso) => {
  if (!iso) return "-";
  try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T00:00:00")); }
  catch { return iso; }
};
const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const dayDiff = (a, b) => Math.round((a - b) / 86400000);
const daysSince = (iso) => (iso ? dayDiff(today0(), new Date(iso)) : Infinity);
const greeting = () => { const h = new Date().getHours(); return h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam"; };
const uid = () => Math.random().toString(36).slice(2, 9);

const fmtWaktu = (iso) => {
  if (!iso) return "";
  try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
  catch { return iso; }
};
function resizeImage(file, max = 640, q = 0.55) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      try { resolve(c.toDataURL("image/jpeg", q)); } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img")); };
    img.src = url;
  });
}
function getLoc() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geo"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy || 0) }),
      (e) => reject(e),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/* Reverse geocode (koordinat -> alamat) via Nominatim, di-cache di localStorage. */
const REVGEO_KEY = "kolekta:revgeo";
async function reverseGeocode(lat, lng) {
  const key = `${(+lat).toFixed(4)},${(+lng).toFixed(4)}`;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(REVGEO_KEY) || "{}"); } catch {}
  if (key in cache) return cache[key];
  let addr = null;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=0&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
    if (r.ok) { const j = await r.json(); addr = (j && j.display_name) || null; }
  } catch {}
  try { cache[key] = addr; localStorage.setItem(REVGEO_KEY, JSON.stringify(cache)); } catch {}
  return addr;
}

/* Cap geotag ala GPS Camera: tempel alamat, koordinat, waktu di bawah foto. */
function stampImage(dataUrl, info) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height;
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const pad = Math.round(w * 0.028);
      const fs = Math.max(12, Math.round(w * 0.030));
      const lh = Math.round(fs * 1.4);
      const head = []; // baris tebal (judul/perusahaan)
      if (info.brand) head.push(info.brand);
      const body = [];
      if (info.address) body.push(info.address);
      const coord = info.lat != null ? `${info.lat}, ${info.lng}${info.acc ? `  (±${info.acc} m)` : ""}` : "";
      if (coord) body.push(coord);
      if (info.waktu) body.push(info.waktu);

      const wrapLines = (text, font) => {
        ctx.font = font; const maxW = w - pad * 2; const res = []; let line = "";
        for (const word of text.split(" ")) {
          const test = line ? line + " " + word : word;
          if (ctx.measureText(test).width > maxW && line) { res.push(line); line = word; } else line = test;
        }
        if (line) res.push(line);
        return res;
      };
      const headFont = `700 ${Math.round(fs * 1.05)}px ${SANS}`;
      const bodyFont = `${fs}px ${SANS}`;
      const headLines = head.flatMap((t) => wrapLines(t, headFont));
      const bodyLines = body.flatMap((t) => wrapLines(t, bodyFont));
      const totalLines = headLines.length + bodyLines.length;
      const barH = pad * 1.6 + totalLines * lh;

      const grad = ctx.createLinearGradient(0, h - barH - pad, 0, h);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.3, "rgba(0,0,0,0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0.8)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, h - barH - pad, w, barH + pad);
      // garis aksen emas
      ctx.fillStyle = "#BE863A";
      ctx.fillRect(pad, h - barH, Math.round(w * 0.12), Math.max(2, Math.round(fs * 0.16)));

      ctx.textBaseline = "top";
      let y = h - barH + Math.round(fs * 0.5);
      headLines.forEach((ln) => { ctx.font = headFont; ctx.fillStyle = "#FFFFFF"; ctx.fillText(ln, pad, y); y += lh; });
      bodyLines.forEach((ln) => { ctx.font = bodyFont; ctx.fillStyle = "#EAEAEA"; ctx.fillText(ln, pad, y); y += lh; });

      try { resolve(c.toDataURL("image/jpeg", 0.72)); } catch { resolve(dataUrl); }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function kolektibilitas(odRaw, lunas) {
  if (lunas) return { no: 1, short: "Lunas", label: "Lunas", tone: "green" };
  if (odRaw <= 0) return { no: 1, short: "Kol 1", label: "Lancar (Kol 1)", tone: "green" };
  if (odRaw <= 90) return { no: 2, short: "Kol 2", label: "Dalam Perhatian Khusus (Kol 2)", tone: "amber" };
  if (odRaw <= 120) return { no: 3, short: "Kol 3", label: "Kurang Lancar (Kol 3)", tone: "amber" };
  if (odRaw <= 180) return { no: 4, short: "Kol 4", label: "Diragukan (Kol 4)", tone: "red" };
  return { no: 5, short: "Kol 5", label: "Macet (Kol 5)", tone: "red" };
}

function ptpStat(list) {
  const due = list.filter((i) => i.janjiBayar && new Date(i.janjiBayar) <= today0());
  let kept = 0;
  due.forEach((i) => { if (i.status === "lunas" || (i.pembayaran || []).some((p) => p.ts >= i.janjiBayar)) kept++; });
  const total = due.length;
  return { kept, broken: total - kept, total, rate: total ? Math.round((kept / total) * 100) : null };
}

function enrich(inv, s) {
  const due = new Date(inv.tglJatuhTempo + "T00:00:00");
  const odRaw = dayDiff(today0(), due);
  const lunas = inv.status === "lunas";
  const terbayar = (inv.pembayaran || []).reduce((a, p) => a + (p.jumlah || 0), 0);
  const sisaPokok = Math.max(0, inv.nominal - terbayar);
  const daysOverdue = lunas ? 0 : Math.max(0, odRaw);
  const denda = lunas ? 0 : Math.round(sisaPokok * (s.dendaRatePct / 100) * daysOverdue);
  const total = lunas ? 0 : sisaPokok + denda;
  let bucket = "lancar";
  if (lunas) bucket = "lunas";
  else if (odRaw <= 0) bucket = "lancar";
  else if (odRaw <= 30) bucket = "1-30";
  else if (odRaw <= 60) bucket = "31-60";
  else if (odRaw <= 90) bucket = "61-90";
  else bucket = "90+";
  const kol = kolektibilitas(odRaw, lunas);
  const t0 = today0();
  const ptpLewat = !lunas && inv.status === "janji_bayar" && inv.janjiBayar ? dayDiff(t0, new Date(inv.janjiBayar + "T00:00:00")) < 0 : false;
  const tlDue = !lunas && inv.tindakLanjut ? dayDiff(t0, new Date(inv.tindakLanjut + "T00:00:00")) <= 0 : false;
  let prioScore = 0;
  if (!lunas) {
    prioScore += Math.min(40, daysOverdue * 0.5);
    prioScore += Math.min(30, (total / 1e7) * 10);
    if (ptpLewat) prioScore += 20;
    if (tlDue) prioScore += 10;
    if (!inv.jaminanTipe || inv.jaminanTipe === "none") prioScore += 8;
    prioScore = Math.min(100, Math.round(prioScore));
  }
  const prio = prioScore >= 70 ? { label: "Sangat tinggi", tone: "red" } : prioScore >= 45 ? { label: "Tinggi", tone: "amber" } : prioScore >= 25 ? { label: "Sedang", tone: "brand2" } : { label: "Rendah", tone: "slate" };
  return { ...inv, due, odRaw, daysOverdue, terbayar, sisaPokok, denda, total, bucket, kol, ptpLewat, tlDue, prioScore, prioLabel: prio.label, prioTone: prio.tone };
}

function waLink(phone, text) {
  let d = (phone || "").replace(/[^0-9]/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

const recoLevel = (i) => {
  const d = i.daysOverdue;
  const hasJ = i.jaminanTipe && i.jaminanTipe !== "none";
  if (hasJ && d > 120) return "tarik";
  if (d > 60) return "somasi";
  if (d > 30) return "sp";
  if (d > 14) return "tegas";
  return "reminder";
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const isPerorangan = (i) => (i.tipe || "perusahaan") === "perorangan";

function debtorBlock(i) {
  const alamat = i.alamat?.trim();
  const pic = i.pic?.trim();
  const baris = alamat ? alamat + "\n" : "";
  if (isPerorangan(i)) return `Yth. Sdr./Sdri. ${i.customer}\n${baris}di Tempat`;
  return `Yth. Manajemen ${i.customer}\n${pic ? "u.p. " + pic + "\n" : ""}${baris}di Tempat`;
}
function sapaanWA(i) {
  const pic = i.pic?.trim();
  if (isPerorangan(i)) return `Bapak/Ibu ${i.customer}`;
  return pic ? `Bapak/Ibu ${pic}` : `Bapak/Ibu dari ${i.customer}`;
}
function jaminanKlausa(i) {
  const t = i.jaminanTipe;
  const j = i.jaminan?.trim();
  if (!j || !t || t === "none") return "";
  if (t === "fidusia")
    return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut dijamin dengan jaminan fidusia berupa ${j}. Apabila Saudara tetap lalai memenuhi kewajiban, kami berhak melakukan eksekusi atas objek jaminan fidusia tersebut — termasuk penarikan dan penjualannya untuk pelunasan — sesuai Undang-Undang Nomor 42 Tahun 1999 tentang Jaminan Fidusia.`;
  if (t === "tanah")
    return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut dijamin dengan Hak Tanggungan atas ${j}. Apabila Saudara tetap lalai, kami berhak menempuh eksekusi Hak Tanggungan atas objek jaminan tersebut sesuai Undang-Undang Nomor 4 Tahun 1996 tentang Hak Tanggungan.`;
  return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut disertai jaminan berupa ${j}, yang dapat kami tindaklanjuti sesuai ketentuan perjanjian dan peraturan yang berlaku apabila kewajiban tidak dipenuhi.`;
}

function escalationDocs(i, s) {
  const p = s.perusahaan?.trim() || "[Nama Perusahaan Anda]";
  const kota = s.kota?.trim();
  const jabatan = s.jabatan?.trim() || "Bagian Penagihan / Kuasa Hukum";
  const now = new Date();
  const tgl = fmtTgl(now.toISOString().slice(0, 10));
  const noSurat = (kode) => `......./${kode}/${ROMAN[now.getMonth()]}/${now.getFullYear()}`;
  const ttdKota = `${kota ? kota + ", " : ""}${tgl}`;
  const sebutan = isPerorangan(i) ? "Saudara" : "Perusahaan Saudara";
  const pokok = i.sisaPokok ?? i.nominal;
  const terbayar = i.terbayar || 0;
  const barisBayar = terbayar > 0 ? `\nSudah Dibayar     : ${rp(terbayar)} (dari pokok ${rp(i.nominal)})` : "";

  const reminder = `Selamat ${greeting()}, ${sapaanWA(i)} 🙏

Izin mengingatkan untuk tagihan *${i.noInvoice}* yang jatuh tempo ${fmtTgl(i.tglJatuhTempo)} (telat ${i.daysOverdue} hari).

Total saat ini: *${rp(i.total)}*
(sisa pokok ${rp(pokok)} + denda ${rp(i.denda)})

Mohon konfirmasi rencana pembayarannya ya, Pak/Bu. Terima kasih 🙏
— ${p}`;

  const tegas = `Selamat ${greeting()}, ${sapaanWA(i)}.

Kami mencatat tagihan *${i.noInvoice}* sebesar ${rp(i.nominal)} telah jatuh tempo sejak ${fmtTgl(i.tglJatuhTempo)} dan kini menunggak *${i.daysOverdue} hari*. Termasuk denda, total kewajiban menjadi *${rp(i.total)}*.${i.jaminan?.trim() ? `\n\nPerlu diingat, tagihan ini disertai jaminan (${i.jaminan.trim()}).` : ""}

Mohon pembayaran diselesaikan paling lambat 3 (tiga) hari kerja ke depan untuk menghindari proses penagihan lebih lanjut. Kami tunggu konfirmasinya hari ini.

Terima kasih.
— ${p}`;

  const sp = `SURAT PERINGATAN
Nomor: ${noSurat("SP")}
Perihal: Peringatan Keterlambatan Pembayaran

${debtorBlock(i)}

Dengan hormat,

Berdasarkan catatan kami, ${sebutan} memiliki kewajiban pembayaran yang telah melewati tanggal jatuh tempo, dengan rincian sebagai berikut:

No. Invoice/Tagihan : ${i.noInvoice}
Tanggal Jatuh Tempo : ${fmtTgl(i.tglJatuhTempo)}
Lama Keterlambatan  : ${i.daysOverdue} hari
Pokok Kewajiban     : ${rp(pokok)}${barisBayar}
Denda Keterlambatan : ${rp(i.denda)}
Total Kewajiban     : ${rp(i.total)}

Sehubungan dengan hal tersebut, kami menyampaikan PERINGATAN agar ${sebutan} segera menyelesaikan seluruh kewajiban di atas selambat-lambatnya 7 (tujuh) hari kalender sejak surat ini diterima.${jaminanKlausa(i)}

Apabila sampai dengan batas waktu tersebut pembayaran belum kami terima, kami berhak menempuh upaya penagihan lebih lanjut sesuai ketentuan yang berlaku, termasuk pengenaan denda berjalan dan langkah hukum.

Demikian surat peringatan ini kami sampaikan untuk menjadi perhatian.

${ttdKota}
Hormat kami,
${p}



(__________________________)
${jabatan}`;

  const somasi = `SOMASI
Nomor    : ${noSurat("SOM")}
Lampiran : -
Perihal  : Teguran/Somasi atas Tunggakan Pembayaran

${debtorBlock(i)}

Dengan hormat,

Perkenankan kami, ${p}, menyampaikan teguran (somasi) sehubungan dengan adanya kewajiban ${sebutan} yang telah jatuh tempo namun hingga saat ini belum dipenuhi, dengan rincian:

No. Invoice/Tagihan : ${i.noInvoice}
Tanggal Jatuh Tempo : ${fmtTgl(i.tglJatuhTempo)}
Lama Keterlambatan  : ${i.daysOverdue} hari
Pokok Kewajiban     : ${rp(pokok)}${barisBayar}
Denda Keterlambatan : ${rp(i.denda)}
Total Kewajiban     : ${rp(i.total)}

Bahwa berdasarkan perikatan yang telah disepakati, ${sebutan} berkewajiban melakukan pembayaran tepat pada waktunya. Tidak dipenuhinya kewajiban yang telah jatuh tempo tersebut merupakan suatu kelalaian (wanprestasi) sebagaimana dimaksud dalam Pasal 1238 dan Pasal 1243 Kitab Undang-Undang Hukum Perdata.${jaminanKlausa(i)}

Berdasarkan hal tersebut, kami MENEGUR dan meminta ${sebutan} untuk segera melunasi seluruh kewajiban di atas dalam waktu 7 (tujuh) hari kalender terhitung sejak somasi ini diterima.

Apabila dalam tenggang waktu tersebut ${sebutan} tetap tidak memenuhi kewajiban, dengan sangat menyesal kami akan menempuh upaya hukum yang diperlukan untuk melindungi hak kami — baik melalui gugatan perdata, eksekusi jaminan, maupun mekanisme penyelesaian sengketa lain sesuai ketentuan yang berlaku — dengan segala biaya yang timbul menjadi tanggungan ${sebutan}.

Demikian somasi ini kami sampaikan. Atas perhatian dan penyelesaiannya, kami ucapkan terima kasih.

${ttdKota}
Hormat kami,
${p}



(__________________________)
${jabatan}`;

  const rincian = `No. Invoice/Tagihan : ${i.noInvoice}
Tanggal Jatuh Tempo : ${fmtTgl(i.tglJatuhTempo)}
Lama Keterlambatan  : ${i.daysOverdue} hari
Pokok Kewajiban     : ${rp(pokok)}${barisBayar}
Denda Keterlambatan : ${rp(i.denda)}
Total Kewajiban     : ${rp(i.total)}`;

  let tarik = null;
  if (i.jaminanTipe === "fidusia") {
    tarik = `SURAT PEMBERITAHUAN PENARIKAN OBJEK JAMINAN FIDUSIA
Nomor: ${noSurat("FID")}
Perihal: Pemberitahuan Penarikan Objek Jaminan Fidusia

${debtorBlock(i)}

Dengan hormat,

Menunjuk perjanjian pembiayaan beserta Akta Jaminan Fidusia, dan setelah surat peringatan/somasi kami sampaikan, ${sebutan} masih belum memenuhi kewajiban berikut:

${rincian}

Sehubungan dengan kelalaian (wanprestasi) tersebut, sesuai Undang-Undang Nomor 42 Tahun 1999 tentang Jaminan Fidusia juncto Putusan Mahkamah Konstitusi Nomor 18/PUU-XVII/2019, kami memberitahukan rencana penarikan/eksekusi atas objek jaminan fidusia berupa:
${i.jaminan || "(uraian objek jaminan)"}

Sesuai putusan tersebut, penarikan/eksekusi dilakukan atas dasar adanya kesepakatan mengenai telah terjadinya cidera janji dan kesediaan menyerahkan objek jaminan secara sukarela. Apabila kesepakatan tidak tercapai, eksekusi ditempuh melalui penetapan Pengadilan Negeri.

Oleh karena itu, kami mengimbau ${sebutan} dalam waktu 3 (tiga) hari kalender sejak surat ini untuk: (a) melunasi seluruh kewajiban; atau (b) menyerahkan objek jaminan secara sukarela kepada kami guna penyelesaian. Penyerahan sukarela akan dituangkan dalam Berita Acara Serah Terima.

Demikian disampaikan untuk menjadi perhatian.

${ttdKota}
Hormat kami,
${p}



(__________________________)
${jabatan}`;
  } else if (i.jaminanTipe === "tanah") {
    tarik = `SURAT PEMBERITAHUAN RENCANA LELANG EKSEKUSI HAK TANGGUNGAN
Nomor: ${noSurat("HT")}
Perihal: Pemberitahuan Rencana Lelang Eksekusi Hak Tanggungan

${debtorBlock(i)}

Dengan hormat,

Setelah somasi/peringatan kami sampaikan, ${sebutan} masih belum memenuhi kewajiban berikut:

${rincian}

Sehubungan dengan kelalaian tersebut, dan sesuai Undang-Undang Nomor 4 Tahun 1996 tentang Hak Tanggungan, khususnya hak pemegang Hak Tanggungan untuk menjual objek jaminan atas kekuasaan sendiri (parate eksekusi), kami memberitahukan rencana pelaksanaan lelang eksekusi melalui Kantor Pelayanan Kekayaan Negara dan Lelang (KPKNL) atas objek jaminan berupa:
${i.jaminan || "(uraian objek jaminan)"}

Kami mengimbau ${sebutan} dalam waktu 7 (tujuh) hari kalender sejak surat ini untuk menyelesaikan seluruh kewajiban guna menghindari pelaksanaan lelang dimaksud.

Demikian disampaikan untuk menjadi perhatian.

${ttdKota}
Hormat kami,
${p}



(__________________________)
${jabatan}`;
  } else if (i.jaminanTipe && i.jaminanTipe !== "none") {
    tarik = `SURAT PEMBERITAHUAN EKSEKUSI JAMINAN
Nomor: ${noSurat("EKS")}
Perihal: Pemberitahuan Eksekusi atas Objek Jaminan

${debtorBlock(i)}

Dengan hormat,

Setelah somasi/peringatan kami sampaikan, ${sebutan} masih belum memenuhi kewajiban berikut:

${rincian}

Sehubungan dengan kelalaian tersebut, kami memberitahukan rencana tindak lanjut atas objek jaminan berupa ${i.jaminan || "(uraian objek jaminan)"} sesuai ketentuan perjanjian dan peraturan yang berlaku. Kami mengimbau ${sebutan} dalam waktu 7 (tujuh) hari kalender untuk menyelesaikan kewajiban.

Demikian disampaikan untuk menjadi perhatian.

${ttdKota}
Hormat kami,
${p}



(__________________________)
${jabatan}`;
  }

  const out = [
    { key: "reminder", label: "Reminder", text: reminder, wa: true },
    { key: "tegas", label: "Reminder Tegas", text: tegas, wa: true },
    { key: "sp", label: "Surat Peringatan", text: sp, wa: false },
    { key: "somasi", label: "Somasi", text: somasi, wa: false },
  ];
  if (tarik) out.push({ key: "tarik", label: i.jaminanTipe === "fidusia" ? "Surat Penarikan" : i.jaminanTipe === "tanah" ? "Lelang HT" : "Eksekusi Jaminan", text: tarik, wa: false });
  return out;
}

/* Cetak via iframe tersembunyi — tetap di dalam aplikasi sehingga pengguna
   tidak "nyantol" di tab/penampil PDF baru (penting untuk PWA standalone iOS).
   Setelah dialog cetak ditutup, iframe otomatis dibuang dan user kembali ke app. */
// Format surat resmi: A4, Times New Roman 12pt, margin atas/kiri 4cm — kanan/bawah 3cm,
// spasi 1,5, paragraf justify dengan indent baris pertama 1cm & jarak antar-paragraf 6pt.
const DOC_STYLE = `@page{size:A4;margin:4cm 3cm 3cm 4cm}
html,body{width:100%}
body{font-family:'Times New Roman',Georgia,serif;font-size:12pt;line-height:1.5;color:#111;margin:0}
p{margin:0;orphans:2;widows:2}
.title{text-align:center;font-weight:bold;margin:0 0 10pt;line-height:1.3;text-transform:uppercase;page-break-after:avoid;break-after:avoid}
.subhead{font-weight:bold;margin:8pt 0 2pt;page-break-after:avoid;break-after:avoid}
.body{text-align:justify;text-indent:1cm;margin:0 0 6pt}
.line{margin:0 0 1pt}
.listline{margin:0 0 1pt;padding-left:1cm;text-indent:-1cm}
.gap{height:6pt}
table.kv{border-collapse:collapse;margin:2pt 0 6pt;page-break-inside:avoid;break-inside:avoid}
table.kv td{vertical-align:top;padding:0 0 1pt}
table.kv td.k{white-space:nowrap;padding-right:8px}
table.kv td.c{padding-right:8px}
.sigblock{display:inline-block;margin:8pt 0 0;text-align:center;page-break-inside:avoid;break-inside:avoid}
.sigblock .ttd-img{height:60px;display:block;margin:0 auto -1px}
.sigblock .ttd-space{height:52px}
.sigblock .ttd-rule{width:5cm;border-bottom:1px solid #111;margin:0 auto}
.sigblock .ttd-name{margin-top:2pt;font-weight:600;line-height:1.3}
table.siggrid{width:100%;border-collapse:collapse;margin-top:12pt;page-break-inside:avoid;break-inside:avoid}
table.siggrid td{width:50%;vertical-align:top;text-align:center;padding:0 8pt}
table.siggrid .sgcap{margin-bottom:2pt}
table.siggrid .sgimg{height:60px;display:block;margin:0 auto -1px}
table.siggrid .sgspace{height:54px}
table.siggrid .sgrule{width:5cm;border-bottom:1px solid #111;margin:0 auto}
table.siggrid .sgname{margin-top:2pt;font-weight:600;line-height:1.3}`;
function printViaIframe(label, bodyHtml) {
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    // Beri iframe lebar A4 nyata (di luar layar) agar tata letak cetak benar —
    // iframe 0px membuat teks membungkus per beberapa huruf & terpotong antar-halaman.
    iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0;opacity:0;";
    document.body.appendChild(iframe);
    const cw = iframe.contentWindow;
    let removed = false;
    const cleanup = () => { if (removed) return; removed = true; setTimeout(() => { try { iframe.remove(); } catch (_) {} }, 500); };
    cw.onafterprint = cleanup;
    const doc = cw.document;
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${label}</title><style>${DOC_STYLE}</style></head>` +
      `<body>${bodyHtml}<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},150)}<\/script></body></html>`
    );
    doc.close();
    setTimeout(cleanup, 5 * 60 * 1000); // pengaman bila onafterprint tak terpicu
    return true;
  } catch (e) {
    return false;
  }
}

/* Ubah teks dokumen polos → HTML rapi (paragraf justify, tabel "label : nilai",
   blok tanda tangan). sigMap memetakan token tanda tangan ke gambar data-URL:
   { SIGN, SIGN1, SIGN2 }. Token tanpa gambar / placeholder "(____)" jadi ruang ttd manual. */
function renderDocHtml(text, sigMap = {}) {
  const esc = (str) => (str == null ? "" : String(str)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = (text || "").replace(/\r/g, "").split("\n");
  const out = [];
  let fieldRun = [];
  let pendingSig = null;
  let seenTitle = false;
  let blankPending = false;

  const gap = () => { if (out.length) out.push(`<div class="gap"></div>`); };
  const flushFields = () => {
    if (!fieldRun.length) return;
    const rows = fieldRun.map((f) => `<tr><td class="k">${esc(f.k)}</td><td class="c">:</td><td class="v">${esc(f.v)}</td></tr>`).join("");
    out.push(`<table class="kv">${rows}</table>`);
    fieldRun = [];
  };
  const flushSig = () => {
    if (!pendingSig) return;
    const inner = pendingSig.img
      ? `<img class="ttd-img" src="${pendingSig.img}" alt="tanda tangan"/>`
      : `<div class="ttd-space"></div>`;
    const names = pendingSig.names.map((n) => `<div class="ttd-name">${esc(n)}</div>`).join("");
    out.push(`<div class="sigblock">${inner}<div class="ttd-rule"></div>${names}</div>`);
    pendingSig = null;
  };
  const fieldMatch = (ln) => {
    const m = ln.match(/^([^:]{1,22}?) *: +(\S.*)$/);
    return m ? { k: m[1].trim(), v: m[2] } : null;
  };
  const sigAnchor = (ln) => {
    const t = ln.trim();
    const m = t.match(/^\[\[SIGN([12]?)\]\]$/);
    if (m) return { img: sigMap["SIGN" + (m[1] || "")] || null };
    if (/^\(?_{5,}\)?$/.test(t)) return { img: null };
    return null;
  };
  // Blok tanda tangan dua pihak (kiri & kanan). Baris: "tipe|kiri|kanan", tipe = cap|sig|name.
  const renderSigGrid = (rows) => {
    const cols = [{ cap: "", tok: "", names: [] }, { cap: "", tok: "", names: [] }];
    for (const r of rows) {
      const parts = r.split("|");
      const type = (parts[0] || "").trim();
      [parts[1] || "", parts[2] || ""].forEach((c, idx) => {
        const v = c.trim();
        if (type === "cap") cols[idx].cap = v;
        else if (type === "sig") cols[idx].tok = v;
        else if (type === "name" && v) cols[idx].names.push(v);
      });
    }
    const cell = (col) => {
      const sig = col.tok && sigMap[col.tok]
        ? `<img class="sgimg" src="${sigMap[col.tok]}" alt="tanda tangan"/>`
        : `<div class="sgspace"></div>`;
      const cap = col.cap ? `<div class="sgcap">${esc(col.cap)}</div>` : "";
      const names = col.names.map((n) => `<div class="sgname">${esc(n)}</div>`).join("");
      return `<td>${cap}${sig}<div class="sgrule"></div>${names}</td>`;
    };
    return `<table class="siggrid"><tr>${cell(cols[0])}${cell(cols[1])}</tr></table>`;
  };
  const textLine = (t) => {
    const allCaps = /[A-Z]/.test(t) && !/[a-z]/.test(t);
    if (allCaps && t.length <= 70 && !/^(PT|CV|UD)\b/.test(t)) {
      if (!seenTitle) { seenTitle = true; return `<p class="title">${esc(t)}</p>`; }
      return `<p class="subhead">${esc(t)}</p>`;
    }
    if (/^[-•]\s+/.test(t)) return `<p class="listline">${esc(t)}</p>`;
    if (t.length <= 55) return `<p class="line">${esc(t)}</p>`;
    return `<p class="body">${esc(t)}</p>`;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const ln = raw.replace(/\s+$/, "");
    if (ln.trim() === "[[SIGGRID]]") {
      flushFields(); flushSig();
      const rows = [];
      while (idx + 1 < lines.length && lines[idx + 1].trim() !== "[[/SIGGRID]]") { rows.push(lines[++idx]); }
      idx++; // lewati penanda penutup
      if (blankPending) { gap(); blankPending = false; }
      out.push(renderSigGrid(rows));
      continue;
    }
    if (ln.trim() === "") { flushFields(); flushSig(); blankPending = true; continue; }
    const anc = sigAnchor(ln);
    if (anc) {
      flushFields(); flushSig();
      if (blankPending) { gap(); blankPending = false; }
      pendingSig = { img: anc.img, names: [] };
      continue;
    }
    if (pendingSig) { pendingSig.names.push(ln.trim()); continue; }
    const fm = fieldMatch(ln);
    if (fm) {
      if (blankPending) { gap(); blankPending = false; }
      fieldRun.push(fm);
      continue;
    }
    flushFields();
    if (blankPending) { gap(); blankPending = false; }
    out.push(textLine(ln.trim()));
  }
  flushFields(); flushSig();
  return out.join("");
}

function printDoc(label, text, sig) {
  const sigMap = sig && typeof sig === "object" ? sig : { SIGN: sig };
  return printViaIframe(label, renderDocHtml(text, sigMap));
}

function fieldBase(s) {
  const p = s.perusahaan?.trim() || "[Nama Perusahaan Anda]";
  const kota = s.kota?.trim();
  const jabatan = s.jabatan?.trim() || "Petugas Penagihan";
  const tgl = fmtTgl(today0().toISOString().slice(0, 10));
  return { p, jabatan, ttdKota: `${kota ? kota + ", " : ""}${tgl}` };
}
function suratPernyataan(i, s, f) {
  const { p, ttdKota } = fieldBase(s);
  return `SURAT PERNYATAAN KESANGGUPAN PEMBAYARAN

Yang bertanda tangan di bawah ini:
Nama   : ${i.customer}
Alamat : ${i.alamat || "-"}

Dengan ini menyatakan dengan sebenarnya bahwa saya memiliki kewajiban pembayaran kepada ${p} atas:
No. Tagihan     : ${i.noInvoice}
Total Kewajiban : ${rp(i.total)}

Saya menyatakan SANGGUP menyelesaikan kewajiban tersebut sebesar ${rp(f.jumlah || i.total)} selambat-lambatnya pada tanggal ${fmtTgl(f.tgl)}.

Apabila saya tidak memenuhi pernyataan ini, saya bersedia menanggung segala konsekuensi sesuai ketentuan perjanjian dan peraturan yang berlaku.

Demikian pernyataan ini saya buat dengan sadar dan tanpa paksaan dari pihak manapun.

${ttdKota}
Yang Menyatakan,

[[SIGN]]
${i.customer}`;
}
function bastPenarikan(i, s, f) {
  const { p, jabatan, ttdKota } = fieldBase(s);
  return `BERITA ACARA SERAH TERIMA OBJEK JAMINAN

Pada hari ini, ${ttdKota}, telah dilakukan serah terima objek jaminan antara:

Pihak Pertama (yang menyerahkan):
Nama   : ${i.customer}
Alamat : ${i.alamat || "-"}

Pihak Kedua (yang menerima):
Nama   : ${p}

Objek jaminan yang diserahterimakan:
${i.jaminan || "(uraian objek jaminan)"}

Kondisi / kelengkapan:
${f.kondisi || "-"}

Sehubungan dengan kewajiban atas ${i.noInvoice} sebesar ${rp(i.total)} yang belum diselesaikan, Pihak Pertama menyerahkan objek jaminan di atas kepada Pihak Kedua secara sukarela untuk diproses sesuai ketentuan yang berlaku.

Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.

${ttdKota}

[[SIGGRID]]
cap|Pihak Pertama (yang menyerahkan),|Pihak Kedua (yang menerima),
sig|SIGN1|SIGN2
name|${i.customer}|${p}
name||${jabatan}
[[/SIGGRID]]`;
}
function momKunjungan(i, s, f) {
  const { p, jabatan, ttdKota } = fieldBase(s);
  const petugas = (s.petugasAktif && s.petugasAktif.trim()) || jabatan;
  const ar = i.sisaPokok ?? i.nominal;
  return `MINUTES OF MEETING (MOM) — BERITA ACARA KUNJUNGAN

Hari / Tanggal : ${ttdKota}
Perihal        : Kunjungan penagihan & pembahasan penyelesaian kewajiban

A. PARA PIHAK
1. Pihak Penagih : ${petugas} — ${p}
2. Pihak Debitur : ${i.customer}${i.pic ? ` (PIC: ${i.pic})` : ""}
   Alamat        : ${i.alamat || "-"}

B. DATA KEWAJIBAN
No. Tagihan     : ${i.noInvoice}
AR / Pokok      : ${rp(ar)}
Denda           : ${rp(i.denda)}
Total Kewajiban : ${rp(i.total)}
Jatuh Tempo     : ${fmtTgl(i.tglJatuhTempo)}${i.daysOverdue > 0 ? ` (telat ${i.daysOverdue} hari)` : ""}

C. HASIL PEMBAHASAN
1. Konfirmasi posisi tunggakan saat kunjungan — AR/pokok ${rp(ar)} + denda ${rp(i.denda)} = total kewajiban ${rp(i.total)}.${f.pembahasan ? "\n" + f.pembahasan : ""}

D. KESEPAKATAN / TINDAK LANJUT
${f.kesepakatan || "-"}${f.tgl ? `\n\nTarget penyelesaian : ${fmtTgl(f.tgl)}` : ""}

Demikian berita acara kunjungan ini dibuat dengan sebenarnya dan disetujui oleh kedua belah pihak tanpa adanya paksaan, untuk dipergunakan sebagaimana mestinya.

${ttdKota}

[[SIGGRID]]
cap|Pihak Debitur,|Pihak Penagih,
sig|SIGN1|SIGN2
name|${i.customer}|${petugas}
name||${p}
[[/SIGGRID]]`;
}

function printLetter(label, text) {
  return printViaIframe(label, renderDocHtml(text, {}));
}

function exportExcel(rows, s) {
  const jl = { fidusia: "BPKB/Fidusia", tanah: "Tanah/Hak Tanggungan", lainnya: "Lainnya" };
  const data = rows.map((i) => ({
    Customer: i.customer,
    Tipe: isPerorangan(i) ? "Perorangan" : "Perusahaan",
    "No. Invoice": i.noInvoice,
    "Jatuh Tempo": i.tglJatuhTempo,
    "Telat (hari)": i.daysOverdue,
    Pokok: i.nominal,
    Denda: i.denda,
    Total: i.total,
    Status: stLabel(i.status),
    Kolektibilitas: i.kol ? i.kol.label : "",
    Petugas: i.assignedTo || "",
    PIC: i.pic || "",
    "No. WA": i.telp || "",
    Alamat: i.alamat || "",
    "Jenis Jaminan": jl[i.jaminanTipe] || "-",
    Jaminan: i.jaminan || "",
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [24, 11, 16, 12, 10, 14, 12, 14, 15, 22, 12, 16, 13, 28, 16, 28].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws, "Daftar Tagihan");
  const aktif = rows.filter((i) => i.status !== "lunas");
  const ringkas = [
    ["Ringkasan Piutang — " + (s.perusahaan || "Kolekta"), ""],
    ["Total piutang aktif", aktif.reduce((a, i) => a + i.total, 0)],
    ["Total overdue", aktif.filter((i) => i.daysOverdue > 0).reduce((a, i) => a + i.total, 0)],
    ["Jumlah invoice aktif", aktif.length],
    ["Tanggal export", new Date().toLocaleString("id-ID")],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ringkas);
  ws2["!cols"] = [{ wch: 32 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan");
  XLSX.writeFile(wb, `Kolekta_Tagihan_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ---------- Statement of Account per debitur ---------- */
function statementText(name, list, s) {
  const p = s.perusahaan?.trim() || "[Nama Perusahaan Anda]";
  const kota = s.kota?.trim();
  const tgl = fmtTgl(today0().toISOString().slice(0, 10));
  const rows = list.filter((i) => i.customer.trim().toLowerCase() === name.trim().toLowerCase());
  const totOut = rows.filter((i) => i.status !== "lunas").reduce((a, i) => a + i.total, 0);
  const totBayar = rows.reduce((a, i) => a + (i.terbayar || 0), 0);
  const lines = rows.map((i) =>
    `- ${i.noInvoice} | JT ${fmtTgl(i.tglJatuhTempo)} | Pokok ${rp(i.nominal)} | Dibayar ${rp(i.terbayar || 0)} | Sisa+denda ${rp(i.total)} | ${stLabel(i.status)}`
  ).join("\n");
  return `STATEMENT OF ACCOUNT
${p}${kota ? " — " + kota : ""}
Per ${tgl}

Debitur : ${name}
Jumlah invoice : ${rows.length}

RINCIAN TAGIHAN
${lines || "-"}

RINGKASAN
Total dibayar      : ${rp(totBayar)}
Total outstanding  : ${rp(totOut)}

Dokumen ini merupakan ringkasan posisi tagihan per tanggal di atas.
— Dibuat via Kolekta`;
}

/* ---------- Backup JSON ---------- */
function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Kolekta_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Sinkron Supabase (REST) ---------- */
const cloudBase = (cfg) => `${(cfg.cloudUrl || "").replace(/\/$/, "")}/rest/v1/kolekta_state`;
async function cloudPush(state, cfg) {
  const r = await fetch(cloudBase(cfg), {
    method: "POST",
    headers: { apikey: cfg.cloudKey, Authorization: `Bearer ${cfg.cloudKey}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: cfg.cloudId, data: state, updated_at: new Date().toISOString() }]),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  return true;
}
async function cloudPull(cfg) {
  const r = await fetch(`${cloudBase(cfg)}?id=eq.${encodeURIComponent(cfg.cloudId)}&select=data,updated_at`, {
    headers: { apikey: cfg.cloudKey, Authorization: `Bearer ${cfg.cloudKey}` },
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 120)}`);
  const j = await r.json();
  return j[0] || null;
}

/* ---------- Backend Kolekta (Supabase RPC, multi-tenant) ----------
   Semua akses data lewat fungsi security-definer di server, jadi anon key
   tak bisa membaca/menulis data institusi lain — hanya yang kodenya diketahui. */
const SB_URL = "https://jldswqktlywjjyjomthw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZHN3cWt0bHl3amp5am9tdGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MzQzMTcsImV4cCI6MjA5NzUxMDMxN30.g16gAXfNXUFoiSN2gooHwWoFdgFPRbR19OWtxmB-TLQ";
const AUTH_KEY = "kolekta:auth";

async function sbRpc(fn, body) {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const txt = await r.text();
  if (!r.ok) {
    let msg = txt;
    try { msg = JSON.parse(txt).message || txt; } catch {}
    throw new Error((msg || `${r.status}`).slice(0, 160));
  }
  return txt ? JSON.parse(txt) : null;
}
const sbLogin = async (code) => { const a = await sbRpc("kolekta_login", { p_code: code }); return a && a[0] ? a[0] : null; };
const sbPull = async (code) => { const a = await sbRpc("kolekta_pull", { p_code: code }); return a && a[0] ? a[0] : null; };
const sbPush = (code, data) => sbRpc("kolekta_push", { p_code: code, p_data: data });
const sbAdminCreate = async (secret, name, atasanCode, petugasCode) => {
  const body = { p_admin: secret, p_name: name };
  if (atasanCode && atasanCode.trim()) body.p_atasan_code = atasanCode.trim();
  if (petugasCode && petugasCode.trim()) body.p_petugas_code = petugasCode.trim();
  const a = await sbRpc("kolekta_admin_create_tenant", body);
  return a && a[0] ? a[0] : null;
};
const sbAdminList = async (secret) => (await sbRpc("kolekta_admin_list_tenants", { p_admin: secret })) || [];
const sbAdminDelete = (secret, tenantId) => sbRpc("kolekta_admin_delete_tenant", { p_admin: secret, p_tenant_id: tenantId });

function loadAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; } }
function saveAuth(a) { try { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); } catch {} }
function clearAuth() { try { localStorage.removeItem(AUTH_KEY); } catch {} }

/* ---------- Import Excel/CSV ---------- */
function pickv(row, names) {
  const keys = Object.keys(row);
  for (const n of names) {
    const k = keys.find((k) => k.trim().toLowerCase() === n);
    if (k != null && row[k] !== "" && row[k] != null) return row[k];
  }
  return "";
}
function toISO(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const d = new Date(v);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return "";
}
function parseImportRows(rows) {
  const out = [];
  for (const row of rows) {
    const customer = String(pickv(row, ["customer", "nama", "nama debitur", "customer / perusahaan", "debitur"])).trim();
    const nominal = Number(String(pickv(row, ["pokok", "nominal", "jumlah", "tagihan"])).replace(/[^0-9]/g, ""));
    const tgl = toISO(pickv(row, ["jatuh tempo", "tanggal jatuh tempo", "jt", "due"]));
    if (!customer || !(nominal > 0) || !tgl) continue;
    const tipe = String(pickv(row, ["tipe", "jenis"])).toLowerCase().includes("peroran") ? "perorangan" : "perusahaan";
    const jjRaw = String(pickv(row, ["jenis jaminan"])).toLowerCase();
    const jaminan = String(pickv(row, ["jaminan", "uraian jaminan"])).trim();
    let jaminanTipe = "none";
    if (jjRaw.includes("fidusia") || jjRaw.includes("bpkb")) jaminanTipe = "fidusia";
    else if (jjRaw.includes("tanah") || jjRaw.includes("tanggungan")) jaminanTipe = "tanah";
    else if (jaminan) jaminanTipe = "lainnya";
    const stRaw = String(pickv(row, ["status"])).toLowerCase();
    let status = "belum_dihubungi";
    if (stRaw.includes("lunas")) status = "lunas";
    else if (stRaw.includes("janji")) status = "janji_bayar";
    else if (stRaw.includes("ingkar")) status = "ingkar_janji";
    else if (stRaw.includes("follow")) status = "sudah_followup";
    out.push({
      id: uid(), customer,
      noInvoice: String(pickv(row, ["no. invoice", "no invoice", "invoice", "no"]) || "IMP-" + uid().slice(0, 4).toUpperCase()).trim(),
      nominal, tglJatuhTempo: tgl, tipe,
      alamat: String(pickv(row, ["alamat"])).trim(),
      pic: String(pickv(row, ["pic", "kontak"])).trim(),
      telp: String(pickv(row, ["no. wa", "no wa", "wa", "telp", "telepon", "hp"])).trim(),
      assignedTo: String(pickv(row, ["petugas", "kolektor", "collector"])).trim(),
      jaminanTipe, jaminan,
      status, lastFollowUp: null, janjiBayar: null, pembayaran: [], eskalasi: [], aktivitas: [], dibuat: today0().toISOString().slice(0, 10),
    });
  }
  return out;
}

/* ---------- Sample data (hanya saat pertama kali) ---------- */
const sampleData = () => {
  const t = today0();
  const d = (off) => { const x = new Date(t); x.setDate(x.getDate() + off); return x.toISOString().slice(0, 10); };
  return {
    settings: { perusahaan: "", kota: "", jabatan: "Bagian Penagihan / Kuasa Hukum", dendaRatePct: 0.1, followUpDays: 7, tema: "hutan", gelap: false, cloudUrl: "", cloudKey: "", cloudId: "", peran: "atasan", petugasAktif: "", petugas: ["Andi", "Rudi"], targets: { Andi: 50000000, Rudi: 50000000 } },
    invoices: [
      { id: uid(), customer: "PT Karya Bangun Persada", tipe: "perusahaan", assignedTo: "Andi", alamat: "Jl. Industri Raya No. 12, Surabaya", noInvoice: "INV-2026-0188", nominal: 145000000, tglJatuhTempo: d(-42), status: "belum_dihubungi", lastFollowUp: null, janjiBayar: null, jaminanTipe: "none", jaminan: "", aktivitas: [], dibuat: d(-72) },
      { id: uid(), customer: "Budi Santoso", tipe: "perorangan", assignedTo: "Andi", alamat: "Perum Griya Asri Blok C-7, Gresik", noInvoice: "INV-2026-0203", nominal: 38500000, tglJatuhTempo: d(-23), status: "belum_dihubungi", lastFollowUp: null, janjiBayar: null, jaminanTipe: "fidusia", jaminan: "BPKB Toyota Avanza tahun 2021, Nopol W 1234 ABC a.n. Budi Santoso", pic: "Budi Santoso", telp: "081234567890", pembayaran: [{ ts: d(-5), jumlah: 10000000 }], eskalasi: [{ ts: d(-1), level: "tegas" }], aktivitas: [], dibuat: d(-39) },
      { id: uid(), customer: "PT Graha Janto Dua", tipe: "perusahaan", assignedTo: "Rudi", alamat: "Jl. Gatot Subroto Kav. 5, Jakarta Selatan", noInvoice: "INV-2026-0171", nominal: 92000000, tglJatuhTempo: d(-21), status: "sudah_followup", lastFollowUp: d(-12), janjiBayar: null, jaminanTipe: "none", jaminan: "", aktivitas: [{ ts: d(-12), waktu: new Date().toISOString(), note: "Kunjungan ke kantor, minta dikejar approval.", lok: { lat: -6.2349, lng: 106.8186, acc: 18 } }], dibuat: d(-51) },
      { id: uid(), customer: "Siti Rahmawati", tipe: "perorangan", assignedTo: "Rudi", alamat: "Jl. Diponegoro No. 88, Malang", noInvoice: "INV-2026-0199", nominal: 61000000, tglJatuhTempo: d(-72), status: "janji_bayar", lastFollowUp: d(-3), janjiBayar: d(-1), jaminanTipe: "tanah", jaminan: "Sertifikat Hak Milik No. 1234/Klojen, Malang", pic: "Siti Rahmawati", telp: "081298765432", eskalasi: [{ ts: d(-2), level: "somasi" }], aktivitas: [{ ts: d(-3), waktu: new Date().toISOString(), note: "Kunjungan rumah, janji transfer paling lambat kemarin.", lok: { lat: -7.9785, lng: 112.6210, acc: 22 } }], dibuat: d(-95) },
      { id: uid(), customer: "CV Sentosa Material", tipe: "perusahaan", assignedTo: "Andi", alamat: "Jl. Raya Driyorejo No. 21, Gresik", noInvoice: "INV-2026-0210", nominal: 27500000, tglJatuhTempo: d(6), status: "belum_dihubungi", lastFollowUp: null, janjiBayar: null, jaminanTipe: "none", jaminan: "", aktivitas: [], dibuat: d(-24) },
      { id: uid(), customer: "PT Wahana Lentera", tipe: "perusahaan", assignedTo: "Rudi", alamat: "Jl. Mayjen Sungkono No. 3, Surabaya", noInvoice: "INV-2026-0150", nominal: 54000000, tglJatuhTempo: d(-30), status: "lunas", lastFollowUp: d(-8), janjiBayar: null, jaminanTipe: "none", jaminan: "", pembayaran: [{ ts: d(-8), jumlah: 54000000 }], aktivitas: [{ ts: d(-8), note: "Sudah transfer penuh + denda." }], dibuat: d(-60) },
    ],
  };
};

const KEY = "kolekta:v1";
const defaultSettings = () => ({ perusahaan: "", kota: "", jabatan: "Bagian Penagihan / Kuasa Hukum", dendaRatePct: 0.1, followUpDays: 7, tema: "hutan", gelap: false, peran: "atasan", petugasAktif: "", petugas: [], targets: {} });
const emptyData = () => ({ settings: defaultSettings(), invoices: [] });

/* ---------- Logo ---------- */
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Kolekta" role="img">
      <defs>
        <linearGradient id="kg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor={T.brand2} /><stop offset="1" stopColor={T.brand} />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#kg)" />
      <path d="M17 13 V35" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M17 25 L31 13" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M28.5 13 H32 V16.5" stroke={T.brass} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 25 L30 35" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx="33.5" cy="33.5" r="3" fill={T.brass} />
    </svg>
  );
}

function Pill({ status }) {
  const c = stColor(status);
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c + "1A", color: c }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{stLabel(status)}
    </span>
  );
}

export default function KolektaApp() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("hari");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showLaporan, setShowLaporan] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [fStatus, setFStatus] = useState("all");
  const [fTipe, setFTipe] = useState("all");
  const [fJaminan, setFJaminan] = useState("all");
  const [fPetugas, setFPetugas] = useState("all");
  const [sortBy, setSortBy] = useState("overdue");
  const [toast, setToast] = useState("");
  const [auth, setAuth] = useState(loadAuth);
  const loadedRef = useRef(false);
  const pushTimer = useRef(null);

  /* load (per institusi, setelah login) */
  useEffect(() => {
    if (!auth) { setData(null); loadedRef.current = false; return; }
    let alive = true;
    loadedRef.current = false;
    setData(null);
    (async () => {
      let next = null;
      try { const row = await sbPull(auth.code); if (row && row.data) next = row.data; } catch {}
      if (!next) { try { const r = await window.storage.get(KEY + ":" + auth.tenantId); if (r && r.value) next = JSON.parse(r.value); } catch {} }
      if (!next) next = emptyData();
      next.settings = { ...defaultSettings(), ...next.settings, peran: auth.role };
      if (!alive) return;
      setData(next);
      loadedRef.current = true;
    })();
    return () => { alive = false; };
  }, [auth]);

  /* persist: cache lokal langsung + push ke server (debounce) */
  useEffect(() => {
    if (!loadedRef.current || !data || !auth) return;
    (async () => { try { await window.storage.set(KEY + ":" + auth.tenantId, JSON.stringify(data)); } catch {} })();
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      sbPush(auth.code, data).catch(() => { setToast("Gagal sinkron ke server — tersimpan lokal"); setTimeout(() => setToast(""), 2500); });
    }, 1200);
  }, [data, auth]);

  const doLogin = async (code) => {
    const info = await sbLogin(code);
    if (!info) throw new Error("Kode tidak dikenal");
    const session = { code, tenantId: info.tenant_id, name: info.name, role: info.role };
    saveAuth(session);
    setAuth(session);
    return session;
  };
  const doLogout = () => { if (pushTimer.current) clearTimeout(pushTimer.current); clearAuth(); setAuth(null); setData(null); setTab("hari"); };

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 1800); };
  const s = data?.settings;

  const allEnriched = useMemo(() => (data ? data.invoices.map((i) => enrich(i, s)) : []), [data, s]);
  const enriched = useMemo(
    () => (s?.peran === "petugas" && s?.petugasAktif ? allEnriched.filter((i) => i.assignedTo === s.petugasAktif) : allEnriched),
    [allEnriched, s]
  );

  const stats = useMemo(() => {
    const aktif = enriched.filter((i) => i.status !== "lunas");
    const overdue = aktif.filter((i) => i.daysOverdue > 0);
    return {
      totalPiutang: aktif.reduce((a, i) => a + i.total, 0),
      totalOverdue: overdue.reduce((a, i) => a + i.total, 0),
      nOverdue: overdue.length,
      nAktif: aktif.length,
    };
  }, [enriched]);

  const panels = useMemo(() => {
    const belum = enriched.filter((i) => i.status === "belum_dihubungi" && i.daysOverdue > 0);
    const belumIds = new Set(belum.map((i) => i.id));
    const perlu = enriched.filter(
      (i) =>
        !belumIds.has(i.id) && i.status !== "lunas" && i.status !== "belum_dihubungi" &&
        ((i.lastFollowUp && daysSince(i.lastFollowUp) >= (s?.followUpDays || 7)) ||
          (i.janjiBayar && new Date(i.janjiBayar) < today0()))
    );
    const sortP = (arr) => [...arr].sort((a, b) => b.prioScore - a.prioScore);
    const tindak = enriched.filter((i) => i.status !== "lunas" && (i.ptpLewat || i.tlDue));
    return { belum: sortP(belum), perlu: sortP(perlu), tindak: sortP(tindak) };
  }, [enriched, s]);

  const aging = useMemo(() => {
    const b = { lancar: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    enriched.forEach((i) => { if (i.status !== "lunas") b[i.bucket] += i.total; });
    return b;
  }, [enriched]);

  const prioritas = useMemo(
    () => [...enriched].filter((i) => i.status !== "lunas")
      .sort((a, b) => b.prioScore - a.prioScore),
    [enriched]
  );

  const analytics = useMemo(() => {
    const mk = (iso) => (iso || "").slice(0, 7);
    const aktif = enriched.filter((i) => i.status !== "lunas" && i.total > 0);
    const outstanding = aktif.reduce((a, i) => a + i.total, 0);
    const overdueAmt = aktif.filter((i) => i.daysOverdue > 0).reduce((a, i) => a + i.total, 0);
    const wsum = aktif.reduce((a, i) => a + i.total * dayDiff(today0(), new Date((i.dibuat || i.tglJatuhTempo) + "T00:00:00")), 0);
    const dso = outstanding ? Math.round(wsum / outstanding) : 0;
    const now = new Date();
    const months = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }), baru: 0, tertagih: 0 });
    }
    const idx = Object.fromEntries(months.map((m, n) => [m.key, n]));
    enriched.forEach((i) => {
      if (mk(i.dibuat) in idx) months[idx[mk(i.dibuat)]].baru += i.nominal;
      (i.pembayaran || []).forEach((p) => { if (mk(p.ts) in idx) months[idx[mk(p.ts)]].tertagih += p.jumlah; });
    });
    const tm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const tertagihBulanIni = enriched.reduce((a, i) => a + (i.pembayaran || []).filter((p) => mk(p.ts) === tm).reduce((x, p) => x + p.jumlah, 0), 0);
    const agingPie = [
      { name: "Lancar", value: aging.lancar, tone: "green" },
      { name: "1–30", value: aging["1-30"], tone: "amber" },
      { name: "31–60", value: aging["31-60"], tone: "amber" },
      { name: "61–90", value: aging["61-90"], tone: "red" },
      { name: "90+", value: aging["90+"], tone: "red" },
    ].filter((x) => x.value > 0);
    const pctOverdue = outstanding ? Math.round((overdueAmt / outstanding) * 100) : 0;
    const kolDefs = [[1, "Lancar", "green"], [2, "DPK", "amber"], [3, "Kurang Lancar", "amber"], [4, "Diragukan", "red"], [5, "Macet", "red"]];
    const kolBreak = kolDefs.map(([no, label, tone]) => {
      const grp = aktif.filter((i) => i.kol?.no === no);
      return { no, label, tone, amount: grp.reduce((a, i) => a + i.total, 0), count: grp.length };
    });
    const macet = kolBreak.filter((k) => k.no >= 3).reduce((a, k) => a + k.amount, 0);
    const tISO = today0().toISOString().slice(0, 10);
    const fuToday = enriched.filter((i) => i.lastFollowUp === tISO).length;
    const payToday = enriched.reduce((a, i) => a + (i.pembayaran || []).filter((p) => p.ts === tISO).reduce((x, p) => x + p.jumlah, 0), 0);
    const payTodayN = enriched.reduce((a, i) => a + (i.pembayaran || []).filter((p) => p.ts === tISO).length, 0);
    const eskToday = enriched.reduce((a, i) => a + (i.eskalasi || []).filter((e) => e.ts === tISO).length, 0);
    return { outstanding, overdueAmt, dso, months, tertagihBulanIni, agingPie, pctOverdue, fuToday, payToday, payTodayN, eskToday, kolBreak, macet, ptp: ptpStat(enriched) };
  }, [enriched, aging]);

  const tim = useMemo(() => {
    const mk = (iso) => (iso || "").slice(0, 7);
    const now = new Date();
    const tm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const collected = (list) => list.reduce((a, i) => a + (i.pembayaran || []).filter((p) => mk(p.ts) === tm).reduce((x, p) => x + p.jumlah, 0), 0);
    const names = [...(s?.petugas || [])];
    const groups = names.map((nm) => {
      const list = allEnriched.filter((i) => i.assignedTo === nm);
      const aktif = list.filter((i) => i.status !== "lunas");
      const tertagihBulan = collected(list);
      const target = Number((s?.targets || {})[nm]) || 0;
      return { nama: nm, akun: aktif.length, outstanding: aktif.reduce((a, i) => a + i.total, 0), ptp: ptpStat(list), tertagihBulan, target, pct: target ? Math.round((tertagihBulan / target) * 100) : null };
    });
    const belum = allEnriched.filter((i) => !i.assignedTo);
    if (belum.length) groups.push({ nama: "Belum ditugaskan", akun: belum.filter((i) => i.status !== "lunas").length, outstanding: belum.filter((i) => i.status !== "lunas").reduce((a, i) => a + i.total, 0), ptp: ptpStat(belum), tertagihBulan: collected(belum), target: 0, pct: null, unassigned: true });
    return groups;
  }, [allEnriched, s]);

  const leaderboard = useMemo(
    () => tim.filter((t) => !t.unassigned).sort((a, b) => b.tertagihBulan - a.tertagihBulan),
    [tim]
  );

  const laporanText = useMemo(() => {
    const tgl = fmtTgl(today0().toISOString().slice(0, 10));
    const a = analytics;
    const top = prioritas.slice(0, 5).map((i, n) => `${n + 1}. ${i.customer} — ${rp(i.total)} (telat ${i.daysOverdue} hari)`).join("\n") || "-";
    return `LAPORAN PENAGIHAN — ${tgl}
${s?.perusahaan || "Kolekta"}

RINGKASAN
- Piutang aktif    : ${rp(a.outstanding)} (${stats.nAktif} invoice)
- Overdue          : ${rp(a.overdueAmt)} (${stats.nOverdue} invoice, ${a.pctOverdue}%)
- DSO              : ~${a.dso} hari
- Tertagih bln ini : ${rp(a.tertagihBulanIni)}

KOLEKTIBILITAS (OJK)
${a.kolBreak.map((k) => `- Kol ${k.no} ${k.label.padEnd(13)}: ${rp(k.amount)} (${k.count})`).join("\n")}
- Bermasalah (Kol 3-5): ${rp(a.macet)}

PERLU TINDAK LANJUT
- Belum dihubungi     : ${panels.belum.length}
- Perlu ditagih ulang : ${panels.perlu.length}

PRIORITAS TERATAS
${top}

AKTIVITAS HARI INI
- Follow-up dilakukan  : ${a.fuToday}
- Pembayaran masuk     : ${rp(a.payToday)} (${a.payTodayN} transaksi)
- Surat/eskalasi kirim : ${a.eskToday}

— Dibuat via Kolekta`;
  }, [analytics, panels, prioritas, stats, s]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = enriched;
    if (q) arr = arr.filter((i) => i.customer.toLowerCase().includes(q) || i.noInvoice.toLowerCase().includes(q));
    if (fStatus !== "all") arr = arr.filter((i) => i.status === fStatus);
    if (fTipe !== "all") arr = arr.filter((i) => (i.tipe || "perusahaan") === fTipe);
    if (fJaminan === "ada") arr = arr.filter((i) => i.jaminanTipe && i.jaminanTipe !== "none");
    else if (fJaminan === "tanpa") arr = arr.filter((i) => !i.jaminanTipe || i.jaminanTipe === "none");
    if (fPetugas !== "all") arr = arr.filter((i) => (fPetugas === "_none" ? !i.assignedTo : i.assignedTo === fPetugas));
    const sorters = {
      prioritas: (a, b) => b.prioScore - a.prioScore,
      overdue: (a, b) => b.odRaw - a.odRaw,
      nominal: (a, b) => b.total - a.total,
      jt: (a, b) => new Date(a.tglJatuhTempo) - new Date(b.tglJatuhTempo),
      baru: (a, b) => new Date(b.dibuat || 0) - new Date(a.dibuat || 0),
    };
    return [...arr].sort((a, b) => {
      if (a.status === "lunas" && b.status !== "lunas") return 1;
      if (b.status === "lunas" && a.status !== "lunas") return -1;
      return (sorters[sortBy] || sorters.overdue)(a, b);
    });
  }, [enriched, query, fStatus, fTipe, fJaminan, fPetugas, sortBy]);

  const agenda = useMemo(() => {
    const aktif = enriched.filter((i) => i.status !== "lunas");
    const due7 = aktif.filter((i) => i.odRaw >= -7 && i.odRaw <= 0).sort((a, b) => new Date(a.tglJatuhTempo) - new Date(b.tglJatuhTempo));
    const janji = aktif.filter((i) => i.janjiBayar).sort((a, b) => new Date(a.janjiBayar) - new Date(b.janjiBayar));
    return { due7, janji };
  }, [enriched]);

  /* mutations */
  const patch = (id, fn) =>
    setData((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === id ? fn(i) : i)) }));
  const remove = (id) => setData((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) }));
  const addInvoice = (inv) => setData((d) => ({ ...d, invoices: [{ ...inv, id: uid(), aktivitas: [], lastFollowUp: null, janjiBayar: null, pembayaran: [], eskalasi: [], dibuat: today0().toISOString().slice(0, 10) }, ...d.invoices] }));
  const addMany = (arr) => setData((d) => ({ ...d, invoices: [...arr, ...d.invoices] }));

  const fileRef = useRef(null);
  const jsonRef = useRef(null);
  const onImportFile = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { raw: true, defval: "" });
      const inv = parseImportRows(rows);
      if (inv.length === 0) { flash("Tidak ada baris valid (cek kolom Customer/Nominal/Jatuh Tempo)"); return; }
      addMany(inv); flash(`${inv.length} tagihan diimpor`);
    } catch { flash("Gagal membaca file"); }
  };
  const onImportJSON = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const obj = JSON.parse(await file.text());
      if (!obj || !Array.isArray(obj.invoices)) throw new Error();
      obj.settings = { ...data.settings, ...(obj.settings || {}) };
      setData(obj); flash("Backup dipulihkan");
    } catch { flash("File backup tidak valid"); }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); flash("Tersalin ke clipboard"); }
    catch { flash("Tidak bisa menyalin di sini"); }
  };

  if (!auth) return <LoginScreen onLogin={doLogin} />;

  if (!data)
    return <div className="flex h-screen items-center justify-center" style={{ background: T.bg, color: T.sub, fontFamily: SANS }}>Memuat Kolekta…</div>;

  T = themePalette(data.settings.tema, data.settings.gelap);

  const TabBtn = ({ id, icon: Icon, label, badge }) => {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)}
        className="kpress relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors"
        style={{ background: active ? T.brand : "transparent", color: active ? "#fff" : T.sub }}>
        <Icon size={16} className="shrink-0" /><span className="hidden truncate sm:inline">{label}</span><span className="truncate sm:hidden">{label.split(" ")[0]}</span>
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full px-1 text-[11px] font-bold leading-[18px]"
            style={{ background: T.brass, color: "#fff" }}>{badge}</span>
        )}
      </button>
    );
  };

  const SideBtn = ({ id, icon: Icon, label, badge }) => {
    const active = tab === id;
    return (
      <button onClick={() => setTab(id)}
        className="kpress flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/5"
        style={active ? { background: T.brand, color: "#fff" } : { color: T.sub }}>
        <Icon size={18} /><span>{label}</span>
        {badge > 0 && (
          <span className="ml-auto min-w-[20px] rounded-full px-1.5 text-center text-xs font-bold leading-5"
            style={{ background: active ? "#FFFFFF33" : T.brass, color: "#fff" }}>{badge}</span>
        )}
      </button>
    );
  };

  const myTarget = s.peran === "petugas" ? tim.find((t) => t.nama === s.petugasAktif) : null;
  const sideSummary = (
    <div className="mt-4 px-3">
      <div className="rounded-xl p-3" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: T.sub }}>Ringkasan</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Piutang aktif</span>
            <span className="text-xs font-bold" style={{ fontFamily: MONO }}>{rpc(stats.totalPiutang)}</span>
          </div>
          <button onClick={() => { setTab("tagihan"); setDrawer(false); }} className="flex w-full items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Overdue</span>
            <span className="text-xs font-bold" style={{ color: stats.nOverdue ? T.red : T.sub, fontFamily: MONO }}>{stats.nOverdue}</span>
          </button>
          <button onClick={() => { setTab("hari"); setDrawer(false); }} className="flex w-full items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Tindak lanjut hari ini</span>
            <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: panels.tindak.length ? T.red + "1A" : "transparent", color: panels.tindak.length ? T.red : T.sub, fontFamily: MONO }}>{panels.tindak.length}</span>
          </button>
          <button onClick={() => { setTab("hari"); setDrawer(false); }} className="flex w-full items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Belum di-follow-up</span>
            <span className="rounded-full px-1.5 text-xs font-bold" style={{ background: panels.belum.length ? T.amber + "1A" : "transparent", color: panels.belum.length ? T.amber : T.sub, fontFamily: MONO }}>{panels.belum.length}</span>
          </button>
        </div>
        {myTarget && myTarget.target > 0 && (
          <div className="mt-3 border-t pt-2" style={{ borderColor: T.line }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: T.sub }}>Target bulan ini</span>
              <span className="text-[11px] font-bold" style={{ color: myTarget.pct >= 100 ? T.green : myTarget.pct >= 60 ? T.amber : T.red, fontFamily: MONO }}>{myTarget.pct}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: T.line }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, myTarget.pct)}%`, background: myTarget.pct >= 100 ? T.green : myTarget.pct >= 60 ? T.amber : T.red }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full" style={{ background: T.bg, color: T.ink, fontFamily: SANS }}>
      <style>{`
@keyframes kolektaIn{from{opacity:0;transform:translateY(6px) scale(.995)}to{opacity:1;transform:none}}
.tab-anim{animation:kolektaIn .28s cubic-bezier(.22,.61,.36,1)}
@keyframes kolektaFade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.sub-fade{animation:kolektaFade .2s cubic-bezier(.22,.61,.36,1)}
.kpress{transition:transform .09s ease}
.kpress:active{transform:scale(.96)}
@keyframes kolektaExpand{from{opacity:0;transform:translateY(-8px) scaleY(.97)}to{opacity:1;transform:none}}
.filter-anim{animation:kolektaExpand .26s cubic-bezier(.22,.61,.36,1);transform-origin:top}
.chip{transition:background-color .18s ease,color .18s ease,border-color .18s ease,transform .09s ease}
.chip:active{transform:scale(.94)}
@keyframes kolektaOv{from{opacity:0}to{opacity:1}}
@keyframes kolektaSlide{from{transform:translateX(-100%)}to{transform:none}}
.drawer-ov{animation:kolektaOv .2s ease}
.drawer-pn{animation:kolektaSlide .26s cubic-bezier(.2,.7,.2,1)}
@media (prefers-reduced-motion:reduce){.tab-anim,.drawer-ov,.drawer-pn,.sub-fade,.filter-anim{animation:none}.kpress:active,.chip:active{transform:none}}
      `}</style>
      <div className="lg:flex">
        {/* Sidebar (PC) */}
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-y-auto"
          style={{ background: T.surface, borderRight: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-3 p-5">
            <Logo size={38} />
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: T.brand }}>Kolekta</h1>
              <p className="text-[11px]" style={{ color: T.brass }}>collection control</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {NAV.map((n) => (
              <SideBtn key={n.id} id={n.id} icon={n.icon} label={n.label} badge={n.id === "hari" ? panels.belum.length + panels.perlu.length : 0} />
            ))}
            <button onClick={() => setShowCalc(true)}
              className="kpress flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-black/5" style={{ color: T.sub }}>
              <CalcIcon size={18} /><span>Kalkulator</span>
            </button>
          </nav>
          {sideSummary}
          <div className="mt-auto p-5">
            <span className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: T.brand2 + "1A", color: T.brand2 }}>
              {s.peran === "petugas" ? `Petugas: ${s.petugasAktif || "—"}` : "Mode: Atasan"}
            </span>
            <p className="text-[11px] leading-relaxed" style={{ color: T.sub }}>by <span style={{ color: T.brand2, fontWeight: 600 }}>KNSL</span><br />Kansil Network Solutions Labs</p>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-3xl px-3 pb-24 sm:px-5">
            {/* Header (HP) */}
            <header className="flex items-center gap-3 pt-5 lg:hidden">
          <button onClick={() => setDrawer(true)} className="flex flex-1 items-center gap-3 text-left">
            <Logo size={40} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: T.brand }}>Kolekta</h1>
                <span className="text-xs" style={{ color: T.brass }}>collection control</span>
              </div>
              <p className="truncate text-xs" style={{ color: T.sub }}>by <span style={{ color: T.brand2, fontWeight: 600 }}>KNSL</span> · Kansil Network Solutions Labs</p>
            </div>
          </button>
        </header>

        {/* Nav (HP) */}
        <nav className="sticky top-2 z-20 mt-4 flex gap-1 rounded-xl p-1 shadow-sm lg:hidden"
          style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          {NAV.filter((n) => n.id !== "set").map((n) => (
            <TabBtn key={n.id} id={n.id} icon={n.icon} label={n.label} badge={n.id === "hari" ? panels.belum.length + panels.perlu.length : 0} />
          ))}
        </nav>

        {/* Judul (PC) */}
        <div className="hidden pb-1 pt-7 lg:block">
          <h2 className="text-xl font-bold tracking-tight" style={{ color: T.ink }}>{NAV.find((n) => n.id === tab)?.label}</h2>
        </div>

        {/* Konten beranimasi */}
        <div key={tab} className="tab-anim">

        {/* ---------- HARI INI ---------- */}
        {tab === "hari" && (
          <div className="mt-4 space-y-4">
            {s.peran === "petugas" && (() => {
              const me = tim.find((t) => t.nama === s.petugasAktif);
              if (!me || !me.target) return null;
              const pct = me.pct;
              const col = pct >= 100 ? T.green : pct >= 60 ? T.amber : T.red;
              return (
                <div className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs" style={{ color: T.sub }}>Target tagih bulan ini</p>
                      <p className="text-lg font-bold" style={{ fontFamily: MONO }}>{rpc(me.tertagihBulan)} <span className="text-sm font-normal" style={{ color: T.sub }}>/ {rpc(me.target)}</span></p>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: col, fontFamily: MONO }}>{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: T.line }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: col }} />
                  </div>
                  <p className="mt-1.5 text-[11px]" style={{ color: T.sub }}>{pct >= 100 ? "Target tercapai 🎉" : `Kurang ${rpc(Math.max(0, me.target - me.tertagihBulan))} lagi menuju target.`}</p>
                </div>
              );
            })()}
            <button onClick={() => setShowLaporan((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-sm"
              style={{ background: T.surface, color: T.brand2, border: `1px solid ${T.line}` }}>
              <ClipboardList size={16} /> {showLaporan ? "Tutup laporan harian" : "Buat laporan harian"}
            </button>
            {showLaporan && (
              <div className="rounded-xl p-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold">Laporan untuk atasan</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => { if (!printLetter("Laporan Penagihan", laporanText)) flash("Popup diblokir — pakai Salin"); }}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white" style={{ background: T.brand2 }}><Printer size={12} /> PDF</button>
                    <button onClick={() => copy(laporanText)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white" style={{ background: T.brand }}><Copy size={12} /> Salin</button>
                  </div>
                </div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed" style={{ color: T.ink, fontFamily: MONO }}>{laporanText}</pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Total piutang aktif" value={rpc(stats.totalPiutang)} sub={`${stats.nAktif} invoice`} />
              <Stat label="Overdue" value={rpc(stats.totalOverdue)} sub={`${stats.nOverdue} invoice telat`} accent={T.red} />
              <Stat label="Belum dihubungi" value={String(panels.belum.length)} sub="perlu aksi" accent={T.amber} />
              <Stat label="Perlu ditagih ulang" value={String(panels.perlu.length)} sub="ngendap / ingkar" accent={T.brand2} />
            </div>

            <FollowPanel title="Perlu ditindaklanjuti hari ini" icon={Bell} color={T.red}
              empty="Tidak ada janji bayar lewat atau jadwal tindak lanjut yang jatuh tempo." items={panels.tindak}
              onOpen={(id) => { setTab("tagihan"); setOpenId(id); }} note />
            <FollowPanel title="Belum di-follow-up" icon={AlertTriangle} color={T.amber}
              empty="Semua yang overdue sudah kamu sentuh. Bagus." items={panels.belum}
              onOpen={(id) => { setTab("tagihan"); setOpenId(id); }} />
            <FollowPanel title="Perlu ditagih ulang" icon={Clock} color={T.brand2}
              empty={`Belum ada yang ngendap > ${s.followUpDays} hari.`} items={panels.perlu}
              onOpen={(id) => { setTab("tagihan"); setOpenId(id); }} note />

            {/* Agenda */}
            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <div className="mb-2 flex items-center gap-2">
                <CalendarClock size={16} style={{ color: T.brand2 }} />
                <h2 className="text-sm font-semibold">Agenda</h2>
              </div>
              <p className="mb-1 text-[11px] font-semibold" style={{ color: T.sub }}>Jatuh tempo dalam 7 hari</p>
              {agenda.due7.length === 0 ? (
                <p className="mb-2 text-xs" style={{ color: T.sub }}>Tidak ada yang jatuh tempo minggu ini.</p>
              ) : (
                <div className="mb-3 space-y-1.5">
                  {agenda.due7.map((i) => (
                    <button key={i.id} onClick={() => { setTab("tagihan"); setOpenId(i.id); }} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-black/5">
                      <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: T.amber + "1A", color: T.amber }}>{i.odRaw === 0 ? "hari ini" : `${-i.odRaw} hr lagi`}</span>
                      <span className="min-w-0 flex-1 truncate text-sm">{i.customer}</span>
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold" style={{ fontFamily: MONO }}>{rp(i.total)}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mb-1 text-[11px] font-semibold" style={{ color: T.sub }}>Janji bayar</p>
              {agenda.janji.length === 0 ? (
                <p className="text-xs" style={{ color: T.sub }}>Belum ada janji bayar tercatat.</p>
              ) : (
                <div className="space-y-1.5">
                  {agenda.janji.map((i) => {
                    const lewat = new Date(i.janjiBayar) < today0();
                    return (
                      <button key={i.id} onClick={() => { setTab("tagihan"); setOpenId(i.id); }} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-black/5">
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold" style={lewat ? { background: T.red + "1A", color: T.red } : { background: T.green + "1A", color: T.green }}>{lewat ? "lewat" : "akan datang"}</span>
                        <span className="min-w-0 flex-1 truncate text-sm">{i.customer}</span>
                        <span className="shrink-0 whitespace-nowrap text-xs" style={{ color: T.sub }}>{fmtTgl(i.janjiBayar).split(" ").slice(0, 2).join(" ")}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Aging */}
            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <h2 className="mb-3 text-sm font-semibold">Umur piutang (aging)</h2>
              {(() => {
                const order = [["lancar", "Lancar", T.green], ["1-30", "1–30 hari", T.amber], ["31-60", "31–60", T.amber], ["61-90", "61–90", T.red], ["90+", "90+ hari", T.red]];
                const max = Math.max(1, ...order.map(([k]) => aging[k]));
                return (
                  <div className="space-y-2">
                    {order.map(([k, lbl, c]) => (
                      <div key={k} className="flex items-center gap-3">
                        <span className="w-16 shrink-0 text-xs" style={{ color: T.sub }}>{lbl}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: T.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${(aging[k] / max) * 100}%`, background: c }} />
                        </div>
                        <span className="w-24 shrink-0 whitespace-nowrap text-right text-xs" style={{ fontFamily: MONO, color: T.ink }}>{rpc(aging[k])}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            {/* Prioritas */}
            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <h2 className="mb-1 text-sm font-semibold">Prioritas tagih</h2>
              <p className="mb-3 text-xs" style={{ color: T.sub }}>Skor cerdas: nilai × lama nunggak × janji ingkar × jaminan.</p>
              <div className="space-y-1.5">
                {prioritas.slice(0, 6).map((i, idx) => (
                  <button key={i.id} onClick={() => { setTab("tagihan"); setOpenId(i.id); }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/5">
                    <span className="w-5 text-center text-sm font-bold" style={{ color: T.brass, fontFamily: MONO }}>{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.customer}</p>
                      <p className="text-xs" style={{ color: T.sub }}>{i.noInvoice} · telat {i.daysOverdue} hari{i.ptpLewat ? " · ingkar janji" : ""}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold" style={{ fontFamily: MONO }}>{rp(i.total)}</p>
                      <p className="text-[10px] font-bold" style={{ color: T[i.prioTone] }}>{i.prioLabel} · {i.prioScore}</p>
                    </div>
                  </button>
                ))}
                {prioritas.length === 0 && <p className="py-2 text-sm" style={{ color: T.sub }}>Tidak ada tagihan aktif. 🎉</p>}
              </div>
            </section>
          </div>
        )}

        {/* ---------- TAGIHAN ---------- */}
        {tab === "tagihan" && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg px-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <Search size={16} style={{ color: T.sub }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari customer / no. invoice"
                  className="w-full bg-transparent py-2.5 text-sm outline-none" />
              </div>
              <button onClick={() => setShowFilter((v) => !v)}
                className="chip flex items-center gap-1 rounded-lg px-3 text-sm font-semibold shadow-sm"
                style={showFilter || fStatus !== "all" || fTipe !== "all" || fJaminan !== "all" ? { background: T.brand2, color: "#fff" } : { background: T.surface, color: T.brand2, border: `1px solid ${T.line}` }}><SlidersHorizontal size={16} style={{ transition: "transform .2s ease", transform: showFilter ? "rotate(90deg)" : "none" }} /></button>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 rounded-lg px-3 text-sm font-semibold shadow-sm"
                style={{ background: T.surface, color: T.brand2, border: `1px solid ${T.line}` }}><Upload size={16} /><span className="hidden sm:inline">Impor</span></button>
              <button onClick={() => { try { exportExcel(enriched, s); flash("Excel diunduh"); } catch { flash("Export gagal di lingkungan ini"); } }}
                className="flex items-center gap-1 rounded-lg px-3 text-sm font-semibold shadow-sm"
                style={{ background: T.surface, color: T.brand2, border: `1px solid ${T.line}` }}><FileSpreadsheet size={16} /><span className="hidden sm:inline">Excel</span></button>
              <button onClick={() => setShowAdd((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-3 text-sm font-semibold text-white shadow-sm"
                style={{ background: T.brand }}><Plus size={16} /><span className="hidden sm:inline">Tambah</span></button>
            </div>

            {showFilter && (
              <div className="filter-anim rounded-xl p-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Status</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {[["all", "Semua"], ...STATUS_ORDER.map((st) => [st, stLabel(st)])].map(([v, lbl]) => (
                    <button key={v} onClick={() => setFStatus(v)} className="chip rounded-full px-2.5 py-1 text-xs font-medium"
                      style={fStatus === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>{lbl}</button>
                  ))}
                </div>
                {s.peran === "atasan" && (s.petugas || []).length > 0 && (
                  <>
                    <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Petugas</p>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {[["all", "Semua"], ["_none", "Belum ditugaskan"], ...s.petugas.map((nm) => [nm, nm])].map(([v, lbl]) => (
                        <button key={v} onClick={() => setFPetugas(v)} className="chip rounded-full px-2.5 py-1 text-xs font-medium"
                          style={fPetugas === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>{lbl}</button>
                      ))}
                    </div>
                  </>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Tipe</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[["all", "Semua"], ["perusahaan", "PT/CV"], ["perorangan", "Perorangan"]].map(([v, lbl]) => (
                        <button key={v} onClick={() => setFTipe(v)} className="chip rounded-full px-2.5 py-1 text-xs font-medium"
                          style={fTipe === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Jaminan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[["all", "Semua"], ["ada", "Ada"], ["tanpa", "Tanpa"]].map(([v, lbl]) => (
                        <button key={v} onClick={() => setFJaminan(v)} className="chip rounded-full px-2.5 py-1 text-xs font-medium"
                          style={fJaminan === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>{lbl}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Urutkan</p>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputCls} style={inputSt}>
                      <option value="prioritas">Prioritas (skor cerdas)</option>
                      <option value="overdue">Paling overdue</option>
                      <option value="nominal">Nominal terbesar</option>
                      <option value="jt">Jatuh tempo terdekat</option>
                      <option value="baru">Terbaru ditambah</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => { setFStatus("all"); setFTipe("all"); setFJaminan("all"); setSortBy("overdue"); }}
                  className="mt-2 text-[11px] font-semibold" style={{ color: T.brand2 }}>Reset filter</button>
              </div>
            )}

            {showAdd && <AddForm petugas={s.petugas || []} defaultPetugas={s.peran === "petugas" ? s.petugasAktif : ""} onAdd={(inv) => { addInvoice(inv); setShowAdd(false); flash("Invoice ditambahkan"); }} onCancel={() => setShowAdd(false)} />}

            <div className="space-y-2">
              {filtered.map((i) => (
                <InvoiceCard key={i.id} i={i} s={s} open={openId === i.id}
                  onToggle={() => setOpenId(openId === i.id ? null : i.id)}
                  onStatement={(name) => { const t = statementText(name, enriched, s); if (printLetter("Statement " + name, t)) flash("Statement dibuat"); else { copy(t); flash("Popup diblokir — statement disalin"); } }}
                  patch={patch} remove={(id) => { remove(id); flash("Invoice dihapus"); }} copy={copy} flash={flash} />
              ))}
              {filtered.length === 0 && (
                <div className="rounded-xl py-12 text-center" style={{ background: T.surface, border: `1px dashed ${T.line}` }}>
                  <p className="text-sm font-medium">Belum ada tagihan</p>
                  <p className="mt-1 text-xs" style={{ color: T.sub }}>Tap “Tambah” untuk memasukkan invoice pertama.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------- ANALITIK ---------- */}
        {tab === "analitik" && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Piutang aktif" value={rpc(analytics.outstanding)} sub="outstanding" />
              <Stat label="DSO" value={`${analytics.dso} hr`} sub="rata-rata umur" accent={T.brand2} />
              <Stat label="Tertagih bln ini" value={rpc(analytics.tertagihBulanIni)} sub="dari pembayaran" accent={T.green} />
              <Stat label="PTP ditepati" value={analytics.ptp.rate == null ? "—" : `${analytics.ptp.rate}%`} sub={`${analytics.ptp.kept}/${analytics.ptp.total} janji`} accent={T.brand} />
            </div>

            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <h2 className="mb-1 text-sm font-semibold">Tagihan baru vs tertagih</h2>
              <p className="mb-3 text-xs" style={{ color: T.sub }}>6 bulan terakhir.</p>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.months} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.line} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: T.sub, fontSize: 11 }} axisLine={{ stroke: T.line }} tickLine={false} />
                    <YAxis tick={{ fill: T.sub, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => rpc(v).replace("Rp", "")} width={48} />
                    <Tooltip formatter={(v) => rp(v)} contentStyle={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12, color: T.ink }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="baru" name="Tagihan baru" fill={T.brand2} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tertagih" name="Tertagih" fill={T.green} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {s.peran === "atasan" && tim.length > 0 && (
              <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
                <h2 className="mb-1 text-sm font-semibold">Leaderboard petugas — bulan ini</h2>
                <p className="mb-3 text-xs" style={{ color: T.sub }}>Peringkat per tertagih bulan ini, pencapaian target, outstanding & PTP. Ketuk untuk lihat customer-nya.</p>
                <div className="space-y-2">
                  {leaderboard.map((t, idx) => {
                    const medal = ["🥇", "🥈", "🥉"][idx] || `#${idx + 1}`;
                    const pct = t.pct;
                    const barCol = pct == null ? T.slate : pct >= 100 ? T.green : pct >= 60 ? T.amber : T.red;
                    return (
                      <button key={t.nama} onClick={() => { setFPetugas(t.nama); setShowFilter(true); setTab("tagihan"); }}
                        className="block w-full rounded-lg p-2.5 text-left transition-colors hover:bg-black/5" style={{ background: T.bg }}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 shrink-0 text-center text-base">{medal}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{t.nama}</p>
                            <p className="text-[11px]" style={{ color: T.sub }}>{t.akun} akun · OS {rpc(t.outstanding)} · PTP {t.ptp.rate == null ? "—" : `${t.ptp.rate}%`}</p>
                          </div>
                          <div className="text-right">
                            <p className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: MONO, color: T.green }}>{rpc(t.tertagihBulan)}</p>
                            <p className="text-[11px]" style={{ color: T.sub }}>{t.target ? `dari ${rpc(t.target)}` : "target belum diset"}</p>
                          </div>
                        </div>
                        {t.target > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: T.line }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: barCol }} />
                            </div>
                            <span className="w-9 shrink-0 text-right text-[11px] font-bold" style={{ color: barCol, fontFamily: MONO }}>{pct}%</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {tim.filter((t) => t.unassigned).map((t) => (
                    <button key="belum" onClick={() => { setFPetugas("_none"); setShowFilter(true); setTab("tagihan"); }}
                      className="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-black/5" style={{ background: T.bg }}>
                      <span className="w-7 shrink-0 text-center" style={{ color: T.sub }}>—</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold" style={{ color: T.sub }}>{t.nama}</p>
                        <p className="text-[11px]" style={{ color: T.sub }}>{t.akun} akun · lihat customer →</p>
                      </div>
                      <p className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: MONO }}>{rpc(t.outstanding)}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <h2 className="mb-1 text-sm font-semibold">Kolektibilitas (OJK)</h2>
              <p className="mb-3 text-xs" style={{ color: T.sub }}>Klasifikasi Kol 1–5 berdasarkan hari tunggakan.</p>
              {(() => {
                const max = Math.max(1, ...analytics.kolBreak.map((k) => k.amount));
                return (
                  <div className="space-y-2">
                    {analytics.kolBreak.map((k) => (
                      <div key={k.no} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-xs" style={{ color: T.sub }}>Kol {k.no} · {k.label}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: T.bg }}>
                          <div className="h-full rounded-full" style={{ width: `${(k.amount / max) * 100}%`, background: T[k.tone] }} />
                        </div>
                        <span className="w-20 shrink-0 whitespace-nowrap text-right text-xs" style={{ fontFamily: MONO, color: T.ink }}>{rpc(k.amount)}</span>
                        <span className="w-6 shrink-0 text-right text-xs" style={{ color: T.sub }}>{k.count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <p className="mt-3 text-xs" style={{ color: T.sub }}>Bermasalah (Kol 3–5): <b style={{ fontFamily: MONO, color: T.red }}>{rp(analytics.macet)}</b></p>
            </section>

            <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
              <h2 className="mb-3 text-sm font-semibold">Komposisi umur piutang</h2>
              {analytics.agingPie.length === 0 ? (
                <p className="text-xs" style={{ color: T.sub }}>Belum ada piutang aktif.</p>
              ) : (
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={analytics.agingPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                        {analytics.agingPie.map((e, n) => <Cell key={n} fill={T[e.tone]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => rp(v)} contentStyle={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 8, fontSize: 12, color: T.ink }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ---------- HEAT MAP ---------- */}
        {tab === "heatmap" && (
          <HeatMapView rows={enriched} allRows={allEnriched} s={s}
            onOpen={(id) => { setTab("tagihan"); setOpenId(id); }} />
        )}

        {/* ---------- PENGATURAN ---------- */}
        {tab === "set" && (
          <Settingstab data={data} setData={setData} flash={flash} copy={copy}
            role={auth.role} tenantName={auth.name} onLogout={doLogout}
            onBackup={() => exportJSON(data)} onRestore={() => jsonRef.current?.click()}
            onReset={() => { setData(sampleData()); flash("Data direset ke contoh"); }}
            onClear={() => { setData({ settings: data.settings, invoices: [] }); flash("Semua tagihan dihapus"); }} />
        )}
        </div>{/* /konten */}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onImportFile} className="hidden" />
      <input ref={jsonRef} type="file" accept=".json,application/json" onChange={onImportJSON} className="hidden" />

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div onClick={() => setDrawer(false)} className="drawer-ov absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
          <aside className="drawer-pn absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col overflow-y-auto" style={{ background: T.surface, borderRight: `1px solid ${T.line}` }}>
            <div className="flex items-center gap-3 p-5">
              <Logo size={38} />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold tracking-tight" style={{ color: T.brand }}>Kolekta</h1>
                <p className="text-[11px]" style={{ color: T.brass }}>collection control</p>
              </div>
              <button onClick={() => setDrawer(false)}><X size={18} style={{ color: T.sub }} /></button>
            </div>
            <nav className="flex flex-col gap-1 px-3">
              {NAV.map((n) => {
                const active = tab === n.id;
                const badge = n.id === "hari" ? panels.belum.length + panels.perlu.length : 0;
                return (
                  <button key={n.id} onClick={() => { setTab(n.id); setDrawer(false); }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                    style={active ? { background: T.brand, color: "#fff" } : { color: T.sub }}>
                    <n.icon size={18} /><span>{n.label}</span>
                    {badge > 0 && <span className="ml-auto min-w-[20px] rounded-full px-1.5 text-center text-xs font-bold leading-5" style={{ background: active ? "#FFFFFF33" : T.brass, color: "#fff" }}>{badge}</span>}
                  </button>
                );
              })}
              <button onClick={() => { setShowCalc(true); setDrawer(false); }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ color: T.sub }}>
                <CalcIcon size={18} /><span>Kalkulator</span>
              </button>
            </nav>
            {sideSummary}
            <div className="mt-auto p-5">
              <span className="mb-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: T.brand2 + "1A", color: T.brand2 }}>
                {s.peran === "petugas" ? `Petugas: ${s.petugasAktif || "—"}` : "Mode: Atasan"}
              </span>
              <p className="text-[11px] leading-relaxed" style={{ color: T.sub }}>by <span style={{ color: T.brand2, fontWeight: 600 }}>KNSL</span><br />Kansil Network Solutions Labs</p>
            </div>
          </aside>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-white shadow-lg"
          style={{ background: T.toast }}>{toast}</div>
      )}

      <Kalkulator open={showCalc} onClose={() => setShowCalc(false)} />
    </div>
  );
}

/* ---------- Kalkulator (modal, ramah angka rupiah) ---------- */
function Kalkulator({ open, onClose }) {
  const [cur, setCur] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [overwrite, setOverwrite] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      const k = e.key;
      if (k >= "0" && k <= "9") digit(k);
      else if (k === ".") dot();
      else if (k === "+" ) choose("+");
      else if (k === "-") choose("−");
      else if (k === "*") choose("×");
      else if (k === "/") { e.preventDefault(); choose("÷"); }
      else if (k === "%") percent();
      else if (k === "Enter" || k === "=") { e.preventDefault(); eq(); }
      else if (k === "Backspace") back();
      else if (k === "Escape") onClose();
      else if (k === "c" || k === "C") clearAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;

  const calc = (a, b, o) => o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : o === "÷" ? (b === 0 ? NaN : a / b) : b;
  const digit = (d) => setCur((c) => (overwrite || c === "0" ? d : c + d)) || setOverwrite(false);
  const dot = () => { if (overwrite) { setCur("0."); setOverwrite(false); } else setCur((c) => (c.includes(".") ? c : c + ".")); };
  const choose = (o) => {
    const c = parseFloat(cur);
    if (prev == null) setPrev(c);
    else if (!overwrite) { const r = calc(prev, c, op); setPrev(r); setCur(String(r)); }
    setOp(o); setOverwrite(true);
  };
  const eq = () => {
    if (op == null || prev == null) return;
    const r = calc(prev, parseFloat(cur), op);
    setCur(Number.isFinite(r) ? String(r) : "Error");
    setPrev(null); setOp(null); setOverwrite(true);
  };
  const percent = () => setCur((c) => { const v = parseFloat(c); return String(prev != null && op ? (prev * v) / 100 : v / 100); });
  const sign = () => setCur((c) => (c === "0" || c === "Error" ? c : c.startsWith("-") ? c.slice(1) : "-" + c));
  const back = () => setCur((c) => (overwrite || c.length <= 1 || (c.length === 2 && c.startsWith("-")) ? "0" : c.slice(0, -1)));
  const clearAll = () => { setCur("0"); setPrev(null); setOp(null); setOverwrite(true); };

  const fmt = (s) => {
    if (s === "Error") return s;
    const neg = s.startsWith("-"); const body = neg ? s.slice(1) : s;
    const [ip, dp] = body.split(".");
    const g = Number(ip || "0").toLocaleString("id-ID");
    const tail = s.endsWith(".") ? "," : dp != null ? "," + dp : "";
    return (neg ? "-" : "") + g + tail;
  };

  const Btn = ({ children, onClick, kind }) => {
    const st = kind === "op" ? { background: T.brand2 + "1A", color: T.brand2 }
      : kind === "eq" ? { background: T.brand, color: "#fff" }
      : kind === "fn" ? { background: T.bg, color: T.sub }
      : { background: T.surface, color: T.ink, border: `1px solid ${T.line}` };
    return (
      <button onClick={onClick} className="kpress flex h-14 items-center justify-center rounded-xl text-lg font-semibold" style={st}>{children}</button>
    );
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: "rgba(0,0,0,.5)" }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-t-2xl p-4 shadow-xl sm:rounded-2xl" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalcIcon size={18} style={{ color: T.brand2 }} />
            <h3 className="text-sm font-semibold">Kalkulator</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1" style={{ color: T.sub }}><X size={18} /></button>
        </div>
        <div className="mb-3 rounded-xl p-4 text-right" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
          <div className="h-4 text-xs" style={{ color: T.sub, fontFamily: MONO }}>{prev != null ? `${fmt(String(prev))} ${op || ""}` : " "}</div>
          <div className="truncate text-3xl font-bold" style={{ fontFamily: MONO, color: T.ink }}>{fmt(cur)}</div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Btn kind="fn" onClick={clearAll}>C</Btn>
          <Btn kind="fn" onClick={sign}>±</Btn>
          <Btn kind="fn" onClick={percent}><Percent size={18} /></Btn>
          <Btn kind="op" onClick={() => choose("÷")}><Divide size={18} /></Btn>
          <Btn onClick={() => digit("7")}>7</Btn>
          <Btn onClick={() => digit("8")}>8</Btn>
          <Btn onClick={() => digit("9")}>9</Btn>
          <Btn kind="op" onClick={() => choose("×")}>×</Btn>
          <Btn onClick={() => digit("4")}>4</Btn>
          <Btn onClick={() => digit("5")}>5</Btn>
          <Btn onClick={() => digit("6")}>6</Btn>
          <Btn kind="op" onClick={() => choose("−")}>−</Btn>
          <Btn onClick={() => digit("1")}>1</Btn>
          <Btn onClick={() => digit("2")}>2</Btn>
          <Btn onClick={() => digit("3")}>3</Btn>
          <Btn kind="op" onClick={() => choose("+")}>+</Btn>
          <Btn kind="fn" onClick={back}><Delete size={18} /></Btn>
          <Btn onClick={() => digit("0")}>0</Btn>
          <Btn onClick={dot}>,</Btn>
          <Btn kind="eq" onClick={eq}>=</Btn>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponents ---------- */
function Stat({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-3 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <p className="text-xs" style={{ color: T.sub }}>{label}</p>
      <p className="mt-1 whitespace-nowrap text-base font-bold sm:text-lg" style={{ fontFamily: MONO, color: accent || T.brand }}>{value}</p>
      <p className="text-[11px]" style={{ color: T.sub }}>{sub}</p>
    </div>
  );
}

function FollowPanel({ title, icon: Icon, color, items, empty, onOpen, note }) {
  return (
    <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} style={{ color }} />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: color + "1A", color }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: T.sub }}>{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((i) => (
            <button key={i.id} onClick={() => onOpen(i.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-black/5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{i.customer}</p>
                <p className="text-xs" style={{ color: T.sub }}>
                  {i.noInvoice} · telat {i.daysOverdue} hari
                  {note && i.lastFollowUp ? ` · terakhir dihubungi ${daysSince(i.lastFollowUp)} hr lalu` : ""}
                  {note && i.janjiBayar && new Date(i.janjiBayar) < today0() ? " · janji bayar lewat" : ""}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold" style={{ fontFamily: MONO }}>{rp(i.total)}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: T.sub }}>{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const inputSt = { background: T.bg, border: `1px solid ${T.line}`, color: T.ink };

function AddForm({ onAdd, onCancel, petugas = [], defaultPetugas = "" }) {
  const [f, setF] = useState({ customer: "", noInvoice: "", nominal: "", tglJatuhTempo: "", pic: "", telp: "", tipe: "perusahaan", alamat: "", jaminanTipe: "none", jaminan: "", assignedTo: defaultPetugas });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.customer.trim() && f.noInvoice.trim() && Number(f.nominal) > 0 && f.tglJatuhTempo;
  return (
    <div className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tambah tagihan</h3>
        <button onClick={onCancel}><X size={16} style={{ color: T.sub }} /></button>
      </div>
      <div className="mb-3 flex gap-1.5">
        {[["perusahaan", "Perusahaan", Building2], ["perorangan", "Perorangan", User]].map(([v, lbl, Ic]) => (
          <button key={v} onClick={() => setF({ ...f, tipe: v })}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            style={f.tipe === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>
            <Ic size={12} />{lbl}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={f.tipe === "perorangan" ? "Nama debitur" : "Customer / perusahaan"}><input className={inputCls} style={inputSt} value={f.customer} onChange={set("customer")} placeholder={f.tipe === "perorangan" ? "Nama lengkap" : "PT / CV …"} /></Field>
        <Field label="No. invoice"><input className={inputCls} style={inputSt} value={f.noInvoice} onChange={set("noInvoice")} placeholder="INV-…" /></Field>
        <Field label="Nominal (pokok)"><input type="text" inputMode="numeric" className={inputCls} style={inputSt} value={grpID(f.nominal)} onChange={(e) => setF({ ...f, nominal: onlyDigits(e.target.value) })} placeholder="0" /></Field>
        <Field label="Jatuh tempo"><input type="date" className={inputCls} style={inputSt} value={f.tglJatuhTempo} onChange={set("tglJatuhTempo")} /></Field>
        <Field label={f.tipe === "perorangan" ? "Kontak (opsional)" : "Nama PIC (opsional)"}><input className={inputCls} style={inputSt} value={f.pic} onChange={set("pic")} placeholder={f.tipe === "perorangan" ? "mis. nomor rumah" : "mis. Bu Sari (Finance)"} /></Field>
        <Field label="No. WA (opsional)"><input className={inputCls} style={inputSt} value={f.telp} onChange={set("telp")} placeholder="08…" /></Field>
      </div>
      <div className="mt-3"><Field label="Alamat (untuk surat, opsional)"><input className={inputCls} style={inputSt} value={f.alamat} onChange={set("alamat")} placeholder="Jl. … / Kota" /></Field></div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Jenis jaminan"><select className={inputCls} style={inputSt} value={f.jaminanTipe} onChange={set("jaminanTipe")}>
          <option value="none">Tanpa jaminan</option>
          <option value="fidusia">BPKB / Fidusia</option>
          <option value="tanah">Sertifikat Tanah / Hak Tanggungan</option>
          <option value="lainnya">Jaminan lainnya</option>
        </select></Field>
        {f.jaminanTipe !== "none" && <Field label="Uraian jaminan"><input className={inputCls} style={inputSt} value={f.jaminan} onChange={set("jaminan")} placeholder="mis. BPKB Avanza W 1234 ABC" /></Field>}
      </div>
      {petugas.length > 0 && (
        <div className="mt-3"><Field label="Petugas penagih"><select className={inputCls} style={inputSt} value={f.assignedTo} onChange={set("assignedTo")}>
          <option value="">— belum ditugaskan —</option>
          {petugas.map((nm) => <option key={nm} value={nm}>{nm}</option>)}
        </select></Field></div>
      )}
      {Number(f.nominal) > 0 && <p className="mt-2 text-xs" style={{ color: T.sub }}>Pokok: <b style={{ fontFamily: MONO, color: T.ink }}>{rp(Number(f.nominal))}</b></p>}
      <button disabled={!valid} onClick={() => onAdd({ customer: f.customer.trim(), noInvoice: f.noInvoice.trim(), nominal: Number(f.nominal), tglJatuhTempo: f.tglJatuhTempo, pic: f.pic.trim(), telp: f.telp.trim(), tipe: f.tipe, alamat: f.alamat.trim(), jaminanTipe: f.jaminanTipe, jaminan: f.jaminan.trim(), assignedTo: f.assignedTo, status: "belum_dihubungi" })}
        className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity"
        style={{ background: T.brand, opacity: valid ? 1 : 0.45 }}>Simpan tagihan</button>
    </div>
  );
}

function SignaturePad({ onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [has, setHas] = useState(false);
  const pos = (e) => {
    const c = ref.current, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e) => {
    e.preventDefault();
    try { ref.current.setPointerCapture(e.pointerId); } catch {}
    drawing.current = true; last.current = pos(e);
  };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ref.current.getContext("2d"), p = pos(e);
    ctx.strokeStyle = "#13211C"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p; if (!has) setHas(true);
  };
  const end = (e) => {
    if (!drawing.current) return;
    drawing.current = false;
    try { ref.current.releasePointerCapture(e.pointerId); } catch {}
    onChange(ref.current.toDataURL("image/png"));
  };
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHas(false); onChange(null); };
  return (
    <div>
      <div className="relative">
        <canvas ref={ref} width={500} height={150}
          className="w-full touch-none select-none rounded-lg"
          style={{ background: "#fff", border: `1px solid ${T.line}`, touchAction: "none" }}
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} />
        {!has && <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs" style={{ color: T.sub }}>Tanda tangan di sini</span>}
      </div>
      <button onClick={clear}
        className="mt-1.5 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
        style={{ background: T.red + "14", color: T.red }}>
        <RotateCcw size={13} /> Ulangi / hapus tanda tangan
      </button>
    </div>
  );
}

function InvoiceCard({ i, s, open, onToggle, patch, remove, copy, flash, onStatement }) {
  const [note, setNote] = useState("");
  const [janji, setJanji] = useState(i.janjiBayar || "");
  const [contact, setContact] = useState({ tipe: i.tipe || "perusahaan", pic: i.pic || "", telp: i.telp || "", alamat: i.alamat || "", jaminanTipe: i.jaminanTipe || "none", jaminan: i.jaminan || "", assignedTo: i.assignedTo || "" });
  const [lvl, setLvl] = useState(null);
  const [bayar, setBayar] = useState("");
  const [hasil, setHasil] = useState("lain");
  const [foto, setFoto] = useState(null);
  const [fotoView, setFotoView] = useState(null);
  const [lok, setLok] = useState(null);
  const [busyLoc, setBusyLoc] = useState(false);
  const fotoRef = useRef(null);
  const [showDoc, setShowDoc] = useState(false);
  const [sub, setSub] = useState("tagih");
  const [docType, setDocType] = useState("pernyataan");
  const [dForm, setDForm] = useState({ jumlah: "", tgl: "", kondisi: "", pembahasan: "", kesepakatan: "" });
  const [dsig, setDsig] = useState(null);
  const [dsig2, setDsig2] = useState(null);
  const [tindakLanjut, setTindakLanjut] = useState(i.tindakLanjut || "");
  const [lunasAsk, setLunasAsk] = useState(false);
  const [lunasCode, setLunasCode] = useState("");
  const [openRiwayat, setOpenRiwayat] = useState(false);
  const [openArsip, setOpenArsip] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState({ customer: i.customer, noInvoice: i.noInvoice, nominal: i.nominal, tglJatuhTempo: i.tglJatuhTempo });
  const docs = useMemo(() => escalationDocs(i, s), [i, s]);
  const reco = recoLevel(i);
  const activeLvl = lvl || reco;
  const sel = docs.find((d) => d.key === activeLvl);
  const recoLabel = docs.find((d) => d.key === reco)?.label;
  const lvlIcon = { reminder: <MessageCircle size={12} />, tegas: <AlertTriangle size={12} />, sp: <FileText size={12} />, somasi: <Scale size={12} />, tarik: <Truck size={12} /> };

  const logBayar = () => {
    const j = Number((bayar + "").replace(/[^0-9]/g, ""));
    if (!(j > 0)) return;
    patch(i.id, (x) => {
      const pem = [{ ts: today0().toISOString().slice(0, 10), jumlah: j }, ...(x.pembayaran || [])];
      const tb = pem.reduce((a, p) => a + p.jumlah, 0);
      return { ...x, pembayaran: pem, status: tb >= x.nominal ? "lunas" : x.status, lastFollowUp: today0().toISOString().slice(0, 10) };
    });
    setBayar(""); flash("Pembayaran dicatat");
  };

  const setStatus = (st) => { if (st === "lunas") { setLunasCode(""); setLunasAsk(true); return; } patch(i.id, (x) => ({ ...x, status: st })); };
  const confirmLunas = () => {
    if (lunasCode.trim() !== "12345") { flash("Kode konfirmasi salah"); return; }
    setLunasAsk(false); setLunasCode(""); markLunas();
  };
  const markLunas = () => {
    patch(i.id, (x) => {
      const tb = (x.pembayaran || []).reduce((a, p) => a + p.jumlah, 0);
      const sisa = Math.max(0, x.nominal - tb);
      const pem = sisa > 0 ? [{ ts: today0().toISOString().slice(0, 10), jumlah: sisa, note: "pelunasan" }, ...(x.pembayaran || [])] : (x.pembayaran || []);
      return { ...x, pembayaran: pem, status: "lunas" };
    });
    flash("Ditandai lunas");
  };
  const logEskalasi = (level) => { patch(i.id, (x) => ({ ...x, eskalasi: [{ ts: today0().toISOString().slice(0, 10), level }, ...(x.eskalasi || [])] })); };
  const logFollowup = () => {
    const h = HASIL[hasil];
    const body = `[${h.label}]${note.trim() ? " " + note.trim() : ""}`;
    patch(i.id, (x) => ({
      ...x,
      status: h.status || (x.status === "belum_dihubungi" ? "sudah_followup" : x.status),
      lastFollowUp: today0().toISOString().slice(0, 10),
      tindakLanjut: tindakLanjut || x.tindakLanjut || "",
      aktivitas: [{ ts: today0().toISOString().slice(0, 10), waktu: new Date().toISOString(), note: body, foto: foto || null, lok: lok || null }, ...(x.aktivitas || [])],
    }));
    setNote(""); setHasil("lain"); setFoto(null); setLok(null); flash("Hasil kontak tercatat");
  };
  const onPickFoto = async (e) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      flash("Memproses foto…");
      const base = await resizeImage(file, 960, 0.72);
      // Ambil lokasi (pakai yang sudah ada, kalau belum coba ambil sekarang)
      let loc = lok;
      if (!loc) { try { loc = await getLoc(); setLok(loc); } catch {} }
      let address = "";
      if (loc) { try { address = (await reverseGeocode(loc.lat, loc.lng)) || ""; } catch {} }
      const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date());
      const stamped = (loc || address)
        ? await stampImage(base, { lat: loc?.lat, lng: loc?.lng, acc: loc?.acc, address, waktu, brand: s.perusahaan?.trim() || "" })
        : base;
      setFoto(stamped);
      flash(loc ? "Foto + lokasi tercap" : "Foto siap (lokasi tak tersedia)");
    } catch { flash("Gagal memproses foto"); }
  };
  const grabLoc = async () => {
    setBusyLoc(true);
    try { setLok(await getLoc()); flash("Lokasi diambil"); }
    catch { flash("Lokasi tidak tersedia / izin ditolak"); }
    setBusyLoc(false);
  };
  const docMeta = (jenis) =>
    jenis === "mom" ? { gen: momKunjungan, label: "MOM / Berita Acara Kunjungan" }
    : jenis === "bast" ? { gen: bastPenarikan, label: "BAST Penarikan" }
    : { gen: suratPernyataan, label: "Surat Pernyataan" };
  const stripSign = (t) => (t || "")
    .replace(/\[\[SIGN\d?\]\]/g, "(__________________________)")
    .replace(/\[\[\/?SIGGRID\]\]\n?/g, "")
    .replace(/^cap\|(.*)\|(.*)$/gm, "$1\t\t$2")
    .replace(/^sig\|.*$/gm, "")
    .replace(/^name\|(.*)\|(.*)$/gm, "$1\t\t$2");
  const sigMapFor = (jenis, a, b) =>
    jenis === "mom" ? { SIGN1: a, SIGN2: b }
    : jenis === "bast" ? { SIGN1: a }
    : { SIGN: a };
  const createDoc = () => {
    const f = { jumlah: Number((dForm.jumlah + "").replace(/[^0-9]/g, "")) || i.total, tgl: dForm.tgl, kondisi: dForm.kondisi, pembahasan: dForm.pembahasan, kesepakatan: dForm.kesepakatan };
    const { gen, label } = docMeta(docType);
    const text = gen(i, s, f);
    const sigArg = sigMapFor(docType, dsig, dsig2);
    const ok = printDoc(label, text, sigArg);
    patch(i.id, (x) => ({ ...x, dokumen: [{ ts: today0().toISOString().slice(0, 10), waktu: new Date().toISOString(), jenis: docType, sig: dsig || null, sig2: dsig2 || null, jumlah: f.jumlah, tgl: f.tgl, kondisi: f.kondisi, pembahasan: f.pembahasan, kesepakatan: f.kesepakatan }, ...(x.dokumen || [])] }));
    if (!ok) { copy(stripSign(text)); flash("Popup diblokir — teks disalin"); } else flash(label + " dibuat");
    setShowDoc(false); setDsig(null); setDsig2(null); setDForm({ jumlah: "", tgl: "", kondisi: "", pembahasan: "", kesepakatan: "" });
  };
  const reprintDoc = (dk) => {
    const f = { jumlah: dk.jumlah, tgl: dk.tgl, kondisi: dk.kondisi, pembahasan: dk.pembahasan, kesepakatan: dk.kesepakatan };
    const { gen, label } = docMeta(dk.jenis);
    const text = gen(i, s, f);
    const sigArg = sigMapFor(dk.jenis, dk.sig, dk.sig2);
    if (!printDoc(label, text, sigArg)) { copy(stripSign(text)); flash("Popup diblokir — teks disalin"); }
  };

  const urgent = i.status !== "lunas" && i.daysOverdue > 0;
  return (
    <>
    {fotoView && (
      <div onClick={() => setFotoView(null)} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.82)" }}>
        <button onClick={() => setFotoView(null)} className="absolute right-4 top-4 rounded-full p-2" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }} aria-label="Tutup"><X size={20} /></button>
        <img src={fotoView} alt="Bukti kunjungan" className="max-h-full max-w-full rounded-lg object-contain" style={{ boxShadow: "0 8px 40px rgba(0,0,0,.5)" }} onClick={(e) => e.stopPropagation()} />
        <a href={fotoView} download={`bukti-${i.noInvoice || "kolekta"}.jpg`} onClick={(e) => e.stopPropagation()} className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: T.brand }}>Unduh foto</a>
      </div>
    )}
    {lunasAsk && (
      <div onClick={() => setLunasAsk(false)} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.5)" }}>
        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl p-4 shadow-xl" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: T.green }} />
            <h3 className="text-sm font-semibold">Konfirmasi Lunas</h3>
          </div>
          <p className="mb-3 text-xs" style={{ color: T.sub }}>Menandai <b>{i.customer}</b> lunas bersifat final. Masukkan kode konfirmasi untuk melanjutkan.</p>
          <input autoFocus value={lunasCode} onChange={(e) => setLunasCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmLunas()}
            inputMode="numeric" placeholder="Kode konfirmasi" className={inputCls} style={{ ...inputSt, fontFamily: MONO, letterSpacing: "0.2em", textAlign: "center" }} />
          <div className="mt-3 flex gap-2">
            <button onClick={() => setLunasAsk(false)} className="flex-1 rounded-lg py-2 text-sm font-semibold" style={{ background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>Batal</button>
            <button onClick={confirmLunas} className="flex-1 rounded-lg py-2 text-sm font-semibold text-white" style={{ background: T.green }}>Tandai Lunas</button>
          </div>
        </div>
      </div>
    )}
    <div className="overflow-hidden rounded-xl shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left">
        <div className="h-9 w-1 shrink-0 rounded-full" style={{ background: i.status === "lunas" ? T.green : urgent ? (i.odRaw > 60 ? T.red : T.amber) : T.line }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{i.customer}</p>
            <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: T[i.kol.tone] + "1A", color: T[i.kol.tone] }}>{i.kol.short}</span>
            {i.status !== "lunas" && i.prioScore >= 45 && <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: T[i.prioTone] + "1A", color: T[i.prioTone] }}>{i.prioLabel === "Sangat tinggi" ? "PRIO!" : "PRIO"}</span>}
            {i.ptpLewat && <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: T.red + "1A", color: T.red }}>INGKAR</span>}
            {i.tlDue && !i.ptpLewat && <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold" style={{ background: T.amber + "1A", color: T.amber }}>TL</span>}
            {i.aktivitas?.some((a) => a.foto) && <Camera size={11} className="shrink-0" style={{ color: T.brand2 }} />}
          </div>
          <p className="truncate text-xs" style={{ color: T.sub }}>
            {i.noInvoice} · JT {fmtTgl(i.tglJatuhTempo)}{urgent ? ` · telat ${i.daysOverdue} hr` : i.status === "lunas" ? "" : " · belum jatuh tempo"}{i.assignedTo ? ` · ${i.assignedTo}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: MONO }}>{rp(i.total)}</p>
          <Pill status={i.status} />
        </div>
        <ChevronDown size={16} style={{ color: T.sub, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div className="border-t px-3 pb-3 pt-3" style={{ borderColor: T.line }}>
          {/* Sub-tab nav */}
          <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl p-1" style={{ background: T.bg }}>
            {[["tagih", "Tagih", Wallet], ["lapangan", "Lapangan", Camera], ["eskalasi", "Eskalasi", Send], ["profil", "Profil", User]].map(([k, lbl, Ic]) => (
              <button key={k} onClick={() => setSub(k)}
                className="kpress flex flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
                style={sub === k ? { background: T.surface, color: T.brand2, boxShadow: "0 1px 2px rgba(0,0,0,.08)" } : { color: T.sub }}>
                <Ic size={15} />{lbl}
              </button>
            ))}
          </div>

          {/* ===== TAGIH ===== */}
          {sub === "tagih" && (
            <div className="sub-fade">
              <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
                <Mini label="Sisa pokok" value={rp(i.sisaPokok)} />
                <Mini label={`Denda (${s.dendaRatePct}%/hr)`} value={rp(i.denda)} accent={i.denda ? T.red : T.sub} />
                <Mini label="Total" value={rp(i.total)} accent={T.brand} />
              </div>
              {i.terbayar > 0 && (
                <p className="mt-1.5 text-[11px]" style={{ color: T.sub }}>Sudah dibayar <b style={{ fontFamily: MONO, color: T.green }}>{rp(i.terbayar)}</b> dari pokok {rp(i.nominal)}</p>
              )}
              {i.status !== "lunas" && (
                <div className="mt-2 flex gap-2">
                  <input value={grpID(bayar)} onChange={(e) => setBayar(onlyDigits(e.target.value))} inputMode="numeric" placeholder="Catat pembayaran / cicilan (Rp)…" className={inputCls} style={inputSt} />
                  <button onClick={logBayar} className="shrink-0 rounded-lg px-3 text-xs font-semibold text-white" style={{ background: T.green }}>Catat</button>
                </div>
              )}
              {i.pembayaran?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {i.pembayaran.map((pb, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span style={{ color: T.brass, fontFamily: MONO }}>{fmtTgl(pb.ts).split(" ").slice(0, 2).join(" ")}</span>
                      <span style={{ color: T.green, fontFamily: MONO }}>+{rp(pb.jumlah)}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="mb-1 mt-3 text-xs font-medium" style={{ color: T.sub }}>Status</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((st) => (
                  <button key={st} onClick={() => setStatus(st)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={i.status === st ? { background: stColor(st), color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>
                    {stLabel(st)}
                  </button>
                ))}
              </div>

              {i.status === "janji_bayar" && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium" style={{ color: T.sub }}>Tanggal janji bayar</p>
                  <div className="flex gap-2">
                    <input type="date" className={inputCls} style={inputSt} value={janji} onChange={(e) => setJanji(e.target.value)} />
                    <button onClick={() => { patch(i.id, (x) => ({ ...x, janjiBayar: janji })); flash("Janji bayar disimpan"); }}
                      className="kpress shrink-0 rounded-lg px-4 text-xs font-semibold text-white" style={{ background: T.brand2 }}>Simpan</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== LAPANGAN ===== */}
          {sub === "lapangan" && (
            <div className="sub-fade">
              <p className="mb-1 text-xs font-medium" style={{ color: T.sub }}>Catat hasil kontak / kunjungan</p>
              <select value={hasil} onChange={(e) => setHasil(e.target.value)} className={`${inputCls} mb-2`} style={inputSt}>
                {HASIL_ORDER.map((k) => <option key={k} value={k}>{HASIL[k].label}</option>)}
              </select>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Deskripsi / catatan…" className={inputCls} style={inputSt} />
              <div className="mt-2 flex items-center gap-2">
                <span className="shrink-0 text-[11px] font-medium" style={{ color: T.sub }}>Tindak lanjut berikutnya</span>
                <input type="date" value={tindakLanjut} onChange={(e) => setTindakLanjut(e.target.value)} className={inputCls} style={inputSt} />
                {tindakLanjut && <button onClick={() => setTindakLanjut("")}><X size={14} style={{ color: T.sub }} /></button>}
              </div>
              <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={onPickFoto} className="hidden" />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => fotoRef.current?.click()} className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold" style={{ background: foto ? T.green + "1A" : T.bg, color: foto ? T.green : T.brand2, border: `1px solid ${T.line}` }}><Camera size={14} /> {foto ? "Foto ✓" : "Foto + lokasi"}</button>
                <button onClick={grabLoc} disabled={busyLoc} className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold" style={{ background: lok ? T.green + "1A" : T.bg, color: lok ? T.green : T.brand2, border: `1px solid ${T.line}` }}><MapPin size={14} /> {busyLoc ? "Mengambil…" : lok ? "Lokasi ✓" : "Ambil lokasi"}</button>
              </div>
              {(foto || lok) && (
                <div className="mt-2 flex items-center gap-2 rounded-lg p-2" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                  {foto && <img src={foto} alt="bukti" className="h-10 w-10 rounded object-cover" style={{ border: `1px solid ${T.line}` }} />}
                  {lok && <span className="min-w-0 flex-1 truncate text-[11px]" style={{ color: T.sub }}>{lok.lat}, {lok.lng} (±{lok.acc}m)</span>}
                  <button onClick={() => { setFoto(null); setLok(null); }} className="ml-auto shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ color: T.red }}>Hapus lampiran</button>
                </div>
              )}
              <button onClick={logFollowup} className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-white" style={{ background: T.brand }}>Catat hasil kontak</button>

              {i.aktivitas?.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setOpenRiwayat((v) => !v)} className="mb-1 flex w-full items-center gap-1.5 text-xs font-medium" style={{ color: T.sub }}>
                    <ChevronDown size={14} style={{ transform: openRiwayat ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
                    Riwayat kunjungan & kontak
                    <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: T.brand2 + "1A", color: T.brand2 }}>{i.aktivitas.length}</span>
                  </button>
                  {openRiwayat && (
                  <div className="space-y-2">
                    {i.aktivitas.map((a, idx) => (
                      <div key={idx} className="rounded-lg p-2" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                        <div className="flex gap-2">
                          {a.foto && <img src={a.foto} alt="bukti" className="h-14 w-14 shrink-0 cursor-pointer rounded object-cover" style={{ border: `1px solid ${T.line}` }} onClick={() => setFotoView(a.foto)} />}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px]" style={{ color: T.brass, fontFamily: MONO }}>{a.waktu ? fmtWaktu(a.waktu) : fmtTgl(a.ts).split(" ").slice(0, 2).join(" ")}</p>
                            <p className="text-xs" style={{ color: T.ink }}>{a.note}</p>
                            {a.lok && <a href={`https://maps.google.com/?q=${a.lok.lat},${a.lok.lng}`} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: T.brand2 }}><MapPin size={11} /> {a.lok.lat}, {a.lok.lng}</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              <button onClick={() => setShowDoc((v) => !v)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold"
                style={{ background: T.brass + "1A", color: T.brass }}>
                <FileSignature size={15} /> {showDoc ? "Tutup dokumen lapangan" : "Buat dokumen + tanda tangan"}
              </button>
              {showDoc && (
                <div className="mt-2 rounded-lg p-2.5" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <button onClick={() => setDocType("pernyataan")} className="chip flex-1 rounded-full px-2.5 py-1 text-xs font-medium" style={docType === "pernyataan" ? { background: T.brand2, color: "#fff" } : { background: T.surface, color: T.sub, border: `1px solid ${T.line}` }}>Surat Pernyataan</button>
                    <button onClick={() => setDocType("mom")} className="chip flex-1 rounded-full px-2.5 py-1 text-xs font-medium" style={docType === "mom" ? { background: T.brand2, color: "#fff" } : { background: T.surface, color: T.sub, border: `1px solid ${T.line}` }}>MOM / Visit Report</button>
                    {i.jaminanTipe && i.jaminanTipe !== "none" && <button onClick={() => setDocType("bast")} className="chip flex-1 rounded-full px-2.5 py-1 text-xs font-medium" style={docType === "bast" ? { background: T.brand2, color: "#fff" } : { background: T.surface, color: T.sub, border: `1px solid ${T.line}` }}>BAST Penarikan</button>}
                  </div>
                  {docType === "pernyataan" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input value={grpID(dForm.jumlah)} onChange={(e) => setDForm({ ...dForm, jumlah: onlyDigits(e.target.value) })} inputMode="numeric" placeholder={`Jumlah (${rp(i.total)})`} className={inputCls} style={inputSt} />
                      <input type="date" value={dForm.tgl} onChange={(e) => setDForm({ ...dForm, tgl: e.target.value })} className={inputCls} style={inputSt} />
                    </div>
                  ) : docType === "mom" ? (
                    <div className="space-y-2 sub-fade">
                      <textarea value={dForm.pembahasan} onChange={(e) => setDForm({ ...dForm, pembahasan: e.target.value })} rows={2} placeholder="Hasil pembahasan / poin pertemuan…" className={inputCls} style={inputSt} />
                      <textarea value={dForm.kesepakatan} onChange={(e) => setDForm({ ...dForm, kesepakatan: e.target.value })} rows={2} placeholder="Kesepakatan / tindak lanjut…" className={inputCls} style={inputSt} />
                      <div>
                        <p className="mb-1 text-[11px] font-medium" style={{ color: T.sub }}>Target penyelesaian (opsional)</p>
                        <input type="date" value={dForm.tgl} onChange={(e) => setDForm({ ...dForm, tgl: e.target.value })} className={inputCls} style={inputSt} />
                      </div>
                    </div>
                  ) : (
                    <input value={dForm.kondisi} onChange={(e) => setDForm({ ...dForm, kondisi: e.target.value })} placeholder="Kondisi / kelengkapan unit" className={inputCls} style={inputSt} />
                  )}
                  <p className="mb-1 mt-2 text-[11px] font-semibold" style={{ color: T.sub }}>Tanda tangan {docType === "mom" ? "debitur / customer" : "debitur"}</p>
                  <SignaturePad onChange={setDsig} />
                  {docType === "mom" && (
                    <>
                      <p className="mb-1 mt-2 text-[11px] font-semibold" style={{ color: T.sub }}>Tanda tangan petugas / atasan</p>
                      <SignaturePad onChange={setDsig2} />
                    </>
                  )}
                  <button onClick={createDoc} className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-white" style={{ background: T.brand }}>Buat &amp; cetak (PDF)</button>
                </div>
              )}
              {i.dokumen?.length > 0 && (
                <div className="mt-3">
                  <button onClick={() => setOpenArsip((v) => !v)} className="mb-1 flex w-full items-center gap-1.5 text-xs font-medium" style={{ color: T.sub }}>
                    <ChevronDown size={14} style={{ transform: openArsip ? "none" : "rotate(-90deg)", transition: "transform .15s" }} />
                    Arsip dokumen lapangan
                    <span className="rounded-full px-1.5 text-[10px] font-bold" style={{ background: T.brand2 + "1A", color: T.brand2 }}>{i.dokumen.length}</span>
                  </button>
                  {openArsip && (
                  <div className="space-y-1.5">
                    {i.dokumen.map((dk, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg p-2 text-xs" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                        {dk.sig && <img src={dk.sig} alt="ttd" className="h-8 w-12 shrink-0 rounded object-contain" style={{ background: "#fff", border: `1px solid ${T.line}` }} />}
                        {dk.jenis === "mom" && dk.sig2 && <img src={dk.sig2} alt="ttd petugas" className="h-8 w-12 shrink-0 rounded object-contain" style={{ background: "#fff", border: `1px solid ${T.line}` }} />}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold" style={{ color: T.ink }}>{dk.jenis === "mom" ? "MOM / Visit Report" : dk.jenis === "bast" ? "BAST Penarikan" : "Surat Pernyataan"}</p>
                          <p className="text-[11px]" style={{ color: T.sub }}>{fmtWaktu(dk.waktu)}</p>
                        </div>
                        <button onClick={() => reprintDoc(dk)} className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-white" style={{ background: T.brand2 }}>Cetak ulang</button>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== ESKALASI ===== */}
          {sub === "eskalasi" && (
            <div className="sub-fade">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold">Tingkat penagihan</span>
                {i.status !== "lunas" && <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: T.brass + "1A", color: T.brass }}>Disarankan: {recoLabel}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {docs.map((d) => (
                  <button key={d.key} onClick={() => setLvl(d.key)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={activeLvl === d.key ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>
                    {lvlIcon[d.key]}{d.label}
                  </button>
                ))}
              </div>

              {sel && (
                <div className="mt-2 rounded-lg p-2.5" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold">{sel.label}</span>
                    <div className="ml-auto flex gap-1">
                      {sel.wa && waLink(i.telp, sel.text) && (
                        <button onClick={() => { window.open(waLink(i.telp, sel.text), "_blank"); logEskalasi(sel.key); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white" style={{ background: T.green }}>
                          <MessageCircle size={12} /> Kirim WA
                        </button>
                      )}
                      {!sel.wa && (
                        <button onClick={() => { if (printLetter(sel.label, sel.text)) logEskalasi(sel.key); else flash("Popup diblokir — pakai Salin"); }}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white" style={{ background: T.brand2 }}>
                          <Printer size={12} /> PDF
                        </button>
                      )}
                      <button onClick={() => copy(sel.text)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white" style={{ background: T.brand }}>
                        <Copy size={12} /> Salin
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-xs leading-relaxed" style={{ color: T.ink, fontFamily: SANS }}>{sel.text}</pre>
                  <button onClick={() => { logEskalasi(sel.key); flash(`${sel.label} dicatat terkirim`); }}
                    className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: T.brass + "1A", color: T.brass }}>
                    <Send size={11} /> Tandai sudah dikirim
                  </button>
                  {!sel.wa && <p className="mt-1.5 text-[11px]" style={{ color: T.sub }}>Salin ke kop surat resmi, lalu tanda tangani pejabat berwenang sebelum dikirim.</p>}
                  {sel.wa && !waLink(i.telp, sel.text) && <p className="mt-1.5 text-[11px]" style={{ color: T.sub }}>Isi & simpan No. WA di tab Profil untuk tombol kirim langsung.</p>}
                </div>
              )}

              {i.eskalasi?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium" style={{ color: T.sub }}>Riwayat eskalasi</p>
                  <div className="space-y-1">
                    {i.eskalasi.map((e, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: T.brand2 + "1A", color: T.brand2 }}>{docs.find((d) => d.key === e.level)?.label || e.level}</span>
                        <span style={{ color: T.sub }}>terkirim {fmtTgl(e.ts)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => onStatement(i.customer)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold"
                style={{ background: T.brand2 + "1A", color: T.brand2 }}>
                <FileSignature size={15} /> Statement debitur (PDF)
              </button>
            </div>
          )}

          {/* ===== PROFIL ===== */}
          {sub === "profil" && (
            <div className="sub-fade">
              <div className="mb-2 flex gap-1.5">
                {[["perusahaan", "Perusahaan", Building2], ["perorangan", "Perorangan", User]].map(([v, lbl, Ic]) => (
                  <button key={v} onClick={() => setContact({ ...contact, tipe: v })}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={contact.tipe === v ? { background: T.brand2, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>
                    <Ic size={12} />{lbl}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={contact.pic} onChange={(e) => setContact({ ...contact, pic: e.target.value })} placeholder={contact.tipe === "perorangan" ? "Kontak" : "Nama PIC"} className={inputCls} style={inputSt} />
                <input value={contact.telp} onChange={(e) => setContact({ ...contact, telp: e.target.value })} placeholder="No. WA (08…)" className={inputCls} style={inputSt} />
              </div>
              <input value={contact.alamat} onChange={(e) => setContact({ ...contact, alamat: e.target.value })} placeholder="Alamat (untuk surat)" className={`${inputCls} mt-2`} style={inputSt} />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select value={contact.jaminanTipe} onChange={(e) => setContact({ ...contact, jaminanTipe: e.target.value })} className={inputCls} style={inputSt}>
                  <option value="none">Tanpa jaminan</option>
                  <option value="fidusia">BPKB / Fidusia</option>
                  <option value="tanah">Sertifikat Tanah / Hak Tanggungan</option>
                  <option value="lainnya">Jaminan lainnya</option>
                </select>
                {contact.jaminanTipe !== "none" && <input value={contact.jaminan} onChange={(e) => setContact({ ...contact, jaminan: e.target.value })} placeholder="Uraian jaminan" className={inputCls} style={inputSt} />}
              </div>
              {(s.petugas || []).length > 0 && (
                <select value={contact.assignedTo} onChange={(e) => setContact({ ...contact, assignedTo: e.target.value })} className={`${inputCls} mt-2`} style={inputSt}>
                  <option value="">— petugas: belum ditugaskan —</option>
                  {s.petugas.map((nm) => <option key={nm} value={nm}>Petugas: {nm}</option>)}
                </select>
              )}
              <button onClick={() => { patch(i.id, (x) => ({ ...x, tipe: contact.tipe, pic: contact.pic, telp: contact.telp, alamat: contact.alamat, jaminanTipe: contact.jaminanTipe, jaminan: contact.jaminan, assignedTo: contact.assignedTo })); flash("Profil disimpan"); }}
                className="mt-2 w-full rounded-lg py-2 text-sm font-semibold" style={{ background: T.bg, color: T.brand2, border: `1px solid ${T.line}` }}>Simpan profil</button>
            </div>
          )}

          {/* ===== Aksi tetap ===== */}
          {editing && (
            <div className="mt-3 rounded-lg p-2.5" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
              <p className="mb-2 text-xs font-semibold">Ubah data tagihan</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={ed.customer} onChange={(e) => setEd({ ...ed, customer: e.target.value })} placeholder="Customer / nama" className={inputCls} style={inputSt} />
                <input value={ed.noInvoice} onChange={(e) => setEd({ ...ed, noInvoice: e.target.value })} placeholder="No. invoice" className={inputCls} style={inputSt} />
                <input type="text" inputMode="numeric" value={grpID(ed.nominal)} onChange={(e) => setEd({ ...ed, nominal: onlyDigits(e.target.value) })} placeholder="Nominal pokok" className={inputCls} style={inputSt} />
                <input type="date" value={ed.tglJatuhTempo} onChange={(e) => setEd({ ...ed, tglJatuhTempo: e.target.value })} className={inputCls} style={inputSt} />
              </div>
              <button onClick={() => { patch(i.id, (x) => ({ ...x, customer: ed.customer.trim() || x.customer, noInvoice: ed.noInvoice.trim() || x.noInvoice, nominal: Number(ed.nominal) > 0 ? Number(ed.nominal) : x.nominal, tglJatuhTempo: ed.tglJatuhTempo || x.tglJatuhTempo })); setEditing(false); flash("Data tagihan diperbarui"); }}
                className="mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: T.brand }}>Simpan perubahan</button>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {i.status !== "lunas" && (
              <button onClick={markLunas}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold text-white" style={{ background: T.green }}>
                <Check size={15} /> Tandai lunas
              </button>
            )}
            <button onClick={() => { setEd({ customer: i.customer, noInvoice: i.noInvoice, nominal: i.nominal, tglJatuhTempo: i.tglJatuhTempo }); setEditing((v) => !v); }}
              className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: T.bg, color: T.brand2, border: `1px solid ${T.line}` }}>
              <Pencil size={15} />
            </button>
            <button onClick={() => remove(i.id)}
              className="flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: T.red + "14", color: T.red }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function Mini({ label, value, accent }) {
  return (
    <div className="rounded-lg p-2" style={{ background: T.bg }}>
      <p className="text-[11px]" style={{ color: T.sub }}>{label}</p>
      <p className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: MONO, color: accent || T.ink }}>{value}</p>
    </div>
  );
}

/* ================= HEAT MAP ANALYTICS ================= */
/* Memuat Leaflet + plugin heat lewat CDN unpkg (tanpa npm install). */
function useLeaflet() {
  const [ready, setReady] = useState(() => !!(window.L && window.L.heatLayer));
  useEffect(() => {
    if (window.L && window.L.heatLayer) { setReady(true); return; }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const loadScript = (src) => new Promise((res, rej) => {
      const ex = document.querySelector(`script[src="${src}"]`);
      if (ex) { if (ex.dataset.loaded) res(); else { ex.addEventListener("load", res); ex.addEventListener("error", rej); } return; }
      const sc = document.createElement("script");
      sc.src = src; sc.async = true;
      sc.onload = () => { sc.dataset.loaded = "1"; res(); };
      sc.onerror = rej;
      document.body.appendChild(sc);
    });
    let alive = true;
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
      .then(() => loadScript("https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"))
      .then(() => { if (alive) setReady(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return ready;
}

/* Perkiraan titik kota/kabupaten untuk debitur tanpa GPS & gagal geocode (fallback). */
const CITY_COORDS = [
  // Jabodetabek (urut spesifik dulu)
  { k: ["jakarta selatan", "jaksel"], c: [-6.2615, 106.8106] },
  { k: ["jakarta utara", "jakut"], c: [-6.1214, 106.7741] },
  { k: ["jakarta barat", "jakbar"], c: [-6.1352, 106.7635] },
  { k: ["jakarta timur", "jaktim"], c: [-6.2250, 106.9004] },
  { k: ["jakarta pusat", "jakpus"], c: [-6.1862, 106.8344] },
  { k: ["jakarta", "dki"], c: [-6.2088, 106.8456] },
  { k: ["bogor"], c: [-6.5950, 106.8166] },
  { k: ["depok"], c: [-6.4025, 106.7942] },
  { k: ["bekasi"], c: [-6.2383, 106.9756] },
  { k: ["tangerang selatan", "tangsel"], c: [-6.2887, 106.7179] },
  { k: ["tangerang"], c: [-6.1781, 106.6300] },
  { k: ["serang"], c: [-6.1200, 106.1503] },
  { k: ["cilegon"], c: [-6.0173, 106.0540] },
  // Jawa Barat
  { k: ["bandung"], c: [-6.9175, 107.6191] },
  { k: ["cimahi"], c: [-6.8722, 107.5425] },
  { k: ["karawang"], c: [-6.3227, 107.3376] },
  { k: ["purwakarta"], c: [-6.5569, 107.4431] },
  { k: ["sukabumi"], c: [-6.9277, 106.9300] },
  { k: ["cianjur"], c: [-6.8204, 107.1426] },
  { k: ["garut"], c: [-7.2278, 107.9087] },
  { k: ["tasikmalaya"], c: [-7.3274, 108.2207] },
  { k: ["cirebon"], c: [-6.7320, 108.5523] },
  { k: ["indramayu"], c: [-6.3373, 108.3200] },
  { k: ["subang"], c: [-6.5719, 107.7589] },
  // Jawa Tengah & DIY
  { k: ["semarang"], c: [-6.9667, 110.4167] },
  { k: ["solo", "surakarta"], c: [-7.5755, 110.8243] },
  { k: ["yogyakarta", "jogja", "yogya"], c: [-7.7956, 110.3695] },
  { k: ["sleman"], c: [-7.7169, 110.3550] },
  { k: ["bantul"], c: [-7.8880, 110.3300] },
  { k: ["magelang"], c: [-7.4706, 110.2178] },
  { k: ["tegal"], c: [-6.8694, 109.1402] },
  { k: ["pekalongan"], c: [-6.8886, 109.6753] },
  { k: ["purwokerto", "banyumas"], c: [-7.4216, 109.2345] },
  { k: ["kudus"], c: [-6.8048, 110.8405] },
  // Jawa Timur
  { k: ["surabaya"], c: [-7.2575, 112.7521] },
  { k: ["gresik"], c: [-7.1561, 112.6531] },
  { k: ["sidoarjo"], c: [-7.4478, 112.7183] },
  { k: ["malang"], c: [-7.9666, 112.6326] },
  { k: ["batu"], c: [-7.8672, 112.5239] },
  { k: ["mojokerto"], c: [-7.4722, 112.4337] },
  { k: ["pasuruan"], c: [-7.6453, 112.9075] },
  { k: ["probolinggo"], c: [-7.7543, 113.2159] },
  { k: ["jember"], c: [-8.1727, 113.7002] },
  { k: ["banyuwangi"], c: [-8.2192, 114.3691] },
  { k: ["kediri"], c: [-7.8480, 112.0178] },
  { k: ["madiun"], c: [-7.6298, 111.5239] },
  { k: ["blitar"], c: [-8.0954, 112.1609] },
  // Bali, NTB, NTT
  { k: ["denpasar", "bali"], c: [-8.6705, 115.2126] },
  { k: ["badung"], c: [-8.5800, 115.1770] },
  { k: ["mataram", "lombok"], c: [-8.5833, 116.1167] },
  { k: ["kupang"], c: [-10.1772, 123.6070] },
  // Sumatera
  { k: ["medan"], c: [3.5952, 98.6722] },
  { k: ["binjai"], c: [3.6001, 98.4854] },
  { k: ["pekanbaru"], c: [0.5071, 101.4478] },
  { k: ["batam"], c: [1.1301, 104.0529] },
  { k: ["padang"], c: [-0.9471, 100.4172] },
  { k: ["palembang"], c: [-2.9761, 104.7754] },
  { k: ["jambi"], c: [-1.6101, 103.6131] },
  { k: ["bengkulu"], c: [-3.8004, 102.2655] },
  { k: ["bandar lampung", "lampung"], c: [-5.3971, 105.2668] },
  { k: ["banda aceh", "aceh"], c: [5.5483, 95.3238] },
  // Kalimantan
  { k: ["pontianak"], c: [-0.0263, 109.3425] },
  { k: ["banjarmasin"], c: [-3.3194, 114.5908] },
  { k: ["balikpapan"], c: [-1.2379, 116.8529] },
  { k: ["samarinda"], c: [-0.5022, 117.1536] },
  { k: ["palangkaraya", "palangka raya"], c: [-2.2161, 113.9135] },
  // Sulawesi & Timur
  { k: ["makassar"], c: [-5.1477, 119.4327] },
  { k: ["manado"], c: [1.4748, 124.8421] },
  { k: ["palu"], c: [-0.8917, 119.8707] },
  { k: ["kendari"], c: [-3.9985, 122.5127] },
  { k: ["gorontalo"], c: [0.5435, 123.0568] },
  { k: ["ambon"], c: [-3.6954, 128.1814] },
  { k: ["jayapura"], c: [-2.5916, 140.6690] },
];
const HM_DEFAULT_CENTER = [-6.2088, 106.8456]; // Jakarta sbg pusat netral terakhir
function hashStr(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return h; }
function invCoord(i) {
  const withLok = (i.aktivitas || []).filter((a) => a.lok && a.lok.lat != null);
  if (withLok.length) { const l = withLok[withLok.length - 1].lok; return { lat: l.lat, lng: l.lng, real: true }; }
  const al = (i.alamat || "").toLowerCase();
  let base = HM_DEFAULT_CENTER;
  for (const c of CITY_COORDS) { if (c.k.some((k) => al.includes(k))) { base = c.c; break; } }
  const h = hashStr((i.id || "") + (i.noInvoice || ""));
  const jx = (((h % 1000) / 1000) - 0.5) * 0.05;
  const jy = ((((h >> 10) % 1000) / 1000) - 0.5) * 0.05;
  return { lat: base[0] + jy, lng: base[1] + jx, real: false };
}
const escHtml = (t) => (t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Geocoding alamat -> koordinat akurat via Nominatim (OpenStreetMap, tanpa API key).
   Hasil di-cache di localStorage agar tak mengulang permintaan (batas wajar ~1 req/detik). */
const GEO_CACHE_KEY = "kolekta:geocache:v2";
const loadGeoCache = () => { try { return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || "{}"); } catch { return {}; } };
const saveGeoCache = (c) => { try { localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(c)); } catch {} };
const normAddr = (a) => (a || "").trim().toLowerCase().replace(/\s+/g, " ");
const hmSleep = (ms = 1100) => new Promise((r) => setTimeout(r, ms));

/* Daftar kueri dari yang paling spesifik ke paling kasar, supaya alamat detail
   yang gagal tetap jatuh ke tingkat kabupaten/kota, bukan ke pusat default. */
function addrCandidates(addr) {
  const out = [];
  const push = (q) => { q = (q || "").trim(); if (q.length >= 4 && !out.includes(q)) out.push(q); };
  push(addr);
  // sebutan kabupaten/kota/kecamatan eksplisit (mis. "Kabupaten Bogor")
  const m = addr.match(/\b(kabupaten|kota|kab\.?|kec\.?|kecamatan)\s+[a-z][a-z .'-]{2,30}/i);
  if (m) push(m[0].replace(/\bkab\.?\b/i, "Kabupaten").replace(/\bkec\.?\b/i, "Kecamatan"));
  // buang segmen paling depan (paling spesifik) bertahap
  const parts = addr.split(",").map((s) => s.trim()).filter(Boolean);
  for (let start = 1; start < parts.length; start++) push(parts.slice(start).join(", "));
  return out.slice(0, 4);
}
async function geocodeOne(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&addressdetails=0&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("geocode " + r.status);
  const j = await r.json();
  if (!j || !j[0]) return null;
  return { lat: +(+j[0].lat).toFixed(6), lng: +(+j[0].lon).toFixed(6) };
}
async function geocodeAddr(addr) {
  const cands = addrCandidates(addr);
  for (let n = 0; n < cands.length; n++) {
    if (n > 0) await hmSleep(); // hormati batas ~1 req/detik antar percobaan
    let hit = null;
    try { hit = await geocodeOne(cands[n]); } catch {}
    if (hit) return hit;
  }
  return null;
}

/* Palet bucket DPD: Current hijau, lalu kuning -> oranye -> merah pekat (terlama). */
const BUCKET_META = [
  { key: "lancar", label: "Current", color: "#2F7D5B" },
  { key: "1-30", label: "DPD 1-30", color: "#EAB308" },
  { key: "31-60", label: "DPD 31-60", color: "#F59E0B" },
  { key: "61-90", label: "DPD 61-90", color: "#E2552A" },
  { key: "90+", label: "DPD 90+", color: "#8E1B12" },
];
const bucketColor = (key) => (BUCKET_META.find((b) => b.key === key) || BUCKET_META[0]).color;

/* ----- 1. Peta Geografis ----- */
function GeoHeat({ rows }) {
  const ready = useLeaflet();
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const [geo, setGeo] = useState(loadGeoCache);
  const [geoStatus, setGeoStatus] = useState("");
  const geoRef = useRef(geo);
  useEffect(() => { geoRef.current = geo; }, [geo]);

  const active = useMemo(() => rows.filter((i) => i.status !== "lunas" && i.total > 0), [rows]);

  /* Titik per debitur: 1) GPS kunjungan, 2) hasil geocode alamat, 3) perkiraan kota. */
  const pts = useMemo(
    () => active.map((i) => {
      const lokVisit = (i.aktivitas || []).filter((a) => a.lok && a.lok.lat != null).pop();
      if (lokVisit) return { i, lat: lokVisit.lok.lat, lng: lokVisit.lok.lng, src: "gps" };
      const key = normAddr(i.alamat);
      const g = key && geo[key];
      if (g) return { i, lat: g.lat, lng: g.lng, src: "geocode" };
      const c = invCoord(i);
      return { i, lat: c.lat, lng: c.lng, src: "perkiraan" };
    }),
    [active, geo]
  );
  const srcN = (s) => pts.filter((p) => p.src === s).length;

  /* Geocode alamat yang belum di-cache, berurutan dengan jeda agar sopan ke Nominatim. */
  useEffect(() => {
    let alive = true;
    (async () => {
      const seen = new Set(); const need = [];
      active.forEach((i) => {
        const hasGps = (i.aktivitas || []).some((a) => a.lok && a.lok.lat != null);
        const key = normAddr(i.alamat);
        if (hasGps || !key || key in geoRef.current || seen.has(key)) return;
        seen.add(key); need.push(key);
      });
      if (!need.length) { setGeoStatus(""); return; }
      for (let n = 0; n < need.length; n++) {
        if (!alive) return;
        setGeoStatus(`Mencari lokasi alamat… ${n + 1}/${need.length}`);
        let res = null;
        try { res = await geocodeAddr(need[n]); } catch {}
        if (!alive) return;
        setGeo((prev) => { const nx = { ...prev, [need[n]]: res }; saveGeoCache(nx); return nx; });
        if (n < need.length - 1) await new Promise((r) => setTimeout(r, 1100));
      }
      if (alive) setGeoStatus("");
    })();
    return () => { alive = false; };
  }, [active]);

  useEffect(() => {
    if (!ready || !elRef.current) return;
    const L = window.L;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    const map = L.map(elRef.current, { scrollWheelZoom: false }).setView(HM_DEFAULT_CENTER, 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap", maxZoom: 19,
    }).addTo(map);
    if (pts.length) {
      const max = Math.max(...pts.map((p) => p.i.total));
      const heat = pts.map((p) => [p.lat, p.lng, Math.max(0.15, p.i.total / max)]);
      L.heatLayer(heat, { radius: 28, blur: 20, maxZoom: 12, gradient: { 0.0: T.green, 0.5: T.amber, 1.0: T.red } }).addTo(map);
      pts.forEach((p) => {
        const col = bucketColor(p.i.bucket); // warna titik ikut bucket DPD
        const m = L.circleMarker([p.lat, p.lng], { radius: 7, color: "#fff", weight: 1.5, fillColor: col, fillOpacity: 0.95 }).addTo(map);
        const srcLbl = p.src === "gps" ? "GPS kunjungan" : p.src === "geocode" ? "geocode alamat" : "perkiraan kota";
        m.bindPopup(
          `<div style="font-family:${SANS};min-width:170px">` +
          `<div style="font-weight:700;color:${T.ink}">${escHtml(p.i.customer)}</div>` +
          `<div style="font-size:12px;color:${T.sub};margin:2px 0">${escHtml(p.i.noInvoice)}${p.i.assignedTo ? " &middot; " + escHtml(p.i.assignedTo) : ""}</div>` +
          `<div style="font-size:12px;color:${T.ink}">DPD: <b>${p.i.daysOverdue} hari</b> &middot; ${p.i.kol.short}</div>` +
          `<div style="font-size:13px;font-weight:700;color:${col};margin-top:2px">Tunggakan: ${rp(p.i.total)}</div>` +
          `<div style="font-size:10px;color:${T.sub};margin-top:3px">Lokasi: ${srcLbl}</div>` +
          `</div>`
        );
      });
      try {
        const grp = L.featureGroup(pts.map((p) => L.marker([p.lat, p.lng])));
        map.fitBounds(grp.getBounds().pad(0.25));
      } catch {}
    }
    mapRef.current = map;
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { clearTimeout(t); if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [ready, pts]);

  return (
    <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <h2 className="mb-1 text-sm font-semibold">Sebaran Geografis Tunggakan</h2>
      <p className="mb-3 text-xs" style={{ color: T.sub }}>
        Warna titik mengikuti umur tunggakan (bucket DPD); pekatnya area mengikuti besar tunggakan. Ketuk titik untuk detail debitur.
      </p>
      <div ref={elRef} className="overflow-hidden rounded-xl" style={{ height: 420, width: "100%", background: T.bg, border: `1px solid ${T.line}` }} />
      {!ready && <p className="mt-2 text-xs" style={{ color: T.sub }}>Memuat peta…</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: T.sub }}>
        {BUCKET_META.map((b) => (
          <span key={b.key} className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color, border: "1px solid #fff", boxShadow: `0 0 0 1px ${T.line}` }} />{b.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px]" style={{ color: T.sub }}>
        {geoStatus ? geoStatus : `${pts.length} debitur dipetakan · ${srcN("gps")} GPS kunjungan, ${srcN("geocode")} dari alamat, ${srcN("perkiraan")} perkiraan kota.`}
      </p>
    </section>
  );
}

/* ----- 2. Kalender (gaya GitHub) ----- */
function CalHeat({ rows, onOpen }) {
  const [sel, setSel] = useState(null);
  const { weeks, max, byDay } = useMemo(() => {
    const byDay = {};
    rows.forEach((i) => {
      if (i.status === "lunas") return;
      const d = i.tglJatuhTempo; if (!d) return;
      if (!byDay[d]) byDay[d] = { total: 0, count: 0, list: [] };
      byDay[d].total += i.total; byDay[d].count++; byDay[d].list.push(i);
    });
    const end = today0();
    const start = new Date(end); start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // mundur ke Minggu
    const weeks = []; const cur = new Date(start);
    while (cur <= end) {
      const week = [];
      for (let dn = 0; dn < 7; dn++) {
        const iso = cur.toISOString().slice(0, 10);
        week.push({ iso, future: cur > end, month: cur.getMonth(), day: cur.getDate() });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
    const max = Math.max(1, ...Object.values(byDay).map((v) => v.total));
    return { weeks, max, byDay };
  }, [rows]);

  const cellColor = (iso, future) => {
    if (future) return "transparent";
    const v = byDay[iso]; if (!v || !v.total) return T.bg;
    const r = v.total / max;
    if (r < 0.25) return "#FDE68A"; // kuning muda
    if (r < 0.5) return "#FBBF24";  // kuning
    if (r < 0.75) return "#F97316"; // oranye
    return T.red;                    // merah
  };

  const selData = sel ? byDay[sel] : null;
  return (
    <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <h2 className="mb-1 text-sm font-semibold">Kalender Jatuh Tempo — 12 Bulan Terakhir</h2>
      <p className="mb-3 text-xs" style={{ color: T.sub }}>Tiap kotak = satu hari. Makin pekat warnanya, makin besar tunggakan jatuh tempo hari itu. Ketuk untuk lihat debitur.</p>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3px]" style={{ minWidth: "min-content" }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((d) => {
                const v = byDay[d.iso];
                const isSel = sel === d.iso;
                return (
                  <button key={d.iso} title={d.future ? "" : `${fmtTgl(d.iso)}${v ? ` — ${rp(v.total)} (${v.count})` : " — tidak ada"}`}
                    disabled={d.future || !v}
                    onClick={() => setSel(isSel ? null : d.iso)}
                    className="rounded-[2px]"
                    style={{ width: 13, height: 13, background: cellColor(d.iso, d.future), border: isSel ? `2px solid ${T.brand}` : `1px solid ${d.future ? "transparent" : T.line}`, cursor: d.future || !v ? "default" : "pointer" }} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px]" style={{ color: T.sub }}>
        <span>Rendah</span>
        {[T.bg, "#FDE68A", "#FBBF24", "#F97316", T.red].map((c, n) => (
          <span key={n} className="rounded-[2px]" style={{ width: 13, height: 13, background: c, border: `1px solid ${T.line}`, display: "inline-block" }} />
        ))}
        <span>Tinggi</span>
      </div>
      {selData && (
        <div className="mt-3 rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold">{fmtTgl(sel)}</p>
            <p className="text-xs font-bold" style={{ fontFamily: MONO, color: T.red }}>{rp(selData.total)} · {selData.count} debitur</p>
          </div>
          <div className="space-y-1">
            {selData.list.map((i) => (
              <button key={i.id} onClick={() => onOpen(i.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-black/5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: T[i.kol.tone] }} />
                <span className="min-w-0 flex-1 truncate text-xs">{i.customer}</span>
                <span className="shrink-0 text-[11px]" style={{ color: T.sub }}>{i.daysOverdue > 0 ? `telat ${i.daysOverdue} hr` : "belum JT"}</span>
                <span className="shrink-0 text-xs font-bold" style={{ fontFamily: MONO }}>{rpc(i.total)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ----- 3. Matriks Bucket × Petugas ----- */
function MatrixHeat({ rows, s }) {
  const { officers, colMax, colTot } = useMemo(() => {
    const map = {};
    const ensure = (n) => { if (!map[n]) { map[n] = {}; BUCKET_META.forEach((b) => (map[n][b.key] = { total: 0, count: 0 })); } };
    (s?.petugas || []).forEach(ensure);
    rows.forEach((i) => {
      if (i.status === "lunas") return;
      const n = i.assignedTo || "Belum ditugaskan";
      ensure(n);
      if (map[n][i.bucket]) { map[n][i.bucket].total += i.total; map[n][i.bucket].count++; }
    });
    const officers = Object.keys(map).map((n) => ({ nama: n, cells: map[n] }));
    officers.sort((a, b) => {
      const sum = (o) => BUCKET_META.reduce((x, b) => x + o.cells[b.key].total, 0);
      return sum(b) - sum(a);
    });
    const colMax = {}; const colTot = {};
    BUCKET_META.forEach((b) => {
      colMax[b.key] = Math.max(1, ...officers.map((o) => o.cells[b.key].total));
      colTot[b.key] = officers.reduce((a, o) => a + o.cells[b.key].total, 0);
    });
    return { officers, colMax, colTot };
  }, [rows, s]);

  /* Tiap bucket punya warna dasar sendiri; pekatnya mengikuti bobot dalam kolom itu. */
  const cellBg = (total, key) => {
    if (!total) return T.bg;
    const a = 0.18 + 0.78 * Math.min(1, total / colMax[key]);
    const h = Math.round(a * 255).toString(16).padStart(2, "0");
    return bucketColor(key) + h;
  };

  return (
    <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
      <h2 className="mb-1 text-sm font-semibold">Matriks Portofolio — Petugas × Bucket DPD</h2>
      <p className="mb-3 text-xs" style={{ color: T.sub }}>Tiap kolom DPD punya gradasi warna sendiri — <span style={{ color: BUCKET_META[0].color, fontWeight: 600 }}>Current hijau</span>, makin lama makin <span style={{ color: BUCKET_META[4].color, fontWeight: 600 }}>merah pekat</span>. Pekatnya sel mengikuti besar outstanding.</p>
      {officers.length === 0 ? (
        <p className="text-xs" style={{ color: T.sub }}>Belum ada data petugas / tagihan aktif.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 p-2 text-left font-semibold" style={{ background: T.surface, color: T.sub }}>Petugas</th>
                {BUCKET_META.map((b) => (
                  <th key={b.key} className="p-2 text-center font-semibold" style={{ color: "#fff", background: b.color, borderRight: `2px solid ${T.surface}` }}>{b.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.nama}>
                  <td className="sticky left-0 z-10 max-w-[120px] truncate p-2 font-medium" style={{ background: T.surface, color: T.ink }}>{o.nama}</td>
                  {BUCKET_META.map((b) => {
                    const c = o.cells[b.key];
                    const strong = c.total / colMax[b.key] > 0.45;
                    return (
                      <td key={b.key} className="p-1.5 text-center" style={{ background: cellBg(c.total, b.key), color: strong ? "#fff" : T.ink, border: `1px solid ${T.surface}` }}>
                        {c.count > 0 ? (
                          <>
                            <div className="font-bold" style={{ fontFamily: MONO }}>{rpc(c.total)}</div>
                            <div style={{ fontSize: 10, opacity: 0.85 }}>{c.count} akun</div>
                          </>
                        ) : (
                          <span style={{ color: T.sub }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 p-2 font-semibold" style={{ background: T.surface, color: T.sub }}>Total</td>
                {BUCKET_META.map((b) => (
                  <td key={b.key} className="p-2 text-center font-bold" style={{ fontFamily: MONO, color: T.ink, borderTop: `2px solid ${T.line}` }}>{colTot[b.key] ? rpc(colTot[b.key]) : "—"}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function HeatMapView({ rows, allRows, s, onOpen }) {
  const [view, setView] = useState("geo");
  const VIEWS = [["geo", "Geografis", MapPin], ["kalender", "Kalender", CalendarDays], ["matriks", "Matriks", Grid3x3]];
  return (
    <div className="mt-4 space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        {VIEWS.map(([k, lbl, Ic]) => (
          <button key={k} onClick={() => setView(k)}
            className="kpress flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors sm:text-sm"
            style={view === k ? { background: T.brand, color: "#fff" } : { color: T.sub }}>
            <Ic size={15} /> {lbl}
          </button>
        ))}
      </div>
      {view === "geo" && <div className="sub-fade"><GeoHeat rows={rows} /></div>}
      {view === "kalender" && <div className="sub-fade"><CalHeat rows={rows} onOpen={onOpen} /></div>}
      {view === "matriks" && <div className="sub-fade"><MatrixHeat rows={allRows} s={s} /></div>}
    </div>
  );
}

function Settingstab({ data, setData, onReset, onClear, flash, copy, onBackup, onRestore, role, tenantName, onLogout }) {
  const s = data.settings;
  const isAtasan = role === "atasan";
  const upd = (k, v) => setData((d) => ({ ...d, settings: { ...d.settings, [k]: v } }));
  const [newP, setNewP] = useState("");
  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <h2 className="mb-3 text-sm font-semibold">Tema tampilan</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(THEMES).map(([key, fam]) => {
            const active = s.tema === key;
            const th = fam[s.gelap ? "dark" : "light"];
            return (
              <button key={key} onClick={() => upd("tema", key)}
                className="rounded-lg p-2.5 text-left transition-colors"
                style={{ background: th.bg, border: `2px solid ${active ? th.brand : th.line}` }}>
                <div className="mb-2 flex gap-1">
                  <span className="h-4 w-4 rounded-full" style={{ background: th.brand }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: th.brass }} />
                  <span className="h-4 w-4 rounded-full" style={{ background: th.surface, border: `1px solid ${th.line}` }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: th.ink }}>
                  {fam.name}{active && <Check size={12} style={{ color: th.brand }} />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: s.gelap ? T.brand2 + "1A" : T.brass + "1A", color: s.gelap ? T.brand2 : T.brass }}>
              {s.gelap ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <div>
              <p className="text-xs font-semibold">Mode gelap</p>
              <p className="text-[11px]" style={{ color: T.sub }}>Berlaku untuk semua tema di atas</p>
            </div>
          </div>
          <button onClick={() => upd("gelap", !s.gelap)} role="switch" aria-checked={s.gelap} aria-label="Mode gelap"
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors" style={{ background: s.gelap ? T.brand2 : T.line }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white" style={{ left: 2, transform: s.gelap ? "translateX(20px)" : "none", transition: "transform .2s cubic-bezier(.22,.61,.36,1)", boxShadow: "0 1px 3px rgba(0,0,0,.35)" }} />
          </button>
        </div>
      </section>

      <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <h2 className="mb-3 text-sm font-semibold">Profil</h2>
        <div className="space-y-3">
          <Field label="Nama perusahaan (muncul di surat & reminder)">
            <input className={inputCls} style={inputSt} value={s.perusahaan} onChange={(e) => upd("perusahaan", e.target.value)} placeholder="mis. PT …" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kota (tanda tangan surat)">
              <input className={inputCls} style={inputSt} value={s.kota} onChange={(e) => upd("kota", e.target.value)} placeholder="mis. Surabaya" />
            </Field>
            <Field label="Jabatan penanda tangan">
              <input className={inputCls} style={inputSt} value={s.jabatan} onChange={(e) => upd("jabatan", e.target.value)} placeholder="mis. Kuasa Hukum" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Denda per hari (%)">
              <input type="number" step="0.01" className={inputCls} style={inputSt} value={s.dendaRatePct} onChange={(e) => upd("dendaRatePct", Number(e.target.value))} />
            </Field>
            <Field label="Ambang follow-up (hari)">
              <input type="number" className={inputCls} style={inputSt} value={s.followUpDays} onChange={(e) => upd("followUpDays", Number(e.target.value))} />
            </Field>
          </div>
          <p className="text-xs" style={{ color: T.sub }}>Denda {s.dendaRatePct}%/hari = {(s.dendaRatePct * 30).toFixed(1)}% per bulan. “Perlu ditagih ulang” muncul kalau invoice belum disentuh lebih dari {s.followUpDays} hari.</p>
        </div>
      </section>

      <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <h2 className="mb-3 text-sm font-semibold">Tim &amp; peran</h2>
        {isAtasan ? (
          <>
            <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Mode tampilan</p>
            <div className="mb-3 flex gap-1.5">
              {[["atasan", "Atasan"], ["petugas", "Petugas"]].map(([v, lbl]) => (
                <button key={v} onClick={() => upd("peran", v)} className="flex-1 rounded-lg py-2 text-sm font-semibold"
                  style={s.peran === v ? { background: T.brand, color: "#fff" } : { background: T.bg, color: T.sub, border: `1px solid ${T.line}` }}>{lbl}</button>
              ))}
            </div>
          </>
        ) : (
          <p className="mb-3 text-[11px]" style={{ color: T.sub }}>Anda masuk sebagai <b style={{ color: T.brand2 }}>Petugas</b>. Pilih nama Anda di bawah; hanya tagihan yang ditugaskan ke Anda yang tampil.</p>
        )}
        {s.peran === "petugas" && (
          <div className="mb-3"><Field label="Saya petugas">
            <select className={inputCls} style={inputSt} value={s.petugasAktif} onChange={(e) => upd("petugasAktif", e.target.value)}>
              <option value="">— pilih nama —</option>
              {(s.petugas || []).map((nm) => <option key={nm} value={nm}>{nm}</option>)}
            </select>
          </Field>
          <p className="mt-1 text-[11px]" style={{ color: T.sub }}>Mode petugas hanya menampilkan akun yang ditugaskan ke nama ini.</p></div>
        )}
        {isAtasan && (
          <>
            <p className="mb-1.5 text-[11px] font-semibold" style={{ color: T.sub }}>Daftar petugas & target tagih bulanan</p>
            <div className="mb-2 space-y-1.5">
              {(s.petugas || []).length === 0 && <span className="text-xs" style={{ color: T.sub }}>Belum ada petugas.</span>}
              {(s.petugas || []).map((nm) => (
                <div key={nm} className="flex items-center gap-2 rounded-lg p-2" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: T.ink }}>{nm}</span>
                  <span className="text-[11px]" style={{ color: T.sub }}>Target</span>
                  <input value={grpID((s.targets || {})[nm] || "")} onChange={(e) => upd("targets", { ...(s.targets || {}), [nm]: Number(onlyDigits(e.target.value)) || 0 })}
                    inputMode="numeric" placeholder="0" className="w-28 rounded-lg px-2 py-1 text-right text-xs" style={{ ...inputSt, fontFamily: MONO }} />
                  <button onClick={() => { upd("petugas", s.petugas.filter((x) => x !== nm)); const t = { ...(s.targets || {}) }; delete t[nm]; upd("targets", t); }}><X size={14} style={{ color: T.sub }} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newP} onChange={(e) => setNewP(e.target.value)} placeholder="Nama petugas baru" className={inputCls} style={inputSt} />
              <button onClick={() => { const n = newP.trim(); if (n && !(s.petugas || []).includes(n)) { upd("petugas", [...(s.petugas || []), n]); setNewP(""); } }}
                className="shrink-0 rounded-lg px-3 text-xs font-semibold text-white" style={{ background: T.brand }}>Tambah</button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="mb-1 flex items-center gap-2">
          <Cloud size={16} style={{ color: T.brand2 }} />
          <h2 className="text-sm font-semibold">Sesi &amp; sinkron</h2>
        </div>
        <p className="mb-3 text-xs" style={{ color: T.sub }}>Data otomatis tersinkron ke server untuk institusi ini. Buka di perangkat lain dengan kode yang sama.</p>
        <div className="rounded-lg p-3" style={{ background: T.bg, border: `1px solid ${T.line}` }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Institusi</span>
            <span className="text-sm font-semibold" style={{ color: T.ink }}>{tenantName || "—"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px]" style={{ color: T.sub }}>Peran login</span>
            <span className="text-xs font-semibold" style={{ color: T.brand2 }}>{isAtasan ? "Atasan" : "Petugas"}</span>
          </div>
        </div>
        <button onClick={onLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold" style={{ background: T.bg, color: T.red, border: `1px solid ${T.line}` }}>
          <LogOut size={15} /> Keluar / ganti institusi
        </button>
      </section>

      <section className="rounded-xl p-4 shadow-sm" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <h2 className="mb-2 text-sm font-semibold">Data &amp; backup</h2>
        <p className="mb-3 text-xs" style={{ color: T.sub }}>Data tersimpan otomatis di perangkat ini. Pakai backup JSON untuk pindah perangkat tanpa cloud.</p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button onClick={onBackup} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold" style={{ background: T.bg, color: T.brand2, border: `1px solid ${T.line}` }}><Download size={15} /> Backup JSON</button>
          {isAtasan && <button onClick={onRestore} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold" style={{ background: T.bg, color: T.ink, border: `1px solid ${T.line}` }}><Upload size={15} /> Pulihkan</button>}
        </div>
        {isAtasan && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={onClear} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold sm:flex-1" style={{ background: T.bg, color: T.ink, border: `1px solid ${T.line}` }}>
              <Trash2 size={15} /> Kosongkan semua tagihan
            </button>
            <button onClick={onReset} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold sm:flex-1" style={{ background: T.bg, color: T.brand2, border: `1px solid ${T.line}` }}>
              <RotateCcw size={15} /> Muat ulang data contoh
            </button>
          </div>
        )}
      </section>

      <p className="text-center text-xs" style={{ color: T.sub }}>Kolekta · prototipe collection control</p>
    </div>
  );
}

/* ---------- Layar Login (gerbang sebelum app) ---------- */
function LoginScreen({ onLogin }) {
  const th = themePalette("hutan", false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [adminMode, setAdminMode] = useState(false);

  const submit = async () => {
    const c = code.trim();
    if (!c) return setErr("Masukkan kode akses.");
    setBusy(true); setErr("");
    try { await onLogin(c); }
    catch (e) { setErr(e.message === "Kode tidak dikenal" ? "Kode tidak dikenal / salah." : ("Gagal masuk: " + e.message)); setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-5" style={{ background: th.bg, color: th.ink, fontFamily: SANS }}>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm" style={{ background: th.surface, border: `1px solid ${th.line}` }}>
            <Logo size={64} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: th.brand }}>Kolekta</h1>
            <p className="text-xs" style={{ color: th.brass }}>collection control</p>
          </div>
        </div>

        {!adminMode ? (
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: th.surface, border: `1px solid ${th.line}` }}>
            <h2 className="mb-1 text-sm font-semibold">Masuk</h2>
            <p className="mb-3 text-xs" style={{ color: th.sub }}>Masukkan kode akses institusi Anda (diberikan oleh admin).</p>
            <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="mis. KOL-XXXX-XXXX" className="w-full rounded-lg px-3 py-2.5 text-sm tracking-wide outline-none"
              style={{ background: th.bg, border: `1px solid ${th.line}`, color: th.ink, fontFamily: MONO }} />
            {err && <p className="mt-2 text-[12px]" style={{ color: th.red }}>{err}</p>}
            <button disabled={busy} onClick={submit}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
              style={{ background: th.brand, opacity: busy ? 0.6 : 1 }}>
              <Lock size={15} /> {busy ? "Memeriksa…" : "Masuk"}
            </button>
            <button onClick={() => { setErr(""); setAdminMode(true); }} className="mt-3 w-full text-[11px] font-semibold" style={{ color: th.brand2 }}>
              Panel admin
            </button>
          </div>
        ) : (
          <AdminPanel th={th} onBack={() => setAdminMode(false)} />
        )}

        <p className="mt-5 text-center text-[11px] leading-relaxed" style={{ color: th.sub }}>
          by <span style={{ color: th.brand2, fontWeight: 600 }}>KNSL</span> · Kansil Network Solutions Labs
        </p>
      </div>
    </div>
  );
}

/* ---------- Panel admin: kelola institusi & kode (butuh rahasia admin) ---------- */
function AdminPanel({ th, onBack }) {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [name, setName] = useState("");
  const [custom, setCustom] = useState(false);
  const [cAtasan, setCAtasan] = useState("");
  const [cPetugas, setCPetugas] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [delId, setDelId] = useState("");   // tenant yang sedang dikonfirmasi hapus
  const [delCode, setDelCode] = useState(""); // input kode konfirmasi (harus 12345)

  const DELETE_CODE = "12345";

  const errText = (m) => {
    if (/code_taken/.test(m)) return "Kode sudah dipakai institusi lain.";
    if (/both_codes_required/.test(m)) return "Isi kode atasan dan petugas.";
    if (/codes_must_differ/.test(m)) return "Kode atasan dan petugas harus berbeda.";
    if (/invalid_admin/.test(m)) return "Rahasia / kode admin salah.";
    if (/tenant_required/.test(m)) return "Institusi tidak ditemukan.";
    return "Gagal: " + m;
  };

  const askDelete = (id) => { setDelId(id); setDelCode(""); setMsg(""); };
  const cancelDelete = () => { setDelId(""); setDelCode(""); };
  const confirmDelete = async (t) => {
    if (delCode.trim() !== DELETE_CODE) return setMsg("Kode hapus salah. Ketik 12345 untuk menghapus.");
    setBusy(true); setMsg("");
    try {
      await sbAdminDelete(secret, t.tenant_id);
      setRows(await sbAdminList(secret));
      cancelDelete();
      setMsg(`Institusi "${t.name}" dihapus ✓`);
    } catch (e) { setMsg(errText(e.message)); }
    setBusy(false);
  };

  const open = async () => {
    if (!secret.trim()) return setMsg("Masukkan rahasia admin.");
    setBusy(true); setMsg("");
    try { setRows(await sbAdminList(secret)); setAuthed(true); }
    catch (e) { setMsg(errText(e.message)); }
    setBusy(false);
  };
  const create = async () => {
    if (!name.trim()) return setMsg("Isi nama institusi.");
    if (custom && (!cAtasan.trim() || !cPetugas.trim())) return setMsg("Isi kode atasan dan petugas.");
    setBusy(true); setMsg("");
    try {
      await sbAdminCreate(secret, name.trim(), custom ? cAtasan : "", custom ? cPetugas : "");
      setName(""); setCAtasan(""); setCPetugas("");
      setRows(await sbAdminList(secret)); setMsg("Institusi dibuat ✓");
    } catch (e) { setMsg(errText(e.message)); }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ background: th.surface, border: `1px solid ${th.line}` }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold"><ShieldCheck size={15} style={{ color: th.brand2 }} /> Panel admin</h2>
        <button onClick={onBack} className="text-[11px] font-semibold" style={{ color: th.sub }}>← Kembali</button>
      </div>

      {!authed ? (
        <>
          <p className="mb-2 text-xs" style={{ color: th.sub }}>Masukkan rahasia atau kode admin untuk membuat/melihat institusi & kodenya.</p>
          <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} onKeyDown={(e) => e.key === "Enter" && open()}
            placeholder="rahasia / kode admin" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
            style={{ background: th.bg, border: `1px solid ${th.line}`, color: th.ink, fontFamily: MONO }} />
          <button disabled={busy} onClick={open} className="mt-3 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: th.brand, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Membuka…" : "Buka"}
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 rounded-lg p-2.5" style={{ background: th.bg, border: `1px solid ${th.line}` }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !custom && create()} placeholder="Nama institusi baru"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: th.surface, border: `1px solid ${th.line}`, color: th.ink }} />
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px]" style={{ color: th.sub }}>
              <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} />
              Tentukan kode sendiri (kosongkan = digenerate otomatis)
            </label>
            {custom && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input value={cAtasan} onChange={(e) => setCAtasan(e.target.value)} placeholder="Kode atasan"
                  className="min-w-0 rounded-lg px-2.5 py-2 text-xs outline-none" style={{ background: th.surface, border: `1px solid ${th.line}`, color: th.ink, fontFamily: MONO }} />
                <input value={cPetugas} onChange={(e) => setCPetugas(e.target.value)} placeholder="Kode petugas (bawahan)"
                  className="min-w-0 rounded-lg px-2.5 py-2 text-xs outline-none" style={{ background: th.surface, border: `1px solid ${th.line}`, color: th.ink, fontFamily: MONO }} />
              </div>
            )}
            <button disabled={busy} onClick={create} className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-white" style={{ background: th.brand, opacity: busy ? 0.6 : 1 }}>
              {busy ? "Menyimpan…" : "+ Buat institusi"}
            </button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 && <p className="text-xs" style={{ color: th.sub }}>Belum ada institusi.</p>}
            {rows.map((t) => (
              <div key={t.tenant_id} className="rounded-lg p-2.5" style={{ background: th.bg, border: `1px solid ${th.line}` }}>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: th.ink }}>{t.name}</p>
                  {delId !== t.tenant_id && (
                    <button onClick={() => askDelete(t.tenant_id)} title="Hapus institusi"
                      className="shrink-0 rounded-md p-1.5" style={{ color: th.red, border: `1px solid ${th.line}`, background: th.surface }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]" style={{ fontFamily: MONO }}>
                  <div><span style={{ color: th.sub }}>Atasan</span><br /><span style={{ color: th.brand, fontWeight: 600 }}>{t.atasan_code}</span></div>
                  <div><span style={{ color: th.sub }}>Petugas</span><br /><span style={{ color: th.brand2, fontWeight: 600 }}>{t.petugas_code}</span></div>
                </div>
                {delId === t.tenant_id && (
                  <div className="mt-2 rounded-lg p-2.5" style={{ background: th.surface, border: `1px solid ${th.red}` }}>
                    <p className="mb-2 text-[12px]" style={{ color: th.red }}>
                      Hapus <b>{t.name}</b> permanen beserta seluruh datanya? Ketik kode <b style={{ fontFamily: MONO }}>12345</b> untuk konfirmasi.
                    </p>
                    <input value={delCode} onChange={(e) => setDelCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmDelete(t)}
                      inputMode="numeric" placeholder="Kode hapus" autoFocus
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: th.bg, border: `1px solid ${th.line}`, color: th.ink, fontFamily: MONO }} />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button disabled={busy} onClick={cancelDelete}
                        className="rounded-lg py-2 text-xs font-semibold" style={{ background: th.bg, color: th.ink, border: `1px solid ${th.line}` }}>Batal</button>
                      <button disabled={busy || delCode.trim() !== DELETE_CODE} onClick={() => confirmDelete(t)}
                        className="rounded-lg py-2 text-xs font-semibold text-white" style={{ background: th.red, opacity: busy || delCode.trim() !== DELETE_CODE ? 0.5 : 1 }}>
                        {busy ? "Menghapus…" : "Hapus permanen"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {msg && <p className="mt-2 text-[12px]" style={{ color: /✓/.test(msg) ? th.green : th.red }}>{msg}</p>}
    </div>
  );
}
