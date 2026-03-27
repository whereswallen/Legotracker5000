"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { SearchBar } from "@/components/search-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, Puzzle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PartEntry {
  partNum: string;
  name: string;
  color: string;
  imgUrl: string | null;
  totalQuantity: number;
}

interface PartsData {
  uniqueParts: number;
  totalCount: number;
  parts: PartEntry[];
}

export default function PartsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<PartsData>("/api/parts", fetcher);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  const parts = (data?.parts ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.partNum.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Parts Inventory</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Puzzle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{data?.uniqueParts ?? 0}</p>
              <p className="text-xs text-muted-foreground">Unique Parts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{data?.totalCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Parts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search parts by number, name, or color..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : parts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Puzzle className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">No parts yet</p>
            <p className="text-sm text-muted-foreground">
              Parts will appear here once you add sets to your collection.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-2 py-1 text-xs font-medium text-muted-foreground">
            <span></span>
            <span>Part</span>
            <span className="text-right">Qty</span>
          </div>

          {parts.map((part, idx) => (
            <Card key={`${part.partNum}-${part.color}-${idx}`}>
              <CardContent className="grid grid-cols-[40px_1fr_auto] items-center gap-3 p-2">
                <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                  {part.imgUrl ? (
                    <Image
                      src={part.imgUrl}
                      alt={part.name}
                      fill
                      className="object-contain p-0.5"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Puzzle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{part.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {part.partNum}
                    {part.color && ` - ${part.color}`}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {part.totalQuantity}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
