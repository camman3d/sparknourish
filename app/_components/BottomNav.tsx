"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Home, PlusCircle, UserRound, type LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/add-food", label: "Log", Icon: PlusCircle },
  { href: "/history", label: "Progress", Icon: ChartColumn },
  { href: "/profile", label: "Profile", Icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <nav className="sticky bottom-0 z-20 border-t border-sand-200 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium"
            >
              <span
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-forest-100 text-forest-700" : "text-sand-400"
                }`}
              >
                <Icon className="h-5.5 w-5.5" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
              </span>
              <span className={active ? "font-semibold text-forest-700" : "text-sand-400"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
