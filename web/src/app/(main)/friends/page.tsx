"use client";

import { PairSection } from "@/components/home/pair-section";
import { useAppData } from "@/components/layout/app-data-context";

export default function FriendsPage() {
  const { profile, pairInfo, refresh } = useAppData();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-50 bg-white/80 p-4 text-center shadow-sm">
        <p className="text-xs font-bold text-slate-400">ペア状態</p>
        <p className="mt-1 text-sm font-extrabold text-slate-700">
          {pairInfo
            ? `${pairInfo.partner.display_name} さんと接続中 💑`
            : "まだペアになっていません"}
        </p>
      </div>

      <PairSection
        myFriendCode={profile.friend_code}
        paired={!!pairInfo}
        partnerName={pairInfo?.partner.display_name}
        partnerCode={pairInfo?.partner.friend_code}
        onPaired={refresh}
      />
    </div>
  );
}
