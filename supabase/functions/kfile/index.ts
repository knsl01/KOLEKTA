// Kolekta file broker (Supabase Edge Function)
// Menjaga isolasi per-PT untuk Storage: validasi kode login -> tenant,
// upload pakai service role ke prefix tenant, dan beri signed URL untuk tampil.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BUCKET = "kolekta-files";
const MAX_BYTES = 6 * 1024 * 1024; // ~6 MB per file (cocok dengan batas 5 MB di klien)
const SIGN_TTL = 60 * 60 * 2; // 2 jam

const admin = createClient(SB_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function tenantOf(code: string): Promise<string | null> {
  if (!code) return null;
  const { data, error } = await admin.rpc("kolekta_tenant_of", { p_code: code });
  if (error) return null;
  const tid = typeof data === "string" ? data : (Array.isArray(data) ? data[0] : null);
  return tid || null;
}

const safeName = (n: string) =>
  (n || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "method" });

  let payload: any;
  try { payload = await req.json(); } catch { return json(400, { error: "bad_json" }); }

  const action = payload?.action;
  const code = String(payload?.code || "");
  const tid = await tenantOf(code);
  if (!tid) return json(401, { error: "invalid_code" });

  try {
    if (action === "up") {
      // payload: { scope, name, contentType, b64 }
      const scope = String(payload.scope || "misc").replace(/[^a-z]/g, "") || "misc";
      const name = safeName(String(payload.name || "file"));
      const contentType = String(payload.contentType || "application/octet-stream");
      const b64 = String(payload.b64 || "");
      if (!b64) return json(400, { error: "empty" });
      const bytes = b64ToBytes(b64);
      if (bytes.byteLength > MAX_BYTES) return json(413, { error: "too_large" });
      const path = `${tid}/${scope}/${crypto.randomUUID()}-${name}`;
      const { error } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: false });
      if (error) return json(500, { error: "upload_failed", detail: error.message });
      return json(200, { path, size: bytes.byteLength });
    }

    if (action === "url") {
      // payload: { paths: [...] } -> { urls: { path: signedUrl } }
      const paths: string[] = Array.isArray(payload.paths) ? payload.paths : [];
      const mine = paths.filter((p) => typeof p === "string" && p.startsWith(tid + "/"));
      const urls: Record<string, string> = {};
      if (mine.length) {
        const { data, error } = await admin.storage.from(BUCKET).createSignedUrls(mine, SIGN_TTL);
        if (error) return json(500, { error: "sign_failed", detail: error.message });
        for (const row of (data || [])) {
          if (row.signedUrl && row.path) urls[row.path] = row.signedUrl;
        }
      }
      return json(200, { urls });
    }

    if (action === "del") {
      // payload: { paths: [...] } -> hapus file milik tenant ini saja
      const paths: string[] = Array.isArray(payload.paths) ? payload.paths : [];
      const mine = paths.filter((p) => typeof p === "string" && p.startsWith(tid + "/"));
      if (mine.length) {
        const { error } = await admin.storage.from(BUCKET).remove(mine);
        if (error) return json(500, { error: "del_failed", detail: error.message });
      }
      return json(200, { removed: mine.length });
    }

    return json(400, { error: "unknown_action" });
  } catch (e) {
    return json(500, { error: "exception", detail: String(e?.message || e) });
  }
});
