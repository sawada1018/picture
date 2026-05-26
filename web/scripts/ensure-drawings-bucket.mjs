/**
 * drawings バケットを Secret キーで作成・確認
 * 使い方: npm run setup:storage
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envPath);

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  .trim()
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");
const secret =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !secret) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY が .env.local に必要です");
  process.exit(1);
}

const BUCKET = "drawings";
const supabase = createClient(url, secret.trim(), {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("Project:", url);

const { data: existing, error: getErr } = await supabase.storage.getBucket(BUCKET);

if (existing && !getErr) {
  console.log("✅ バケットは既にあります:", existing.name, "public=", existing.public);
  process.exit(0);
}

console.log("バケットなし → 作成します...", getErr?.message ?? "");

const { data: created, error: createErr } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
});

if (createErr) {
  console.error("❌ createBucket 失敗:", createErr.message);
  console.error("");
  console.error("手動で作成してください:");
  console.error("  1. https://supabase.com/dashboard → このプロジェクト");
  console.error("  2. Storage → New bucket → 名前「drawings」→ Public ON");
  console.error("  3. SQL Editor で supabase/STORAGE_NOW.sql を実行（RLS ポリシー）");
  process.exit(1);
}

console.log("✅ バケットを作成しました:", created?.name ?? BUCKET);
console.log("次: Supabase SQL Editor で supabase/STORAGE_NOW.sql を実行（ポリシー用）");
