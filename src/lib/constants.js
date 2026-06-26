/* ---------- Konstanta status & hasil kunjungan (data murni) ---------- */
/* Tidak menyentuh palet tema (T). stColor tetap di App.jsx karena butuh T runtime. */

export const STATUS_META = {
  belum_dihubungi: { label: "Belum dihubungi", token: "slate" },
  sudah_followup: { label: "Sudah follow-up", token: "brand2" },
  janji_bayar: { label: "Janji bayar", token: "amber" },
  ingkar_janji: { label: "Ingkar janji", token: "red" },
  lunas: { label: "Lunas", token: "green" },
};
export const STATUS_ORDER = ["belum_dihubungi", "sudah_followup", "janji_bayar", "ingkar_janji", "lunas"];

export const HASIL = {
  ptp: { label: "Janji bayar (PTP)", status: "janji_bayar" },
  partial: { label: "Bayar sebagian", status: null },
  ingkar: { label: "Ingkar janji", status: "ingkar_janji" },
  rtp: { label: "Menolak bayar", status: "ingkar_janji" },
  notfound: { label: "Tidak di tempat", status: null },
  nocontact: { label: "Kontak terputus", status: null },
  lain: { label: "Catatan", status: null },
};
export const HASIL_ORDER = ["ptp", "partial", "ingkar", "rtp", "notfound", "nocontact", "lain"];

export const stLabel = (st) => STATUS_META[st].label;
