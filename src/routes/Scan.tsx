import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/data/store";
import { getSet } from "@/data/rebrickable";
import type { RebrickableSet } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Camera,
  CameraOff,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Package,
  AlertTriangle,
} from "lucide-react";

type SetStatus = "owned" | "wishlist" | "wanted";

export default function Scan() {
  const { sets, addSet, rebrickableApiKey } = useAppStore();
  const { toast } = useToast();

  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<RebrickableSet | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [status, setStatus] = useState<SetStatus>("owned");
  const [added, setAdded] = useState(false);

  // Quick add state
  const [quickSetNum, setQuickSetNum] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  // Manual entry state (shown when lookup fails)
  const [manualName, setManualName] = useState("");

  const scannerRef = useRef<any>(null);
  const scannerContainerId = "barcode-scanner";

  const addedSetNums = new Set(sets.map((s) => s.setNum));

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const lookupCode = useCallback(
    async (code: string) => {
      if (!rebrickableApiKey) {
        setLookupFailed(true);
        return;
      }
      setLookupLoading(true);
      setLookupFailed(false);
      setLookupResult(null);
      try {
        // Rebrickable uses set numbers like "75192-1", barcodes may just be digits.
        // Try the code as-is first, then with "-1" appended.
        let result: RebrickableSet | null = null;
        try {
          result = await getSet(rebrickableApiKey, code);
        } catch {
          // Try with "-1" suffix if it looks like a plain number
          if (/^\d+$/.test(code)) {
            result = await getSet(rebrickableApiKey, `${code}-1`);
          } else {
            throw new Error("Not found");
          }
        }
        setLookupResult(result);
      } catch {
        setLookupFailed(true);
      } finally {
        setLookupLoading(false);
      }
    },
    [rebrickableApiKey]
  );

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setScannedCode(null);
    setLookupResult(null);
    setLookupFailed(false);
    setAdded(false);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          // On successful scan, stop scanner and look up
          setScannedCode(decodedText);
          try {
            const state = scanner.getState();
            if (state === 2) {
              await scanner.stop();
            }
          } catch {
            // ignore
          }
          setScanning(false);
          lookupCode(decodedText);
        },
        () => {
          // Ignore scan failures (continuous scanning)
        }
      );
      setScanning(true);
    } catch (err: any) {
      const message =
        err?.message?.includes("Permission") || err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your device settings."
          : "Could not start camera. Make sure no other app is using it.";
      setCameraError(message);
      setScanning(false);
    }
  }, [lookupCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            });
          } else {
            scannerRef.current.clear();
          }
        } catch {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, []);

  const handleAddSet = async (rbSet: RebrickableSet) => {
    try {
      await addSet({
        setNum: rbSet.set_num,
        name: rbSet.name,
        theme: null,
        year: rbSet.year,
        numParts: rbSet.num_parts,
        setImgUrl: rbSet.set_img_url,
        status,
        buildStatus: "unbuilt",
        condition: null,
        quantity: 1,
        purchasePrice: null,
        notes: null,
        rating: null,
      });
      setAdded(true);
      toast({
        title: "Set added",
        description: `${rbSet.set_num} ${rbSet.name} added as ${status}.`,
      });
    } catch {
      toast({
        title: "Failed to add set",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleManualAddScanned = async () => {
    if (!scannedCode || !manualName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the set.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addSet({
        setNum: scannedCode,
        name: manualName.trim(),
        theme: null,
        year: null,
        numParts: null,
        setImgUrl: null,
        status,
        buildStatus: "unbuilt",
        condition: null,
        quantity: 1,
        purchasePrice: null,
        notes: null,
        rating: null,
      });
      setAdded(true);
      toast({
        title: "Set added",
        description: `${scannedCode} added as ${status}.`,
      });
    } catch {
      toast({
        title: "Failed to add set",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const handleQuickLookup = async () => {
    const num = quickSetNum.trim();
    if (!num) return;
    if (!rebrickableApiKey) {
      toast({
        title: "No API key",
        description: "Add your Rebrickable API key in Settings first.",
        variant: "destructive",
      });
      return;
    }
    setQuickLoading(true);
    setScannedCode(num);
    setLookupResult(null);
    setLookupFailed(false);
    setAdded(false);
    try {
      let result: RebrickableSet | null = null;
      try {
        result = await getSet(rebrickableApiKey, num);
      } catch {
        if (/^\d+$/.test(num)) {
          result = await getSet(rebrickableApiKey, `${num}-1`);
        } else {
          throw new Error("Not found");
        }
      }
      setLookupResult(result);
    } catch {
      setLookupFailed(true);
      toast({
        title: "Set not found",
        description: `Could not find set "${num}" on Rebrickable.`,
        variant: "destructive",
      });
    } finally {
      setQuickLoading(false);
    }
  };

  const handleScanAgain = () => {
    setScannedCode(null);
    setLookupResult(null);
    setLookupFailed(false);
    setAdded(false);
    setManualName("");
    startScanner();
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Scan Barcode</h1>

      {/* Scanner Area */}
      <Card>
        <CardContent className="p-4">
          <div
            id={scannerContainerId}
            className="mx-auto mb-4 overflow-hidden rounded-lg bg-muted"
            style={{ minHeight: scanning ? 280 : 0 }}
          />

          {cameraError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{cameraError}</p>
            </div>
          )}

          {!scanning && !scannedCode && (
            <Button onClick={startScanner} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Scanner
            </Button>
          )}

          {scanning && (
            <Button onClick={stopScanner} variant="outline" className="w-full">
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </Button>
          )}

          {scannedCode && !scanning && (
            <div className="mt-2 text-center">
              <p className="text-sm text-muted-foreground">Scanned code:</p>
              <p className="font-mono text-lg font-semibold">{scannedCode}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Selector */}
      {(lookupResult || lookupFailed || scannedCode) && !added && (
        <div className="space-y-2">
          <Label>Add as</Label>
          <div className="flex gap-2">
            {(["owned", "wishlist", "wanted"] as SetStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={status === s ? "default" : "outline"}
                onClick={() => setStatus(s)}
                className="flex-1 capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading lookup */}
      {lookupLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Looking up set...</span>
        </div>
      )}

      {/* Lookup Result */}
      {lookupResult && !lookupLoading && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {lookupResult.set_img_url ? (
              <img
                src={lookupResult.set_img_url}
                alt={lookupResult.name}
                className="h-20 w-20 rounded object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                {lookupResult.set_num}
              </p>
              <p className="font-semibold">{lookupResult.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge variant="secondary">{lookupResult.year}</Badge>
                <Badge variant="outline">{lookupResult.num_parts} pcs</Badge>
              </div>
            </div>
          </CardContent>
          <div className="px-4 pb-4">
            {added || addedSetNums.has(lookupResult.set_num) ? (
              <Button disabled variant="secondary" className="w-full">
                Added
              </Button>
            ) : (
              <Button
                onClick={() => handleAddSet(lookupResult)}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Collection
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Lookup failed - manual entry */}
      {lookupFailed && !lookupLoading && scannedCode && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {rebrickableApiKey
                  ? "Could not find this set on Rebrickable. You can add it manually."
                  : "No API key configured. Add it in Settings, or enter the set details manually."}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-scan-name">Set Name *</Label>
              <Input
                id="manual-scan-name"
                placeholder="Enter set name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
            {added ? (
              <Button disabled variant="secondary" className="w-full">
                Added
              </Button>
            ) : (
              <Button onClick={handleManualAddScanned} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add to Collection
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scan Again */}
      {scannedCode && !scanning && (
        <Button onClick={handleScanAgain} variant="outline" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Scan Again
        </Button>
      )}

      {/* Quick Add by Set Number */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Add by Set Number</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 75192-1"
                value={quickSetNum}
                onChange={(e) => setQuickSetNum(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleQuickLookup();
                }}
                className="flex-1"
              />
              <Button onClick={handleQuickLookup} disabled={quickLoading || !quickSetNum.trim()}>
                {quickLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-1 h-4 w-4" />
                    Lookup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
