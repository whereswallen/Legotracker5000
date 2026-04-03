import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "@/data/store";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Check, Puzzle, Hash, PackageCheck } from "lucide-react";

interface GroupedParts {
  setId: string;
  setNum: string;
  setName: string;
  parts: Array<{
    id: string;
    partNum: string;
    partName: string | null;
    colorName: string | null;
    quantity: number;
    imgUrl: string | null;
    resolved: boolean;
  }>;
}

export default function Parts() {
  const missingParts = useAppStore((s) => s.missingParts);
  const sets = useAppStore((s) => s.sets);
  const resolveMissingPart = useAppStore((s) => s.resolveMissingPart);
  const { toast } = useToast();

  const [query, setQuery] = useState("");

  // Build a lookup from set id to set info
  const setMap = useMemo(() => {
    const m = new Map<string, { setNum: string; name: string }>();
    for (const s of sets) {
      m.set(s.id, { setNum: s.setNum, name: s.name });
    }
    return m;
  }, [sets]);

  // Group missing parts by set
  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filteredParts = q
      ? missingParts.filter(
          (p) =>
            p.partNum.toLowerCase().includes(q) ||
            (p.partName && p.partName.toLowerCase().includes(q)) ||
            (p.colorName && p.colorName.toLowerCase().includes(q))
        )
      : missingParts;

    const groups = new Map<string, GroupedParts>();
    for (const p of filteredParts) {
      const setInfo = setMap.get(p.userSetId);
      if (!groups.has(p.userSetId)) {
        groups.set(p.userSetId, {
          setId: p.userSetId,
          setNum: setInfo?.setNum ?? "Unknown",
          setName: setInfo?.name ?? "Unknown Set",
          parts: [],
        });
      }
      groups.get(p.userSetId)!.parts.push({
        id: p.id,
        partNum: p.partNum,
        partName: p.partName,
        colorName: p.colorName,
        quantity: p.quantity,
        imgUrl: p.imgUrl,
        resolved: p.resolved,
      });
    }
    return Array.from(groups.values());
  }, [missingParts, setMap, query]);

  // Stats
  const uniqueCount = useMemo(() => {
    const nums = new Set(missingParts.map((p) => p.partNum));
    return nums.size;
  }, [missingParts]);

  const totalMissing = useMemo(
    () =>
      missingParts
        .filter((p) => !p.resolved)
        .reduce((sum, p) => sum + p.quantity, 0),
    [missingParts]
  );

  const handleResolve = useCallback(
    async (id: string) => {
      await resolveMissingPart(id);
      toast({ title: "Part marked as found" });
    },
    [resolveMissingPart, toast]
  );

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Puzzle className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Missing Parts</h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{uniqueCount}</p>
              <p className="text-xs text-muted-foreground">Unique Parts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-destructive/10 p-2">
              <Puzzle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMissing}</p>
              <p className="text-xs text-muted-foreground">Total Missing</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {missingParts.length > 0 && (
        <SearchBar
          onSearch={setQuery}
          placeholder="Search by part number, name, or color..."
        />
      )}

      {/* Empty state */}
      {missingParts.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <PackageCheck className="h-16 w-16 opacity-40" />
          <p className="text-lg font-medium">
            No missing parts - everything accounted for!
          </p>
          <p className="text-sm">
            Missing parts tracked from your sets will appear here.
          </p>
        </div>
      )}

      {/* Filtered empty */}
      {missingParts.length > 0 && grouped.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          No parts match your search.
        </p>
      )}

      {/* Groups */}
      {grouped.map((group) => (
        <Card key={group.setId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {group.setNum} - {group.setName}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {group.parts.map((part) => (
              <div
                key={part.id}
                className={`flex items-center gap-3 rounded-lg border p-2.5 ${
                  part.resolved
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                    : ""
                }`}
              >
                {/* Part image */}
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {part.imgUrl ? (
                    <img
                      src={part.imgUrl}
                      alt={part.partName ?? part.partNum}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Puzzle className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {part.partName ?? part.partNum}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      {part.partNum}
                    </span>
                    {part.colorName && (
                      <Badge variant="outline" className="h-5 text-[10px]">
                        {part.colorName}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="h-5 text-[10px]">
                      x{part.quantity}
                    </Badge>
                  </div>
                </div>

                {/* Resolve status / button */}
                {part.resolved ? (
                  <Badge className="flex-shrink-0 bg-green-600 hover:bg-green-700">
                    <Check className="mr-1 h-3 w-3" />
                    Found
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-shrink-0"
                    onClick={() => handleResolve(part.id)}
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Found
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
