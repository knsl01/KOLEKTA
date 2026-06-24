/* ---------------------------------------------------------------
   Offline upload queue (KOLEKTA)

   Antrian unggah file (foto lapangan / lampiran bukti) ke Supabase
   Storage yang:
     - menyimpan blob sementara di IndexedDB (bukan localStorage),
     - berjalan di latar belakang (laporan tak menunggu upload),
     - punya status per-file: pending | uploading | success | failed,
     - retry otomatis dengan backoff + lanjut sendiri setelah reload.

   Singleton, hidup di luar React. Fungsi unggah aktual (sbUpload)
   disuntik dari App lewat setUploader() untuk hindari import siklik.
---------------------------------------------------------------- */

const DB_NAME = "kolekta-uploads";
const STORE = "uploads";
const MAX_BACKOFF = 5 * 60 * 1000; // cap retry 5 menit
const BASE_BACKOFF = 2000;         // 2s, 4s, 8s, ...
const TICK_MS = 15000;             // sapu antrian berkala

let _dbPromise = null;
let _uploader = null;              // (code, scope, name, dataUrl) -> { path, size }
let _processing = false;
let _started = false;
let _tick = null;

const _dataCache = new Map();      // id -> dataUrl (untuk tampilan cepat)
const _statusCache = new Map();    // id -> { status, attempts, path, error }
const _subs = new Set();           // cb({ id, status, path, error })

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, 1); }
    catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function tx(mode, fn) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result;
    Promise.resolve(fn(store)).then((r) => { result = r; }).catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

const dbGet = (id) => tx("readonly", (s) => reqP(s.get(id)));
const dbAll = () => tx("readonly", (s) => reqP(s.getAll()));
const dbPut = (rec) => tx("readwrite", (s) => reqP(s.put(rec)));
const dbDel = (id) => tx("readwrite", (s) => reqP(s.delete(id)));

function emit(rec) {
  _statusCache.set(rec.id, { status: rec.status, attempts: rec.attempts, path: rec.path || null, error: rec.error || null });
  const payload = { id: rec.id, status: rec.status, path: rec.path || null, error: rec.error || null };
  _subs.forEach((cb) => { try { cb(payload); } catch {} });
}

/* Suntik fungsi unggah aktual dari App (sbUpload). */
export function setUploader(fn) { _uploader = fn; }

/* Daftarkan callback perubahan status. Balikan fungsi unsubscribe. */
export function subscribe(cb) { _subs.add(cb); return () => _subs.delete(cb); }

/* dataURL untuk tampilan lokal selagi belum terunggah. */
export async function getDataUrl(id) {
  if (_dataCache.has(id)) return _dataCache.get(id);
  try { const rec = await dbGet(id); if (rec && rec.dataUrl) { _dataCache.set(id, rec.dataUrl); return rec.dataUrl; } } catch {}
  return null;
}

/* Snapshot status sinkron (untuk badge). */
export function getStatus(id) { return _statusCache.get(id) || null; }

/* Masukkan satu file ke antrian. Balikan localId. */
export async function enqueue({ code, scope, name, dataUrl }) {
  const id = uid();
  const ct = (String(dataUrl).match(/^data:([^;]+)/) || [])[1] || "application/octet-stream";
  const rec = {
    id, code, scope: scope || "lapor", name: name || "file", contentType: ct,
    dataUrl, status: "pending", attempts: 0, nextAt: 0, path: null, error: null, createdAt: Date.now(),
  };
  _dataCache.set(id, dataUrl);
  try { await dbPut(rec); } catch {}
  emit(rec);
  process();
  return id;
}

/* Paksa coba lagi sebuah item (tombol "coba lagi"). */
export async function retry(id) {
  try {
    const rec = await dbGet(id);
    if (!rec || rec.status === "success") return;
    rec.status = "pending"; rec.nextAt = 0;
    await dbPut(rec); emit(rec); process();
  } catch {}
}

async function uploadOne(rec) {
  rec.status = "uploading"; emit(rec);
  try { await dbPut(rec); } catch {}
  try {
    const up = await _uploader(rec.code, rec.scope, rec.name, rec.dataUrl);
    rec.status = "success"; rec.path = up && up.path; rec.size = (up && up.size) || rec.size; rec.error = null;
    rec.dataUrl = null; rec.doneAt = Date.now();   // buang blob, simpan metadata+path
    _dataCache.delete(rec.id);
    try { await dbPut(rec); } catch {}   // record dipertahankan agar path tetap bisa di-resolve walau ref telat ditukar
    emit(rec);
    return true;
  } catch (e) {
    rec.attempts = (rec.attempts || 0) + 1;
    rec.status = "failed";
    rec.error = String((e && e.message) || e || "gagal").slice(0, 160);
    rec.nextAt = Date.now() + Math.min(BASE_BACKOFF * 2 ** (rec.attempts - 1), MAX_BACKOFF);
    try { await dbPut(rec); } catch {}
    emit(rec);
    return false;
  }
}

async function process() {
  if (_processing || !_uploader) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  _processing = true;
  try {
    let items = [];
    try { items = (await dbAll()) || []; } catch {}
    const now = Date.now();
    const due = items
      .filter((r) => r.status !== "success" && (r.status === "pending" || r.status === "uploading" || (r.status === "failed" && (r.nextAt || 0) <= now)))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    for (const rec of due) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) break;
      await uploadOne(rec);     // sekuensial, hemat bandwidth
    }
  } finally {
    _processing = false;
  }
}

/* Mulai processor: hidratasi status, resume antrian, pasang listener. */
export async function start() {
  if (_started) { process(); return; }
  _started = true;
  try {
    const items = (await dbAll()) || [];
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    for (const r of items) {
      // Bersihkan record sukses lama (>24 jam) — ref di data sudah jadi path.
      if (r.status === "success" && (r.doneAt || 0) < cutoff) { try { await dbDel(r.id); } catch {} continue; }
      _statusCache.set(r.id, { status: r.status, attempts: r.attempts, path: r.path || null, error: r.error || null });
      if (r.dataUrl) _dataCache.set(r.id, r.dataUrl);
    }
  } catch {}
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => process());
    if (!_tick) _tick = setInterval(() => process(), TICK_MS);
  }
  process();
}
