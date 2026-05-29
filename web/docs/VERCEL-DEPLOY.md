# Vercel デプロイ手順

## 1. プロジェクト設定

| 項目 | 値 |
|------|-----|
| **Root Directory** | `web` |
| **Framework** | Next.js（自動検出） |

## 2. 環境変数（必須）

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables**

ローカルの `web/.env.local` を開き、**名前を完全一致**させて値をコピーします。  
**Production / Preview / Development** の3つすべてにチェック → **Save** → **Deployments → Redeploy**。

> ⚠️ 保存しただけでは古いビルドのままです。必ず **Redeploy** してください。

### Preview URL で全部 ✗ になるとき

`https://xxxx-あなたのチーム.vercel.app` のような URL は **Preview デプロイ**です。  
環境変数を **Production だけ** に入れていると、Preview では4つとも未設定になります。

**対処:** 各変数の編集画面で **Preview** にもチェック → Save → Redeploy。  
または Vercel の **Domains** に表示される本番 URL（例 `picture-gjnx.vercel.app`）で開く。

| 変数名 | 取得場所 |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → **Publishable key** (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API → **Secret key** (`sb_secret_...`) |
| `NEXT_PUBLIC_SITE_URL` | 本番 URL（例 `https://あなたのプロジェクト.vercel.app`） |

> `NEXT_PUBLIC_` が付く変数はビルド時に埋め込まれます。追加・変更後は **Redeploy** が必要です。

## 3. Supabase 側（認証・メール）

**Authentication → URL Configuration**

- **Site URL**: `https://picture-wa6u.vercel.app`（本番 URL）
- **Redirect URLs** に追加:
  - `https://picture-wa6u.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`（ローカル開発用）

> メール確認リンクが「サーバに接続できない」になる場合、Redirect URLs に本番 URL が入っていないか、Site URL が `localhost` のままになっていることが多いです。

**Authentication → Providers → Email**

- Email プロバイダーを **有効**
- 「Confirm email」は ON/OFF どちらでも可（ON なら確認メール必須）

**メールが届かない場合**

- 迷惑メールフォルダを確認
- Supabase 無料枠は送信数に制限あり（Authentication → Logs で確認）
- 本番運用は **Authentication → SMTP Settings** で独自 SMTP（Gmail / SendGrid 等）設定を推奨

## 4. 再デプロイ

環境変数を保存したら **Deployments** → 最新 → **⋯** → **Redeploy**。

診断: `https://あなたのプロジェクト.vercel.app/api/health`
