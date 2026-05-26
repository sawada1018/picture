import Image from "next/image";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { User } from "@/types/database";

export function HomeHeader({ user }: { user: User }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-2xl border-2 border-rose-200 object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-xl">
            💕
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-rose-400">おかえりなさい</p>
          <h1 className="text-lg font-extrabold text-slate-800">
            {user.display_name} さん
          </h1>
        </div>
      </div>
      <SignOutButton />
    </header>
  );
}
