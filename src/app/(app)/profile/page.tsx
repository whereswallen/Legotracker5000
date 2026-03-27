"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Download,
  Eye,
  EyeOff,
  Key,
  Loader2,
  LogOut,
  Moon,
  Save,
  Sun,
  Upload,
  User,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ProfileData {
  displayName: string | null;
  username: string;
  email: string;
  isPublic: number | null;
  hasApiKey: boolean;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { data: profile, mutate: mutateProfile } = useSWR<ProfileData>(
    "/api/profile",
    fetcher
  );

  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? "");
      setIsPublic(!!profile.isPublic);
    }
  }, [profile]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const saveDisplayName = async () => {
    setSavingName(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await mutateProfile();
      toast({ title: "Saved", description: "Display name updated." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save display name.",
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  };

  const saveApiKey = async () => {
    setSavingKey(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rebrickableApiKey: apiKey }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setApiKey("");
      await mutateProfile();
      toast({ title: "Saved", description: "API key updated." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save API key.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(false);
    }
  };

  const togglePublic = async () => {
    setSavingPublic(true);
    const newValue = !isPublic;
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newValue ? 1 : 0 }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setIsPublic(newValue);
      await mutateProfile();
      toast({
        title: newValue ? "Collection is now public" : "Collection is now private",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update visibility.",
        variant: "destructive",
      });
    } finally {
      setSavingPublic(false);
    }
  };

  const exportCollection = async (format: "csv" | "bricklink") => {
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lego-collection.${format === "csv" ? "csv" : "xml"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Exported!", description: `Collection exported as ${format.toUpperCase()}.` });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export collection.",
        variant: "destructive",
      });
    }
  };

  const importCollection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      toast({
        title: "Imported!",
        description: `${data.imported ?? 0} sets imported.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Import failed",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const username =
    (session?.user as { username?: string })?.username ??
    profile?.username ??
    "";
  const email = session?.user?.email ?? profile?.email ?? "";

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Profile & Settings</h1>

      {/* User info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="flex gap-2">
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
              <Button
                onClick={saveDisplayName}
                disabled={savingName}
                size="icon"
              >
                {savingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Rebrickable API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Get a free API key from{" "}
            <a
              href="https://rebrickable.com/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              rebrickable.com/api
            </a>{" "}
            to enable set search and barcode lookup.
          </p>
          {profile?.hasApiKey && (
            <p className="text-xs text-green-600 dark:text-green-400">
              API key is configured.
            </p>
          )}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  profile?.hasApiKey
                    ? "Enter new key to update"
                    : "Paste your API key"
                }
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button
              onClick={saveApiKey}
              disabled={savingKey || !apiKey}
              size="icon"
            >
              {savingKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collection Visibility */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Public Collection</p>
            <p className="text-xs text-muted-foreground">
              Allow others to view your collection via shareable link
            </p>
            {isPublic && username && (
              <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/share/{username}
              </p>
            )}
          </div>
          <Button
            variant={isPublic ? "default" : "outline"}
            size="sm"
            onClick={togglePublic}
            disabled={savingPublic}
          >
            {savingPublic ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPublic ? (
              "Public"
            ) : (
              "Private"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Export / Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCollection("csv")}
            >
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCollection("bricklink")}
            >
              <Download className="mr-1 h-4 w-4" />
              BrickLink XML
            </Button>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:bg-accent">
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {importing ? "Importing..." : "Import CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={importCollection}
              className="hidden"
              disabled={importing}
            />
          </label>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">
              Toggle dark theme
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={toggleDarkMode}>
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
