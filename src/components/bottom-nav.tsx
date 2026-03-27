"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  Search,
  ScanBarcode,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavTab {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  primary?: boolean;
}

const tabs: NavTab[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Collection", icon: Library, href: "/collection" },
  { label: "Search", icon: Search, href: "/search", primary: true },
  { label: "Scan", icon: ScanBarcode, href: "/scan" },
  { label: "Profile", icon: User, href: "/profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all",
                  tab.primary && "bg-primary/10 p-2",
                  tab.primary && isActive && "bg-primary/20"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all",
                    tab.primary ? "h-6 w-6" : "h-5 w-5",
                    isActive && "scale-110"
                  )}
                />
              </div>
              <span className={cn("font-medium", isActive && "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
