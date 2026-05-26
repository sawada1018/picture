"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "お絵描き", icon: "✏️" },
  { href: "/calendar", label: "きろく", icon: "📅" },
  { href: "/friends", label: "ともだち", icon: "💑" },
] as const;

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rose-100 bg-white/95 backdrop-blur"
      aria-label="メインメニュー"
    >
      <div className="mx-auto flex max-w-lg">
        {NAV.map(({ href, label, icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition ${
                active
                  ? "text-rose-600"
                  : "text-slate-400 hover:text-rose-400"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
