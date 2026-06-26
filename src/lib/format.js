/* ---------- Helper format, tanggal & util murni ---------- */
/* Tidak bergantung pada React, ikon, atau palet tema (T) — aman dipakai di mana saja. */

export const onlyDigits = (v) => String(v ?? "").replace(/[^0-9]/g, "");
export const grpID = (v) => { const n = onlyDigits(v); return n ? Number(n).toLocaleString("id-ID") : ""; };

export const rp = (n) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const rpc = (v) => {
  let n = Math.round(v || 0); const neg = n < 0 ? "-" : ""; n = Math.abs(n);
  const f = (x, d) => x.toFixed(d).replace(/\.0$/, "").replace(".", ",");
  if (n >= 1e12) return `${neg}Rp${f(n / 1e12, n < 1e13 ? 1 : 0)} T`;
  if (n >= 1e9) return `${neg}Rp${f(n / 1e9, n < 1e10 ? 1 : 0)} M`;
  if (n >= 1e6) return `${neg}Rp${f(n / 1e6, n < 1e7 ? 1 : 0)} jt`;
  if (n >= 1e3) return `${neg}Rp${Math.round(n / 1e3)} rb`;
  return `${neg}Rp${n}`;
};

export const fmtTgl = (iso) => {
  if (!iso) return "-";
  try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T00:00:00")); }
  catch { return iso; }
};

export const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
export const dayDiff = (a, b) => Math.round((a - b) / 86400000);
export const daysSince = (iso) => (iso ? dayDiff(today0(), new Date(iso)) : Infinity);
export const greeting = () => { const h = new Date().getHours(); return h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam"; };
export const uid = () => Math.random().toString(36).slice(2, 9);

export const fmtWaktu = (iso) => {
  if (!iso) return "";
  try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
  catch { return iso; }
};
