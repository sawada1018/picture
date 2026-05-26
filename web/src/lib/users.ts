import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, User } from "@/types/database";

const FRIEND_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const FULL_COLUMNS =
  "id, email, display_name, friend_code, avatar_url, created_at, updated_at" as const;
const LEGACY_COLUMNS = "id, email, name, avatar_url, created_at" as const;

function randomFriendCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += FRIEND_CODE_CHARS[Math.floor(Math.random() * FRIEND_CODE_CHARS.length)];
  }
  return code;
}

function isMissingTableError(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache")
  );
}

function isSchemaMismatchError(message?: string): boolean {
  if (!message) return false;
  return (
    message.includes("column") && message.includes("does not exist")
  );
}

export const SCHEMA_FIX_HINT =
  "users テーブルはありますが列が足りません。SQL Editor で「web/supabase/migrations/006_fix_users_columns.sql」を実行して F5 で再読み込みしてください（SETUP_ALL は不要です）。";

export type EnsureProfileResult = {
  user: User | null;
  errorMessage?: string;
  needsSchemaFix?: boolean;
};

type LegacyUserRow = {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

function mapLegacyToUser(row: LegacyUserRow): User {
  return {
    id: row.id,
    email: row.email,
    display_name: row.name?.trim() || "あなた",
    friend_code: "",
    avatar_url: row.avatar_url,
    created_at: row.created_at,
    updated_at: row.created_at,
  };
}

function buildDisplayName(authUser: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = authUser.user_metadata ?? {};
  return (
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    authUser.email?.split("@")[0] ||
    "あなた"
  );
}

async function fetchUserRow(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<
  | { kind: "full"; row: User }
  | { kind: "legacy"; row: LegacyUserRow }
  | { kind: "none" }
  | { kind: "error"; message: string; needsSchemaFix?: boolean }
> {
  const full = await supabase
    .from("users")
    .select(FULL_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (full.data && full.data.display_name && full.data.friend_code) {
    return { kind: "full", row: full.data as User };
  }

  if (full.error && !isSchemaMismatchError(full.error.message)) {
    if (isMissingTableError(full.error.message)) {
      return {
        kind: "error",
        message:
          "public.users テーブルが API から見えません。006_fix_users_columns.sql を実行するか、Supabase → Settings → API で schema を確認してください。",
      };
    }
    return { kind: "error", message: full.error.message };
  }

  const legacy = await supabase
    .from("users")
    .select(LEGACY_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (legacy.error) {
    if (isMissingTableError(legacy.error.message)) {
      return {
        kind: "error",
        message: "users テーブルがありません。006_fix_users_columns.sql を先に実行してください。",
      };
    }
    return { kind: "error", message: legacy.error.message };
  }

  if (legacy.data) {
    return { kind: "legacy", row: legacy.data as LegacyUserRow };
  }

  if (full.data) {
    return { kind: "full", row: full.data as User };
  }

  return { kind: "none" };
}

/**
 * ログイン後の users 行を確保
 */
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<EnsureProfileResult> {
  const fetched = await fetchUserRow(supabase, authUser.id);

  if (fetched.kind === "error") {
    return {
      user: null,
      errorMessage: fetched.message,
      needsSchemaFix: fetched.needsSchemaFix,
    };
  }

  if (fetched.kind === "full") {
    return { user: fetched.row };
  }

  if (fetched.kind === "legacy") {
    const mapped = mapLegacyToUser(fetched.row);
    return {
      user: null,
      errorMessage: SCHEMA_FIX_HINT,
      needsSchemaFix: true,
    };
  }

  const displayName = buildDisplayName(authUser);
  const avatarUrl =
    (authUser.user_metadata?.avatar_url as string) ||
    (authUser.user_metadata?.picture as string) ||
    null;

  const admin = createAdminClient();
  if (!admin) {
    return {
      user: null,
      errorMessage:
        "SUPABASE_SECRET_KEY が未設定です。.env.local を確認してください。",
    };
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const row: Database["public"]["Tables"]["users"]["Insert"] = {
      id: authUser.id,
      email: authUser.email ?? null,
      display_name: displayName,
      avatar_url: avatarUrl,
      friend_code: randomFriendCode(),
    };

    const { data, error } = await admin
      .from("users")
      .upsert(row, { onConflict: "id" })
      .select(FULL_COLUMNS)
      .single();

    if (data?.display_name && data.friend_code) {
      return { user: data as User };
    }

    if (isSchemaMismatchError(error?.message)) {
      return {
        user: null,
        errorMessage: SCHEMA_FIX_HINT,
        needsSchemaFix: true,
      };
    }
    if (error?.code !== "23505") {
      return {
        user: null,
        errorMessage: error?.message ?? "プロフィール作成に失敗しました",
      };
    }
  }

  const retry = await fetchUserRow(supabase, authUser.id);
  if (retry.kind === "full") {
    return { user: retry.row };
  }

  return {
    user: null,
    errorMessage: SCHEMA_FIX_HINT,
    needsSchemaFix: true,
  };
}
