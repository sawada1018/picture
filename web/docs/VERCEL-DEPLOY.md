# Vercel デプロイ手順

## 1. プロジェクト設定

| 項目 | 値 |
|------|-----|
| **Root Directory** | `web` |
| **Framework** | Next.js（自動検出） |

## 2. 環境変数（必須）

Vercel ダッシュボード → プロジェクト → **Settings** → **Environment Variables**

ローカルの `web/.env.local` と同じ値を、**Production / Preview / Development** すべてに登録します。

| 変数名 | 取得場所 |
|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → **Publishable key** (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase → Settings → API → **Secret key** (`sb_secret_...`) |
| `NEXT_PUBLIC_SITE_URL` | 本番 URL（例 `https://あなたのプロジェクト.vercel.app`） |

> `NEXT_PUBLIC_` が付く変数はビルド時に埋め込まれます。追加・変更後は **Redeploy** が必要です。

## 3. Supabase 側（認証）

**Authentication → URL Configuration**

- **Site URL**: `https://あなたのプロジェクト.vercel.app`
- **Redirect URLs** に追加:
  - `https://あなたのプロジェクト.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`（ローカル開発用）

Google ログインを使う場合は、Google Cloud の OAuth 承認済みリダイレクト URI にも Supabase の Callback URL を登録してください。

## 4. 再デプロイ

環境変数を保存したら **Deployments** → 最新 → **⋯** → **Redeploy**。

診断: `https://あなたのプロジェクト.vercel.app/api/health`
