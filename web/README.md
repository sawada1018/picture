# ふたりおえ（Next.js + Supabase）

二人用お絵描きアプリ — **Step 1** 完了分

- Supabase 接続
- Google ログイン
- `users` テーブル
- ホーム画面

## 1. 依存関係のインストール

```bash
cd web
npm install
```

## 2. Supabase プロジェクト設定

1. [Supabase](https://supabase.com) で新規プロジェクトを作成
2. **SQL Editor** で以下を順に実行
   - `supabase/migrations/001_create_users.sql`
   - `supabase/migrations/002_drawings.sql`（お絵描き保存用）
   - `supabase/migrations/003_storage_image_url.sql`（Storage バケット + `image_url`）
   - `supabase/migrations/004_daily_prompts.sql`（毎日のAIお題）
3. **Authentication → Providers → Google** を有効化
   - [Google Cloud Console](https://console.cloud.google.com/) で OAuth クライアントを作成
   - 承認済みリダイレクト URI に Supabase の Callback URL を登録
   - Client ID / Secret を Supabase に貼り付け
4. **Authentication → URL Configuration**（ポートは `npm run dev` の表示に合わせる）
   - Site URL: `http://localhost:3002`
   - Redirect URLs: `http://localhost:3002/auth/callback`

## 3. 環境変数

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **新しい API キー形式**（`sb_publishable_...`）に対応済みです。  
> 従来の `anon` キーは `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定しても動作します。

## 4. 起動

```bash
npm run dev
```

**古い dev サーバーが複数動いていると env が効かないことがあります。** 1つだけ起動してください。

診断: `http://localhost:3002/api/health`（ポートは環境に合わせる）

詳細チェックリスト: [docs/SETUP-CHECKLIST.md](./docs/SETUP-CHECKLIST.md)

未ログイン時は `/login` へ。Google ログイン後、ホームにフレンドコードが表示されます。

## ディレクトリ構成（Step 1）

```
src/
  lib/supabase/     # client / server / middleware
  lib/users.ts      # プロフィール確保
  app/
    page.tsx        # ホーム
    login/          # Google ログイン
    auth/callback/  # OAuth コールバック
  components/
    auth/
    home/
supabase/migrations/
  001_create_users.sql
```

## 毎日のAIお題（実装済み）

- ホーム表示時に `daily_prompts` を確認
- **その日のお題が無い場合のみ** OpenAI API で1回生成して保存
- 二人とも同じお題（日付ごとに全ユーザー共通）
- 必要な環境変数: `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`
- API: `GET /api/daily-prompt`

## お絵描き機能（実装済み）

- `src/hooks/use-drawing-canvas.ts` — Canvas 描画ロジック（React Hooks）
- `src/components/draw/drawing-canvas.tsx` — ペン / 色 / 太さ / 消しゴム / 保存 UI
- `POST /api/drawings` — Canvas → **Supabase Storage**（`drawings` バケット）→ 公開 URL を `drawings.image_url` に保存
- `GET /api/drawings` — 今日の `image_url` を返却（キャンバスに復元）

## 次のステップ（未実装）

- `pairs` テーブルとフレンドコードでペアリング
- 相手の絵をアイコン表示
