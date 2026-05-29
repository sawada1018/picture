"use client";

import { AppBottomNav } from "@/components/layout/app-bottom-nav";
import {
  AppDataProvider,
  useAppContextState,
} from "@/components/layout/app-data-context";
import { HomeHeader } from "@/components/home/home-header";
import { ProfileSetupError } from "@/components/home/profile-setup-error";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const ctx = useAppContextState();

  if (!ctx) return null;

  if (!ctx.ok) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <ProfileSetupError
          message={ctx.errorMessage}
          needsSchemaFix={ctx.needsSchemaFix}
        />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-24 pt-8">
        <HomeHeader user={ctx.profile} />
        <div className="mt-6 flex-1">{children}</div>
      </div>
      <AppBottomNav />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppDataProvider>
  );
}
