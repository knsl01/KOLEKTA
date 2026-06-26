/* ---------- Kalkulasi tagihan, denda & kolektibilitas ---------- */
/* Fungsi murni — tidak menyentuh React atau palet tema (T). */

import { today0, dayDiff } from "./format.js";

export function kolektibilitas(odRaw, lunas) {
  if (lunas) return { no: 1, short: "Lunas", label: "Lunas", tone: "green" };
  if (odRaw <= 0) return { no: 1, short: "Kol 1", label: "Lancar (Kol 1)", tone: "green" };
  if (odRaw <= 90) return { no: 2, short: "Kol 2", label: "Dalam Perhatian Khusus (Kol 2)", tone: "amber" };
  if (odRaw <= 120) return { no: 3, short: "Kol 3", label: "Kurang Lancar (Kol 3)", tone: "amber" };
  if (odRaw <= 180) return { no: 4, short: "Kol 4", label: "Diragukan (Kol 4)", tone: "red" };
  return { no: 5, short: "Kol 5", label: "Macet (Kol 5)", tone: "red" };
}

export function ptpStat(list) {
  const due = list.filter((i) => i.janjiBayar && new Date(i.janjiBayar) <= today0());
  let kept = 0;
  due.forEach((i) => { if (i.status === "lunas" || (i.pembayaran || []).some((p) => p.ts >= i.janjiBayar)) kept++; });
  const total = due.length;
  return { kept, broken: total - kept, total, rate: total ? Math.round((kept / total) * 100) : null };
}

// Akru denda atas pokok yang menunggak. Pembayaran dialokasikan ke pokok dulu,
// jadi denda berhenti bertambah saat pokok lunas — tapi denda yang sudah terlanjur
// tetap terhitung sebagai kewajiban (nempel di pokok awal).
export function akruDenda(inv, ratePct) {
  const rate = (ratePct || 0) / 100;
  const dueMs = new Date(inv.tglJatuhTempo + "T00:00:00").getTime();
  const t0 = today0().getTime();
  if (t0 <= dueMs || !(rate > 0)) return 0;
  const pays = (inv.pembayaran || [])
    .map((p) => ({ t: new Date(p.ts + "T00:00:00").getTime(), jumlah: p.jumlah || 0 }))
    .sort((a, b) => a.t - b.t);
  let denda = 0, outstanding = inv.nominal || 0, segStart = dueMs, pi = 0;
  // Pembayaran sebelum/saat jatuh tempo: kurangi pokok lebih dulu.
  while (pi < pays.length && pays[pi].t <= dueMs) { outstanding = Math.max(0, outstanding - pays[pi].jumlah); pi++; }
  while (segStart < t0) {
    const next = pi < pays.length && pays[pi].t < t0 ? pays[pi].t : t0;
    const days = Math.round((next - segStart) / 86400000);
    if (outstanding > 0 && days > 0) denda += outstanding * rate * days;
    segStart = next;
    while (pi < pays.length && pays[pi].t <= segStart) { outstanding = Math.max(0, outstanding - pays[pi].jumlah); pi++; }
  }
  return Math.round(denda);
}

export function enrich(inv, s) {
  const due = new Date(inv.tglJatuhTempo + "T00:00:00");
  const odRaw = dayDiff(today0(), due);
  const lunas = inv.status === "lunas";
  const terbayar = (inv.pembayaran || []).reduce((a, p) => a + (p.jumlah || 0), 0);
  const sisaPokok = Math.max(0, inv.nominal - terbayar);
  const daysOverdue = lunas ? 0 : Math.max(0, odRaw);
  // Denda terakru atas pokok yang menunggak; kelebihan bayar di atas pokok dianggap pelunasan denda.
  const dendaTotal = lunas ? 0 : akruDenda(inv, s.dendaRatePct);
  const dibayarDenda = Math.max(0, terbayar - (inv.nominal || 0));
  const denda = lunas ? 0 : Math.max(0, dendaTotal - dibayarDenda);
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
  return { ...inv, due, odRaw, daysOverdue, terbayar, sisaPokok, denda, dendaTotal, total, bucket, kol, ptpLewat, tlDue, prioScore, prioLabel: prio.label, prioTone: prio.tone };
}
