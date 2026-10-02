"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChartColumn, Home, PlusCircle, UserRound, type LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/add-food", label: "Log", Icon: PlusCircle },
  { href: "/move", label: "Move", Icon: Activity },
  { href: "/history", label: "Progress", Icon: ChartColumn },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

/**
 * Fixed, device-width bottom navigation. A spacer reserves the bar's height in
 * the page flow so content is never hidden behind it, and the bar itself is
 * pinned to the viewport so it stays visible on every screen while scrolling.
 */
export function BottomNav() {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/food/") ||
    // The log / timer / completion flow is a full-screen task without the nav.
    pathname.startsWith("/move/")
  ) {
    return null;
  }

  return (
    <>
      <div aria-hidden className="h-[calc(4.25rem+env(safe-area-inset-bottom))] shrink-0" />
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-sand-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium"
              >
                <span
                  className={`flex h-8 w-12 max-w-full items-center justify-center rounded-full transition-colors ${
                    active ? "bg-forest-100 text-forest-700" : "text-sand-400"
                  }`}
                >
                  <Icon className="h-5.5 w-5.5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                </span>
                <span
                  className={`max-w-full truncate ${
                    active ? "font-semibold text-forest-700" : "text-sand-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
