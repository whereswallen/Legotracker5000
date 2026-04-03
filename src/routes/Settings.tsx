import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/data/store";
import { Preferences } from "@capacitor/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Settings as SettingsIcon,
  Key,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  FileDown,
  FileUp,
  Database,
  Info,
  CheckCircle2,
} from "lucide-react";

// Storage keys must match store.ts
const STORAGE_KEYS = {
  sets: "legotracker_sets",
  minifigs: "legotracker_minifigs",
  missingParts: "legotracker_missing_parts",
  photos: "legotracker_photos",
  apiKey: "legotracker_api_key",
} as const;

export default function Settings() {
  const sets = useAppStore((s) => s.sets);
  const minifigs = useAppStore((s) => s.minifigs);
  const missingParts = useAppStore((s) => s.missingParts);
  const photos = useAppStore((s) => s.photos);
  const rebrickableApiKey = useAppStore((s) => s.rebrickableApiKey);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const addSet = useAppStore((s) => s.addSet);
  const { toast } = useToast();

  const [apiKeyInput, setApiKeyInput] = useState(rebrickableApiKey);
  const [showKey, setShowKey] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.classList.contains("dark")
  );
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // ---- API Key ----
  const handleSaveApiKey = useCallback(async () => {
    await setApiKey(apiKeyInput.trim());
    toast({ title: "API key saved" });
  }, [apiKeyInput, setApiKey, toast]);

  // ---- Dark Mode ----
  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // ---- CSV Export ----
  const handleExportCsv = useCallback(() => {
    if (sets.length === 0) {
      toast({ title: "No sets to export", variant: "destructive" });
      return;
    }
    const headers = [
      "Set Number",
      "Name",
      "Theme",
      "Year",
      "Num Parts",
      "Status",
      "Build Status",
      "Condition",
      "Quantity",
      "Purchase Price",
      "Rating",
      "Notes",
    ];
    const escCsv = (val: string | null | undefined) => {
      if (val == null) return "";
      const s = String(val);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const rows = sets.map((s) =>
      [
        escCsv(s.setNum),
        escCsv(s.name),
        escCsv(s.theme),
        escCsv(s.year != null ? String(s.year) : null),
        escCsv(s.numParts != null ? String(s.numParts) : null),
        escCsv(s.status),
        escCsv(s.buildStatus),
        escCsv(s.condition),
        escCsv(String(s.quantity)),
        escCsv(s.purchasePrice),
        escCsv(s.rating != null ? String(s.rating) : null),
        escCsv(s.notes),
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    triggerDownload(csv, "legotracker-sets.csv", "text/csv");
    toast({ title: "CSV exported" });
  }, [sets, toast]);

  // ---- BrickLink XML Export ----
  const handleExportBrickLink = useCallback(() => {
    if (sets.length === 0) {
      toast({ title: "No sets to export", variant: "destructive" });
      return;
    }
    const escXml = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const items = sets
      .map(
        (s) =>
          `  <ITEM>\n` +
          `    <ITEMTYPE>S</ITEMTYPE>\n` +
          `    <ITEMID>${escXml(s.setNum.replace(/-1$/, ""))}</ITEMID>\n` +
          `    <QTY>${s.quantity}</QTY>\n` +
          `    <CONDITION>${s.condition === "used" ? "U" : "N"}</CONDITION>\n` +
          `  </ITEM>`
      )
      .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<INVENTORY>\n${items}\n</INVENTORY>`;
    triggerDownload(xml, "legotracker-bricklink.xml", "application/xml");
    toast({ title: "BrickLink XML exported" });
  }, [sets, toast]);

  // ---- CSV Import ----
  const handleImportCsv = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          toast({
            title: "CSV file has no data rows",
            variant: "destructive",
          });
          return;
        }

        // Parse CSV rows (handling quoted fields)
        const parseCsvRow = (row: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (inQuotes) {
              if (ch === '"' && row[i + 1] === '"') {
                current += '"';
                i++;
              } else if (ch === '"') {
                inQuotes = false;
              } else {
                current += ch;
              }
            } else {
              if (ch === '"') {
                inQuotes = true;
              } else if (ch === ",") {
                result.push(current);
                current = "";
              } else {
                current += ch;
              }
            }
          }
          result.push(current);
          return result;
        };

        let imported = 0;
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvRow(lines[i]);
          const setNum = cols[0]?.trim();
          const name = cols[1]?.trim();
          if (!setNum || !name) continue;

          await addSet({
            setNum,
            name,
            theme: cols[2]?.trim() || null,
            year: cols[3] ? parseInt(cols[3]) || null : null,
            numParts: cols[4] ? parseInt(cols[4]) || null : null,
            setImgUrl: null,
            status: (cols[5]?.trim() as "owned" | "wishlist" | "wanted") || "owned",
            buildStatus:
              (cols[6]?.trim() as "sealed" | "unbuilt" | "built" | "partial") ||
              "unbuilt",
            condition: cols[7]?.trim() || null,
            quantity: cols[8] ? Math.max(1, parseInt(cols[8]) || 1) : 1,
            purchasePrice: cols[9]?.trim() || null,
            rating: cols[10] ? parseInt(cols[10]) || null : null,
            notes: cols[11]?.trim() || null,
          });
          imported++;
        }
        toast({ title: `Imported ${imported} set${imported !== 1 ? "s" : ""}` });
      } catch {
        toast({ title: "Failed to parse CSV file", variant: "destructive" });
      }

      // Reset the input so the same file can be re-imported
      if (csvInputRef.current) csvInputRef.current.value = "";
    },
    [addSet, toast]
  );

  // ---- JSON Backup Export ----
  const handleExportBackup = useCallback(() => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sets,
      minifigs,
      missingParts,
      photos,
      rebrickableApiKey,
    };
    const json = JSON.stringify(data, null, 2);
    triggerDownload(json, "legotracker-backup.json", "application/json");
    toast({ title: "Backup exported" });
  }, [sets, minifigs, missingParts, photos, rebrickableApiKey, toast]);

  // ---- JSON Backup Import ----
  const handleImportBackup = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.sets || !Array.isArray(data.sets)) {
          toast({
            title: "Invalid backup file format",
            variant: "destructive",
          });
          return;
        }

        // Write directly to Preferences and re-init the store
        await Promise.all([
          Preferences.set({
            key: STORAGE_KEYS.sets,
            value: JSON.stringify(data.sets ?? []),
          }),
          Preferences.set({
            key: STORAGE_KEYS.minifigs,
            value: JSON.stringify(data.minifigs ?? []),
          }),
          Preferences.set({
            key: STORAGE_KEYS.missingParts,
            value: JSON.stringify(data.missingParts ?? []),
          }),
          Preferences.set({
            key: STORAGE_KEYS.photos,
            value: JSON.stringify(data.photos ?? []),
          }),
          Preferences.set({
            key: STORAGE_KEYS.apiKey,
            value: JSON.stringify(data.rebrickableApiKey ?? ""),
          }),
        ]);

        // Re-init to pick up the imported data
        await useAppStore.getState().init();
        setApiKeyInput(useAppStore.getState().rebrickableApiKey);

        toast({ title: "Backup restored successfully" });
      } catch {
        toast({ title: "Failed to parse backup file", variant: "destructive" });
      }

      if (backupInputRef.current) backupInputRef.current.value = "";
    },
    [toast]
  );

  // ---- Clear All Data ----
  const handleClearAll = useCallback(async () => {
    await Promise.all([
      Preferences.remove({ key: STORAGE_KEYS.sets }),
      Preferences.remove({ key: STORAGE_KEYS.minifigs }),
      Preferences.remove({ key: STORAGE_KEYS.missingParts }),
      Preferences.remove({ key: STORAGE_KEYS.photos }),
      Preferences.remove({ key: STORAGE_KEYS.apiKey }),
    ]);
    // Re-init store to empty state
    await useAppStore.getState().init();
    setApiKeyInput("");
    setClearDialogOpen(false);
    toast({ title: "All data cleared" });
  }, [toast]);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Rebrickable API Key */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4" />
            Rebrickable API Key
            {rebrickableApiKey ? (
              <Badge className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="secondary">Not Set</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your Rebrickable API key"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get a free API key from{" "}
            <a
              href="https://rebrickable.com/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              rebrickable.com/api
            </a>
          </p>
          <Button onClick={handleSaveApiKey} size="sm" className="self-start">
            Save API Key
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                {darkMode ? "Dark theme enabled" : "Light theme enabled"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDarkMode}
              className="gap-2"
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  Dark
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Export Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="justify-start gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export Sets as CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBrickLink}
            className="justify-start gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export BrickLink XML
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Import Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="csv-import" className="text-sm">
              Import Sets from CSV
            </Label>
            <Input
              ref={csvInputRef}
              id="csv-import"
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              className="cursor-pointer text-sm"
            />
            <p className="text-xs text-muted-foreground">
              CSV should have columns: Set Number, Name, Theme, Year, Num Parts,
              Status, Build Status, Condition, Quantity, Purchase Price, Rating, Notes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportBackup}
            className="justify-start gap-2"
          >
            <FileDown className="h-4 w-4" />
            Export Backup (JSON)
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="backup-import" className="text-sm">
              Import Backup
            </Label>
            <Input
              ref={backupInputRef}
              id="backup-import"
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              className="cursor-pointer text-sm"
            />
          </div>

          <div className="mt-2 border-t pt-3">
            <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Data?</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all your sets, minifigs, missing
                    parts, photos, and settings. This action cannot be undone.
                  </p>
                  <p className="text-sm font-medium text-destructive">
                    Consider exporting a backup first.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleClearAll}
                      className="flex-1"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete Everything
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setClearDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">LegoTracker5000</p>
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Shared download helper ----
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
