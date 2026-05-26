"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-full px-4 py-2 text-sm font-bold text-rose-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      {loading ? "…" : "ログアウト"}
    </button>
  );
}
