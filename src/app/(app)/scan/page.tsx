"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Camera,
  CameraOff,
  Check,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  ScanBarcode,
  Search,
} from "lucide-react";

interface ScannedSet {
  set_num: string;
  name: string;
  year: number;
  theme: string;
  num_parts: number;
  set_img_url: string | null;
}

export default function ScanPage() {
  const { toast } = useToast();
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<InstanceType<
    typeof import("html5-qrcode").Html5Qrcode
  > | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<ScannedSet | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [status, setStatus] = useState<"owned" | "wishlist" | "wanted">("owned");

  // Quick Add by Set Number
  const [quickSetNum, setQuickSetNum] = useState("");
  const [quickLookupLoading, setQuickLookupLoading] = useState(false);

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    setNum: "",
    name: "",
    year: "",
    theme: "",
    numParts: "",
  });

  const lookupBarcode = useCallback(
    async (code: string) => {
      setLookupLoading(true);
      setLookupError(null);
      setLookupResult(null);
      setAdded(false);
      setStatus("owned");

      try {
        const res = await fetch(`/api/rebrickable/sets/${encodeURIComponent(code)}`);
        if (!res.ok) {
          throw new Error("Set not found");
        }
        const data = await res.json();
        setLookupResult(data);
      } catch {
        setLookupError("Could not find this set. You can add it manually below.");
        setManualForm((f) => ({ ...f, setNum: code }));
      } finally {
        setLookupLoading(false);
      }
    },
    []
  );

  const startScanner = async () => {
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!scannerRef.current) return;

      const scanner = new Html5Qrcode("scanner-region");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setScannedCode(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
          lookupBarcode(decodedText);
        },
        () => {
          // Ignore scan failures (frames without barcode)
        }
      );

      setScanning(true);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to start camera";
      if (msg.includes("Permission")) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings."
        );
      } else {
        setCameraError(msg);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Scanner may already be stopped
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  };

  const handleScanAgain = async () => {
    await stopScanner();
    setScannedCode(null);
    setLookupResult(null);
    setLookupError(null);
    setAdded(false);
    setStatus("owned");
    // Brief delay to let DOM reset, then start scanner
    setTimeout(() => {
      startScanner();
    }, 100);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const addFoundSet = async () => {
    if (!lookupResult) return;
    setAddLoading(true);

    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setNum: lookupResult.set_num,
          name: lookupResult.name,
          theme: lookupResult.theme,
          year: lookupResult.year,
          numParts: lookupResult.num_parts,
          setImgUrl: lookupResult.set_img_url,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add set");
      }

      setAdded(true);
      toast({
        title: "Set added!",
        description: `${lookupResult.name} added as ${status}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add set",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);

    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setNum: manualForm.setNum,
          name: manualForm.name,
          theme: manualForm.theme || null,
          year: manualForm.year ? parseInt(manualForm.year) : null,
          numParts: manualForm.numParts ? parseInt(manualForm.numParts) : null,
          status: "owned",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add set");
      }

      toast({
        title: "Set added!",
        description: `${manualForm.name} added to your collection.`,
      });
      setManualForm({ setNum: "", name: "", year: "", theme: "", numParts: "" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add set",
        variant: "destructive",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handleQuickLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSetNum.trim()) return;
    setQuickLookupLoading(true);

    try {
      const res = await fetch(
        `/api/rebrickable/sets/${encodeURIComponent(quickSetNum.trim())}`
      );
      if (!res.ok) {
        throw new Error("Set not found");
      }
      const data = await res.json();
      setScannedCode(quickSetNum.trim());
      setLookupResult(data);
      setLookupError(null);
      setAdded(false);
      setStatus("owned");
      setQuickSetNum("");
    } catch {
      toast({
        title: "Not found",
        description: `Could not find set "${quickSetNum.trim()}" on Rebrickable.`,
        variant: "destructive",
      });
    } finally {
      setQuickLookupLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Scan Barcode</h1>

      {/* Scanner area */}
      <Card className="overflow-hidden">
        <div
          id="scanner-region"
          ref={scannerRef}
          className="relative aspect-square w-full bg-black"
        >
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
              <ScanBarcode className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Point your camera at a LEGO set barcode
              </p>
            </div>
          )}
          {scanning && (
            <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-md bg-black/60 px-3 py-1">
              <p className="flex items-center gap-2 text-xs text-white">
                <Loader2 className="h-3 w-3 animate-spin" />
                Scanning...
              </p>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          {cameraError && (
            <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {cameraError}
            </div>
          )}
          <Button
            onClick={scanning ? stopScanner : startScanner}
            className="w-full"
            variant={scanning ? "destructive" : "default"}
          >
            {scanning ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Scanner
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Start Scanner
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scanned code result */}
      {scannedCode && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-sm text-muted-foreground">
              Scanned code: <strong className="text-foreground">{scannedCode}</strong>
            </p>

            {lookupLoading && (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Looking up set...</span>
              </div>
            )}

            {lookupResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {lookupResult.set_img_url ? (
                      <Image
                        src={lookupResult.set_img_url}
                        alt={lookupResult.name}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {lookupResult.set_num}
                    </span>
                    <p className="text-sm font-semibold">{lookupResult.name}</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {lookupResult.theme}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {lookupResult.year}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {lookupResult.num_parts} pcs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <div className="flex gap-2">
                    {(["owned", "wishlist", "wanted"] as const).map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={status === s ? "default" : "outline"}
                        onClick={() => setStatus(s)}
                        className="flex-1 capitalize"
                        disabled={added}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add / Scan Again buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={addLoading || added}
                    onClick={addFoundSet}
                    variant={added ? "secondary" : "default"}
                    className="flex-1"
                  >
                    {addLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : added ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {added ? "Added" : "Add to Collection"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleScanAgain}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Scan Again
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual entry (shown when lookup fails or no API key) */}
      {(lookupError || (!lookupResult && scannedCode && !lookupLoading)) && (
        <Card>
          <CardContent className="p-4">
            {lookupError && (
              <p className="mb-3 text-sm text-muted-foreground">{lookupError}</p>
            )}
            <h3 className="mb-3 text-sm font-semibold">Add Manually</h3>
            <form onSubmit={handleManualAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Set Number *</Label>
                  <Input
                    value={manualForm.setNum}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, setNum: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    value={manualForm.year}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, year: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Theme</Label>
                  <Input
                    value={manualForm.theme}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, theme: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pieces</Label>
                  <Input
                    type="number"
                    value={manualForm.numParts}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, numParts: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={addLoading}>
                {addLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add to Collection
              </Button>
            </form>

            {/* Scan Again button in error state */}
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={handleScanAgain}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Add by Set Number - always visible */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Quick Add by Set Number</h3>
          <form onSubmit={handleQuickLookup} className="flex gap-2">
            <Input
              value={quickSetNum}
              onChange={(e) => setQuickSetNum(e.target.value)}
              placeholder="e.g. 75192-1"
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={quickLookupLoading || !quickSetNum.trim()}
            >
              {quickLookupLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Lookup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
