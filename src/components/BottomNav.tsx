import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Search,
  ScanBarcode,
  Settings,
} from "lucide-react";

const tabs = [
  { path: "/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/collection", label: "Collection", icon: Library },
  { path: "/search", label: "Search", icon: Search },
  { path: "/scan", label: "Scan", icon: ScanBarcode },
  { path: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background safe-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            location.pathname === tab.path ||
            (tab.path !== "/dashboard" &&
              location.pathname.startsWith(tab.path));

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
