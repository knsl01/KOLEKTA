/* ---------- Generator surat, dokumen & teks penagihan (murni) ---------- */
/* Hanya menghasilkan string/objek teks — tidak menyentuh DOM, XLSX, React, atau palet tema (T). */

import { rp, fmtTgl, today0, greeting } from "./format.js";
import { stLabel } from "./constants.js";

export function waLink(phone, text) {
  let d = (phone || "").replace(/[^0-9]/g, "");
  if (!d) return null;
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export const recoLevel = (i) => {
  const d = i.daysOverdue;
  const hasJ = i.jaminanTipe && i.jaminanTipe !== "none";
  if (hasJ && d > 120) return "tarik";
  if (d > 60) return "somasi";
  if (d > 30) return "sp";
  if (d > 14) return "tegas";
  return "reminder";
};

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const isPerorangan = (i) => (i.tipe || "perusahaan") === "perorangan";

export function debtorBlock(i) {
  const alamat = i.alamat?.trim();
  const pic = i.pic?.trim();
  const baris = alamat ? alamat + "\n" : "";
  if (isPerorangan(i)) return `Kepada Yth.\nSdr./Sdri. ${i.customer}\n${baris}di Tempat`;
  return `Kepada Yth.\nManajemen ${i.customer}\n${pic ? "u.p. Bapak/Ibu " + pic + "\n" : ""}${baris}di Tempat`;
}
export function sapaanWA(i) {
  const pic = i.pic?.trim();
  if (isPerorangan(i)) return `Bapak/Ibu ${i.customer}`;
  return pic ? `Bapak/Ibu ${pic}` : `Bapak/Ibu dari ${i.customer}`;
}
export function jaminanKlausa(i) {
  const t = i.jaminanTipe;
  const j = i.jaminan?.trim();
  if (!j || !t || t === "none") return "";
  if (t === "fidusia")
    return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut dijamin dengan jaminan fidusia berupa ${j}. Apabila Saudara tetap lalai memenuhi kewajiban, kami berhak melakukan eksekusi atas objek jaminan fidusia tersebut — termasuk penarikan dan penjualannya untuk pelunasan — sesuai Undang-Undang Nomor 42 Tahun 1999 tentang Jaminan Fidusia.`;
  if (t === "tanah")
    return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut dijamin dengan Hak Tanggungan atas ${j}. Apabila Saudara tetap lalai, kami berhak menempuh eksekusi Hak Tanggungan atas objek jaminan tersebut sesuai Undang-Undang Nomor 4 Tahun 1996 tentang Hak Tanggungan.`;
  return `\n\nPerlu kami sampaikan bahwa kewajiban tersebut disertai jaminan berupa ${j}, yang dapat kami tindaklanjuti sesuai ketentuan perjanjian dan peraturan yang berlaku apabila kewajiban tidak dipenuhi.`;
}

export function escalationDocs(i, s) {
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

  const rincian = `No. Invoice/Tagihan : ${i.noInvoice}
Tanggal Jatuh Tempo : ${fmtTgl(i.tglJatuhTempo)}
Lama Keterlambatan  : ${i.daysOverdue} hari
Pokok / AR          : ${rp(pokok)}${barisBayar}
Denda Keterlambatan : ${rp(i.denda)}
Total Kewajiban     : ${rp(i.total)}`;

  const sp = `${kopLine(s)}
SURAT PERINGATAN

[[RIGHT]]${ttdKota}

Nomor    : ${noSurat("SP")}
Lampiran : -
Hal      : Peringatan Keterlambatan Pembayaran

${debtorBlock(i)}

Dengan hormat,

Sehubungan dengan kedudukan kami selaku ${p} (selanjutnya disebut "Kreditur") dan Saudara selaku pihak yang berkewajiban (selanjutnya disebut "Debitur"), perkenankan kami menyampaikan peringatan atas kewajiban pembayaran Saudara yang telah melewati tanggal jatuh tempo, dengan rincian sebagai berikut:

${rincian}

Bahwa berdasarkan Pasal 1238 dan Pasal 1243 Kitab Undang-Undang Hukum Perdata, kewajiban yang telah jatuh tempo dan dapat ditagih namun tidak dipenuhi menempatkan Debitur dalam keadaan lalai (wanprestasi).${jaminanKlausa(i)}

Untuk itu, dengan ini kami menyampaikan PERINGATAN agar Saudara menyelesaikan seluruh kewajiban sebesar ${rp(i.total)} selambat-lambatnya dalam waktu 7 (tujuh) hari kalender terhitung sejak surat ini diterima.

Apabila sampai dengan batas waktu tersebut pembayaran belum kami terima, kami berhak menempuh upaya penagihan lebih lanjut sesuai ketentuan yang berlaku, termasuk pengenaan denda berjalan, penyampaian somasi, hingga langkah hukum, dengan segala biaya yang timbul menjadi beban Saudara.

Demikian surat peringatan ini kami sampaikan untuk menjadi perhatian dan dilaksanakan sebagaimana mestinya.

Hormat kami,
${p}


(__________________________)
${jabatan}`;

  const somasi = `${kopLine(s)}
SOMASI

[[RIGHT]]${ttdKota}

Nomor    : ${noSurat("SOM")}
Lampiran : -
Hal      : Somasi (Teguran) atas Tunggakan Pembayaran

${debtorBlock(i)}

Dengan hormat,

Kami, ${p} (selanjutnya disebut "Kreditur"), dengan ini menyampaikan SOMASI (teguran) kepada Saudara selaku Debitur sehubungan dengan kewajiban pembayaran yang telah jatuh tempo namun hingga saat ini belum diselesaikan, dengan dasar dan uraian sebagai berikut:

1. Bahwa antara Kreditur dan Debitur terdapat hubungan hukum utang-piutang yang sah berdasarkan tagihan ${i.noInvoice}, sehingga Debitur berkewajiban melakukan pembayaran kepada Kreditur;

2. Bahwa kewajiban Debitur tersebut telah jatuh tempo dan dapat ditagih (opeisbaar), dengan rincian sebagai berikut:

${rincian}

3. Bahwa sampai dengan tanggal Somasi ini Debitur belum memenuhi kewajibannya, sehingga Debitur berada dalam keadaan lalai (wanprestasi) sebagaimana dimaksud dalam Pasal 1238 dan Pasal 1243 Kitab Undang-Undang Hukum Perdata.${jaminanKlausa(i)}

Berdasarkan hal-hal tersebut, kami MENEGUR dan meminta Saudara untuk melunasi seluruh kewajiban sebesar ${rp(i.total)} dalam waktu 7 (tujuh) hari kalender terhitung sejak Somasi ini diterima.

Apabila dalam tenggang waktu tersebut Saudara tetap tidak memenuhi kewajiban, maka dengan sangat menyesal kami akan menempuh segala upaya hukum yang diperlukan guna melindungi hak kami, baik melalui gugatan perdata, eksekusi jaminan, maupun mekanisme penyelesaian sengketa lainnya sesuai ketentuan yang berlaku, dengan segala biaya yang timbul menjadi tanggungan Saudara.

Demikian Somasi ini kami sampaikan dengan itikad baik untuk dilaksanakan sebagaimana mestinya.

Hormat kami,
${p}


(__________________________)
${jabatan}`;

  let tarik = null;
  if (i.jaminanTipe === "fidusia") {
    tarik = `${kopLine(s)}
SURAT PEMBERITAHUAN PENARIKAN OBJEK JAMINAN FIDUSIA

[[RIGHT]]${ttdKota}

Nomor    : ${noSurat("FID")}
Lampiran : -
Hal      : Pemberitahuan Penarikan/Eksekusi Objek Jaminan Fidusia

${debtorBlock(i)}

Dengan hormat,

Menunjuk perjanjian pembiayaan/utang-piutang beserta Akta Jaminan Fidusia atas objek jaminan, serta surat peringatan dan/atau somasi yang telah kami sampaikan sebelumnya, dengan ini kami, ${p} selaku Penerima Fidusia, menyampaikan hal-hal sebagai berikut:

1. Bahwa Debitur memiliki kewajiban yang telah jatuh tempo dan belum diselesaikan, dengan rincian:

${rincian}

2. Bahwa kelalaian Debitur memenuhi kewajiban tersebut merupakan wanprestasi yang memberikan hak kepada Penerima Fidusia untuk melakukan eksekusi atas objek jaminan fidusia berupa:
${i.jaminan || "(uraian objek jaminan)"}

3. Bahwa eksekusi Jaminan Fidusia dilaksanakan berdasarkan Undang-Undang Nomor 42 Tahun 1999 tentang Jaminan Fidusia juncto Putusan Mahkamah Konstitusi Nomor 18/PUU-XVII/2019 dan Nomor 2/PUU-XIX/2021, yang mensyaratkan adanya kesepakatan mengenai telah terjadinya cidera janji dan kesediaan Debitur menyerahkan objek jaminan secara sukarela; apabila tidak tercapai kesepakatan, eksekusi ditempuh melalui permohonan eksekusi pada Pengadilan Negeri.

Oleh karena itu, kami mengimbau Saudara dalam waktu 3 (tiga) hari kalender sejak surat ini untuk: (a) melunasi seluruh kewajiban sebesar ${rp(i.total)}; atau (b) menyerahkan objek jaminan secara sukarela kepada kami guna penyelesaian kewajiban, yang akan dituangkan dalam Berita Acara Serah Terima.

Demikian pemberitahuan ini kami sampaikan untuk menjadi perhatian.

Hormat kami,
${p}


(__________________________)
${jabatan}`;
  } else if (i.jaminanTipe === "tanah") {
    tarik = `${kopLine(s)}
SURAT PEMBERITAHUAN RENCANA LELANG EKSEKUSI HAK TANGGUNGAN

[[RIGHT]]${ttdKota}

Nomor    : ${noSurat("HT")}
Lampiran : -
Hal      : Pemberitahuan Rencana Lelang Eksekusi Hak Tanggungan

${debtorBlock(i)}

Dengan hormat,

Menunjuk perjanjian utang-piutang beserta Akta Pemberian Hak Tanggungan, serta surat peringatan dan/atau somasi yang telah kami sampaikan sebelumnya, dengan ini kami, ${p} selaku pemegang Hak Tanggungan, menyampaikan hal-hal sebagai berikut:

1. Bahwa Debitur memiliki kewajiban yang telah jatuh tempo dan belum diselesaikan, dengan rincian:

${rincian}

2. Bahwa atas kelalaian (wanprestasi) tersebut, sesuai Pasal 6 Undang-Undang Nomor 4 Tahun 1996 tentang Hak Tanggungan, pemegang Hak Tanggungan pertama berhak menjual objek Hak Tanggungan atas kekuasaan sendiri (parate eksekusi) melalui pelelangan umum;

3. Bahwa kami memberitahukan rencana pelaksanaan lelang eksekusi melalui Kantor Pelayanan Kekayaan Negara dan Lelang (KPKNL) atas objek jaminan berupa:
${i.jaminan || "(uraian objek jaminan)"}

Sehubungan dengan itu, kami mengimbau Saudara dalam waktu 7 (tujuh) hari kalender sejak surat ini untuk menyelesaikan seluruh kewajiban sebesar ${rp(i.total)} guna menghindari pelaksanaan lelang dimaksud.

Demikian pemberitahuan ini kami sampaikan untuk menjadi perhatian.

Hormat kami,
${p}


(__________________________)
${jabatan}`;
  } else if (i.jaminanTipe && i.jaminanTipe !== "none") {
    tarik = `${kopLine(s)}
SURAT PEMBERITAHUAN EKSEKUSI OBJEK JAMINAN

[[RIGHT]]${ttdKota}

Nomor    : ${noSurat("EKS")}
Lampiran : -
Hal      : Pemberitahuan Eksekusi atas Objek Jaminan

${debtorBlock(i)}

Dengan hormat,

Menunjuk perjanjian utang-piutang beserta pengikatan jaminan, serta surat peringatan dan/atau somasi yang telah kami sampaikan sebelumnya, dengan ini kami, ${p}, menyampaikan hal-hal sebagai berikut:

1. Bahwa Debitur memiliki kewajiban yang telah jatuh tempo dan belum diselesaikan, dengan rincian:

${rincian}

2. Bahwa atas kelalaian (wanprestasi) tersebut, kami memberitahukan rencana tindak lanjut/eksekusi atas objek jaminan berupa:
${i.jaminan || "(uraian objek jaminan)"}
sesuai ketentuan perjanjian dan peraturan perundang-undangan yang berlaku.

Sehubungan dengan itu, kami mengimbau Saudara dalam waktu 7 (tujuh) hari kalender sejak surat ini untuk menyelesaikan seluruh kewajiban sebesar ${rp(i.total)} guna menghindari pelaksanaan tindak lanjut dimaksud.

Demikian pemberitahuan ini kami sampaikan untuk menjadi perhatian.

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

// Versi teks polos (untuk disalin ke clipboard / WA) — buang penanda tata letak.
export function docToPlain(text) {
  return (text || "")
    .replace(/^\[\[KOP\|(.*)\]\]$/gm, (_, g) => g.split("|").filter(Boolean).join("\n"))
    .replace(/^\[\[RIGHT\]\]/gm, "")
    .replace(/\[\[\/?SIGGRID\]\]\n?/g, "")
    .replace(/^cap\|(.*)\|(.*)$/gm, (_, a, b) => `${a}\t\t${b}`)
    .replace(/^sig\|.*$/gm, "")
    .replace(/^name\|(.*)\|(.*)$/gm, (_, a, b) => `${a}\t\t${b}`)
    .replace(/\[\[SIGN\d?\]\]/g, "(__________________________)")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function fieldBase(s) {
  const p = s.perusahaan?.trim() || "[Nama Perusahaan Anda]";
  const kota = s.kota?.trim();
  const jabatan = s.jabatan?.trim() || "Petugas Penagihan";
  const tgl = fmtTgl(today0().toISOString().slice(0, 10));
  return { p, jabatan, ttdKota: `${kota ? kota + ", " : ""}${tgl}` };
}
// Kop surat (letterhead) dari profil institusi. Pakai "/" pengganti "|" agar parser aman.
export function kopLine(s) {
  const p = (s.perusahaan?.trim() || "[Nama Perusahaan Anda]").replace(/\|/g, "/");
  const alamat = (s.alamatKantor?.trim() || "").replace(/\|/g, "/");
  const kontak = (s.kontakKantor?.trim() || "").replace(/\|/g, "/");
  return `[[KOP|${p}|${alamat}|${kontak}]]`;
}
export function suratPernyataan(i, s, f) {
  const { p, ttdKota } = fieldBase(s);
  const ar = i.sisaPokok ?? i.nominal;
  return `SURAT PERNYATAAN KESANGGUPAN PEMBAYARAN

Yang bertanda tangan di bawah ini:
Nama    : ${i.customer}
Alamat  : ${i.alamat || "-"}${i.pic ? `\nJabatan : ${i.pic}` : ""}

dalam hal ini bertindak untuk dan atas nama diri sendiri/badan usaha tersebut di atas (selanjutnya disebut "Pihak yang Menyatakan"), dengan ini menyatakan dengan sebenarnya dan tanpa paksaan dari pihak manapun, sebagai berikut:

1. Bahwa Pihak yang Menyatakan mengakui memiliki kewajiban pembayaran kepada ${p} dengan rincian:

No. Tagihan     : ${i.noInvoice}
Pokok / AR      : ${rp(ar)}
Denda           : ${rp(i.denda)}
Total Kewajiban : ${rp(i.total)}

2. Bahwa Pihak yang Menyatakan SANGGUP dan BERJANJI menyelesaikan kewajiban tersebut sebesar ${rp(f.jumlah || i.total)} selambat-lambatnya pada tanggal ${fmtTgl(f.tgl)};

3. Bahwa apabila Pihak yang Menyatakan lalai memenuhi pernyataan ini, Pihak yang Menyatakan bersedia menanggung denda keterlambatan dan/atau penyerahan jaminan serta menerima segala upaya hukum sesuai ketentuan perjanjian dan peraturan perundang-undangan yang berlaku;

4. Bahwa Surat Pernyataan ini dibuat sebagai pengakuan utang sekaligus alat bukti yang sah dan dapat dipergunakan sebagaimana mestinya.

Demikian Surat Pernyataan ini dibuat dengan penuh kesadaran dan tanggung jawab, dibubuhi meterai secukupnya.

${ttdKota}
Yang Menyatakan,

[[SIGN]]
${i.customer}`;
}
export function bastPenarikan(i, s, f) {
  const { p, jabatan, ttdKota } = fieldBase(s);
  return `${kopLine(s)}
BERITA ACARA SERAH TERIMA OBJEK JAMINAN

Pada hari ini, ${ttdKota}, yang bertanda tangan di bawah ini telah sepakat melakukan serah terima objek jaminan, masing-masing:

A. PARA PIHAK
1. ${i.customer}, beralamat di ${i.alamat || "-"}, selanjutnya disebut "Pihak Pertama" (yang menyerahkan);
2. ${p}, selanjutnya disebut "Pihak Kedua" (yang menerima).

B. OBJEK DAN DASAR
1. Bahwa Pihak Pertama memiliki kewajiban kepada Pihak Kedua atas tagihan ${i.noInvoice} sebesar ${rp(i.total)} yang telah jatuh tempo dan belum diselesaikan;

2. Bahwa untuk penyelesaian kewajiban tersebut, Pihak Pertama dengan ini menyerahkan secara sukarela objek jaminan berupa:
${i.jaminan || "(uraian objek jaminan)"}
dengan kondisi/kelengkapan: ${f.kondisi || "-"}.

C. KETENTUAN
1. Bahwa penyerahan objek jaminan dilakukan secara sukarela tanpa paksaan dari pihak manapun;

2. Bahwa Pihak Kedua berhak memproses objek jaminan untuk penyelesaian kewajiban sesuai ketentuan yang berlaku, dan hasil bersih penjualannya diperhitungkan dengan kewajiban Pihak Pertama;

3. Bahwa apabila terdapat kelebihan hasil penjualan setelah dikurangi seluruh kewajiban dan biaya, akan dikembalikan kepada Pihak Pertama; sebaliknya, kekurangannya tetap menjadi kewajiban Pihak Pertama.

Demikian Berita Acara ini dibuat dengan sebenarnya dan ditandatangani oleh Para Pihak dalam keadaan sadar tanpa adanya paksaan.

${ttdKota}

[[SIGGRID]]
cap|Pihak Pertama (yang menyerahkan),|Pihak Kedua (yang menerima),
sig|SIGN1|SIGN2
name|${i.customer}|${p}
name||${jabatan}
[[/SIGGRID]]`;
}
export function momKunjungan(i, s, f) {
  const { p, jabatan, ttdKota } = fieldBase(s);
  const petugas = (s.petugasAktif && s.petugasAktif.trim()) || jabatan;
  const ar = i.sisaPokok ?? i.nominal;
  return `${kopLine(s)}
MINUTES OF MEETING (MOM) — BERITA ACARA KUNJUNGAN PENAGIHAN

Hari / Tanggal : ${ttdKota}
Tempat         : ${i.alamat || "-"}
Perihal        : Pembahasan penyelesaian kewajiban yang telah jatuh tempo

A. PESERTA / PARA PIHAK
1. Pihak Penagih : ${petugas} — ${p}
2. Pihak Debitur : ${i.customer}${i.pic ? ` (u.p. ${i.pic})` : ""}

B. DATA KEWAJIBAN
No. Tagihan     : ${i.noInvoice}
Pokok / AR      : ${rp(ar)}
Denda           : ${rp(i.denda)}
Total Kewajiban : ${rp(i.total)}
Jatuh Tempo     : ${fmtTgl(i.tglJatuhTempo)}${i.daysOverdue > 0 ? ` (telat ${i.daysOverdue} hari)` : ""}

C. POKOK PEMBAHASAN
1. Konfirmasi posisi tunggakan saat kunjungan — Pokok/AR ${rp(ar)} + denda ${rp(i.denda)} = total kewajiban ${rp(i.total)}.${f.pembahasan ? "\n2. " + f.pembahasan : ""}

D. KESEPAKATAN / RENCANA TINDAK LANJUT
${f.kesepakatan || "-"}${f.tgl ? `\n\nTarget penyelesaian : ${fmtTgl(f.tgl)}` : ""}

E. PENUTUP
Demikian Berita Acara/Minutes of Meeting ini dibuat dengan sebenarnya berdasarkan hasil pertemuan, dan disetujui serta ditandatangani oleh Para Pihak tanpa adanya paksaan, untuk dipergunakan sebagaimana mestinya.

${ttdKota}

[[SIGGRID]]
cap|Pihak Debitur,|Pihak Penagih,
sig|SIGN1|SIGN2
name|${i.customer}|${petugas}
name||${p}
[[/SIGGRID]]`;
}

/* Metadata dokumen lapangan (dipakai arsip & detail riwayat untuk cetak ulang). */
export function docMetaG(jenis) {
  return jenis === "mom" ? { gen: momKunjungan, label: "MOM / Berita Acara Kunjungan" }
    : jenis === "bast" ? { gen: bastPenarikan, label: "BAST Penarikan" }
    : { gen: suratPernyataan, label: "Surat Pernyataan" };
}
export function sigMapG(jenis, a, b) {
  return jenis === "mom" ? { SIGN1: a, SIGN2: b }
    : jenis === "bast" ? { SIGN1: a }
    : { SIGN: a };
}

/* ---------- Riwayat eskalasi (label, daftar) ---------- */
export const ESK_LABELS = { reminder: "Reminder", tegas: "Reminder Tegas", sp: "Surat Peringatan", somasi: "Somasi" };
export function eskLabel(level, jaminanTipe) {
  if (level === "tarik") return jaminanTipe === "fidusia" ? "Surat Penarikan" : jaminanTipe === "tanah" ? "Lelang HT" : "Eksekusi Jaminan";
  return ESK_LABELS[level] || level;
}
// Gabung semua entri eskalasi dari seluruh tagihan -> urut terbaru dulu
export function eskalasiRows(rows) {
  const out = [];
  (rows || []).forEach((i) => (i.eskalasi || []).forEach((e) => out.push({
    ts: e.ts,
    id: i.id,
    customer: i.customer,
    noInvoice: i.noInvoice,
    level: e.level,
    tindakan: eskLabel(e.level, i.jaminanTipe),
    petugas: i.assignedTo || "",
    total: i.total,
    status: stLabel(i.status),
  })));
  return out.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
}

/* ---------- Statement of Account per debitur ---------- */
export function statementText(name, list, s) {
  const { p, jabatan, ttdKota } = fieldBase(s);
  const now = new Date();
  const tgl = fmtTgl(now.toISOString().slice(0, 10));
  const noSOA = `......./SOA/${ROMAN[now.getMonth()]}/${now.getFullYear()}`;
  const rows = list.filter((i) => i.customer.trim().toLowerCase() === name.trim().toLowerCase());
  const totOut = rows.filter((i) => i.status !== "lunas").reduce((a, i) => a + i.total, 0);
  const totBayar = rows.reduce((a, i) => a + (i.terbayar || 0), 0);
  const totTagih = rows.reduce((a, i) => a + i.total, 0);
  const lines = rows.map((i) =>
    `- ${i.noInvoice} | JT ${fmtTgl(i.tglJatuhTempo)} | Pokok ${rp(i.nominal)} | Dibayar ${rp(i.terbayar || 0)} | Sisa+Denda ${rp(i.total)} | ${stLabel(i.status)}`
  ).join("\n");
  return `${kopLine(s)}
STATEMENT OF ACCOUNT

[[RIGHT]]${ttdKota}

Nomor : ${noSOA}
Hal   : Statement of Account (Rincian Posisi Tagihan)

Kepada Yth.
${name}
di Tempat

Dengan hormat,

Bersama ini kami sampaikan ringkasan posisi tagihan (Statement of Account) atas nama Saudara per tanggal ${tgl}, sebagai berikut:

Debitur        : ${name}
Jumlah Invoice : ${rows.length}

RINCIAN TAGIHAN
${lines || "-"}

RINGKASAN
Total Tagihan      : ${rp(totTagih)}
Total Dibayar      : ${rp(totBayar)}
Total Outstanding  : ${rp(totOut)}

Mohon Saudara berkenan mencocokkan data di atas dengan catatan Saudara. Apabila terdapat perbedaan, mohon konfirmasi kepada kami selambat-lambatnya dalam waktu 7 (tujuh) hari kerja sejak Statement ini diterima; apabila tidak terdapat konfirmasi, maka data di atas dianggap telah sesuai dan disetujui.

Demikian kami sampaikan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.

Hormat kami,
${p}


(__________________________)
${jabatan}`;
}
