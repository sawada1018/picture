"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppContext } from "@/lib/auth/get-app-context";

type AppDataContextValue = {
  ctx: AppContext;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: AppContext | null;
}) {
  const [ctx, setCtx] = useState<AppContext | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = (await res.json()) as AppContext;
    setCtx(data);
  }, []);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initial, refresh]);

  const value = useMemo(
    () => (ctx ? { ctx, refresh } : null),
    [ctx, refresh]
  );

  if (loading || !value) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-24 pt-8">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-rose-100" />
        <div className="mt-6 flex-1 space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-rose-50" />
          <div className="h-64 animate-pulse rounded-3xl bg-rose-50" />
        </div>
      </div>
    );
  }

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value?.ctx.ok) {
    throw new Error("useAppData requires authenticated app context");
  }
  return { ...value.ctx, refresh: value.refresh };
}

export function useAppContextState() {
  return useContext(AppDataContext)?.ctx ?? null;
}
