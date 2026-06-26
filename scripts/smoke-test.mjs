#!/usr/bin/env node
/*
 * Smoke test: pastikan aplikasi hasil build TIDAK blank (layar putih).
 *
 * Menangkap kelas bug yang lolos dari `vite build` tapi mematikan app saat
 * runtime — terutama TDZ ("Cannot access 'X' before initialization") yang
 * pernah bikin layar putih total. Build sukses TIDAK menjamin app render;
 * skrip ini benar-benar memuat halaman di Chromium headless lalu memeriksa
 * #root terisi dan tak ada error konsol.
 *
 * Pakai:  npm run smoke      (build dulu, lalu test)
 *         node scripts/smoke-test.mjs   (test atas dist/ yang sudah ada)
 *
 * Exit code 0 = render OK, non-0 = blank / ada error (cocok untuk CI).
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import net from "node:net";

const PORT = Number(process.env.SMOKE_PORT || 4321);
const URL = `http://localhost:${PORT}/`;

// Cari executable Chromium: env dulu, lalu lokasi Playwright pre-installed (CI/web),
// terakhir biarkan playwright-core memilih channel default-nya.
function findChrome() {
  const cands = [
    process.env.SMOKE_CHROME,
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  ].filter(Boolean);
  for (const p of cands) if (existsSync(p)) return p;
  // Pola glob sederhana untuk /opt/pw-browsers/chromium-*/chrome-linux/chrome
  try {
    const base = "/opt/pw-browsers";
    if (existsSync(base)) {
      for (const d of readdirSync(base)) {
        const p = `${base}/${d}/chrome-linux/chrome`;
        if (d.startsWith("chromium-") && existsSync(p)) return p;
      }
    }
  } catch {}
  return null;
}

function waitForPort(port, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, "localhost");
      sock.once("connect", () => { sock.destroy(); resolve(); });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error("server tidak siap"));
        else setTimeout(tryOnce, 250);
      });
    };
    tryOnce();
  });
}

let preview, browser, code = 1;
try {
  if (!existsSync("dist/index.html")) {
    console.error("✗ dist/ belum ada — jalankan `npm run build` dulu (atau pakai `npm run smoke`).");
    process.exit(2);
  }

  preview = spawn("npx", ["vite", "preview", "--port", String(PORT)], { stdio: "ignore" });
  await waitForPort(PORT);

  const { chromium } = await import("playwright-core");
  const exe = findChrome();
  browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);

  const rootLen = await page.evaluate(() => document.getElementById("root")?.innerHTML.length || 0);
  const sample = (await page.evaluate(() => document.body.innerText || "")).slice(0, 200).replace(/\s+/g, " ").trim();

  console.log(`root innerHTML: ${rootLen} char`);
  console.log(`teks terlihat : ${sample || "(kosong)"}`);
  if (errors.length) { console.log(`error konsol  : ${errors.length}`); errors.slice(0, 10).forEach((e) => console.log("  - " + e)); }

  if (rootLen > 50 && errors.length === 0) { console.log("✓ OK — app render, tidak blank, tanpa error."); code = 0; }
  else if (rootLen <= 50) console.log("✗ GAGAL — layar blank (#root kosong).");
  else console.log("✗ GAGAL — app render tapi ada error konsol.");
} catch (e) {
  console.error("✗ smoke test error:", e.message);
} finally {
  try { await browser?.close(); } catch {}
  try { preview?.kill("SIGTERM"); } catch {}
  process.exit(code);
}
