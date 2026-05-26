# ふたりおえ — セットアップチェックリスト

エラーが出るときは、この順で確認してください。

## 診断 API

dev サーバー起動後にブラウザで開く:

```
http://localhost:3002/api/health
```

（実際のポートに合わせて変更）

---

## 1. 環境変数（`web/.env.local`）

| 変数名 | 必須 | どこで取得 | 注意 |
|--------|------|------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Settings → API → **Project URL** | `https://tqsyejbdygachjgmkqnd.supabase.co` 形式。**`/rest/v1` は付けない** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Settings → API → **Publishable key** | `sb_publishable_...`。**フロント用** |
| `SUPABASE_SECRET_KEY` | ✅（お題保存） | Settings → API → **Secret key** | `sb_secret_...`。**`NEXT_PUBLIC_` を付けない** |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 自分で決める | ブラウザで開く URL（例 `http://localhost:3002`） |
| `OPENAI_API_KEY` | ✅（お題） | [OpenAI Platform](https://platform.openai.com/api-keys) | `sk-...` |

### よくある間違い

- ❌ 秘密鍵を `NEXT_PUBLIC_SUPABASE_SECRET_KEY` にする → ブラウザに漏れる
- ❌ URL に `/rest/v1/` を付ける → 接続失敗
- ❌ `.env.local` を `web` フォルダではなく親フォルダに置く
- ❌ env 変更後に dev サーバーを再起動しない

---

## 2. dev サーバー（1つだけ起動）

ターミナルに `Another next dev server is already running` と出たら、古いサーバーが残っています。

```powershell
cd web
# 古い Node を止める（例）
taskkill /PID 29060 /F
npm run dev
```

表示された **Local: http://localhost:XXXX** をブラウザで開く。  
`NEXT_PUBLIC_SITE_URL` のポートと **一致** させる。

---

## 3. Supabase SQL（テーブル作成）

**SQL Editor** で、次のファイルを **上から順に** 実行:

1. `supabase/migrations/001_create_users.sql`
2. `supabase/migrations/002_drawings.sql`
3. `supabase/migrations/003_storage_image_url.sql`
4. `supabase/migrations/004_daily_prompts.sql`
5. `supabase/migrations/005_pairs_and_anonymous.sql`（友達ペア + 匿名ログイン用）

**Authentication → Providers → Anonymous sign-ins** を **ON** にする（Google 不要の「かんたんはじめる」用）

未実行だと例えば次のエラーになります:

- `relation "public.users" does not exist`
- `Could not find the table 'daily_prompts'`

---

## 4. ログイン方法（2通り）

### かんたんはじめる（おすすめ・Google 不要）

1. Supabase → **Authentication → Providers → Anonymous sign-ins** → **Enable**
2. アプリでニックネーム → **かんたんにはじめる**
3. フレンドコードを相手に送り、相手のコードを入力してペア

### Google ログイン（任意）

### Supabase 側

1. **Authentication → Providers → Google** → Enable
2. Google Cloud の **Client ID / Client Secret** を入力
3. **Authentication → URL Configuration**
   - **Site URL**: `http://localhost:3002`（実際のポート）
   - **Redirect URLs** に追加:
     - `http://localhost:3002/auth/callback`
     - `https://tqsyejbdygachjgmkqnd.supabase.co/auth/v1/callback`（Supabase ダッシュボードに表示される Callback URL も Google 側に登録）

### Google Cloud 側

[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0

**承認済みのリダイレクト URI** に:

- Supabase ダッシュボード（Google 設定画面）に表示されている Callback URL

---

## 5. Storage（お絵描き保存）

`003_storage_image_url.sql` 実行後、**Storage** に `drawings` バケットがあるか確認（Public）。

---

## 6. エラー別の対処

| 画面・メッセージ | 原因 | 対処 |
|------------------|------|------|
| URL and Key are required | env 未読み込み | `web/.env.local` を確認し dev 再起動 |
| お題を読み込めませんでした | OpenAI または secret 未設定 / `daily_prompts` なし | `OPENAI_API_KEY` + SQL 004 |
| プロフィールの読み込みに失敗 | `users` テーブルなし | SQL 001 |
| Storage へのアップロードに失敗 | バケットなし / ポリシー | SQL 003 |
| ログインに失敗 | Google OAuth 未設定 / Redirect URL 不一致 | セクション 4 |
| config エラー（ログイン画面） | URL または Publishable 未設定 | セクション 1 |

---

## 7. あなたのプロジェクト情報（記入用）

```
Project URL:     https://tqsyejbdygachjgmkqnd.supabase.co
Project ref:     tqsyejbdygachjgmkqnd
ローカル URL:    http://localhost:3002
Redirect URL:    http://localhost:3002/auth/callback
```

秘密鍵・公開鍵は **チャットや Git に載せない**。`.env.local` のみに保存。

---

## 8. まだ直らないとき

次を共有すると原因を特定しやすいです（**鍵は伏せる**）:

1. ブラウザの URL（例 `http://localhost:3002/login?error=...`）
2. `/api/health` の JSON 全文
3. 画面に表示されているエラー文
4. SQL 001〜004 を実行したか（はい/いいえ）
5. Google ログインを有効にしたか（はい/いいえ）
