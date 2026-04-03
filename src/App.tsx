import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./data/store";
import { BottomNav } from "./components/BottomNav";
import { Loader2 } from "lucide-react";

import Dashboard from "./routes/Dashboard";
import Collection from "./routes/Collection";
import CollectionDetail from "./routes/CollectionDetail";
import Search from "./routes/Search";
import Scan from "./routes/Scan";
import Minifigs from "./routes/Minifigs";
import Parts from "./routes/Parts";
import Settings from "./routes/Settings";

export function App() {
  const init = useAppStore((s) => s.init);
  const initialized = useAppStore((s) => s.initialized);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:id" element={<CollectionDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/minifigs" element={<Minifigs />} />
          <Route path="/parts" element={<Parts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
