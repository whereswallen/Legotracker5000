"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Image from "next/image";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Check,
  Key,
  Loader2,
  Package,
  Plus,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RebrickableSet {
  set_num: string;
  name: string;
  year: number;
  theme: string;
  num_parts: number;
  set_img_url: string | null;
}

export default function SearchPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [addingSet, setAddingSet] = useState<string | null>(null);
  const [addedSets, setAddedSets] = useState<Set<string>>(new Set());

  // Manual add form state
  const [manualForm, setManualForm] = useState({
    setNum: "",
    name: "",
    year: "",
    theme: "",
    numParts: "",
    imgUrl: "",
  });
  const [manualLoading, setManualLoading] = useState(false);

  // Check if user has API key by fetching profile
  const { data: profile } = useSWR("/api/sets/stats", fetcher);
  const hasApiKey = profile?.hasApiKey === true;

  // Search results from Rebrickable
  const { data: results, isLoading: searchLoading } = useSWR<{
    results: RebrickableSet[];
  }>(
    query && hasApiKey ? `/api/rebrickable/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
  }, []);

  const addToCollection = async (set: RebrickableSet) => {
    setAddingSet(set.set_num);
    try {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setNum: set.set_num,
          name: set.name,
          theme: set.theme,
          year: set.year,
          numParts: set.num_parts,
          setImgUrl: set.set_img_url,
          status: "owned",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add set");
      }

      setAddedSets((prev) => new Set(prev).add(set.set_num));
      toast({ title: "Set added!", description: `${set.name} added to your collection.` });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add set",
        variant: "destructive",
      });
    } finally {
      setAddingSet(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);

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
          setImgUrl: manualForm.imgUrl || null,
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
      setManualForm({ setNum: "", name: "", year: "", theme: "", numParts: "", imgUrl: "" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add set",
        variant: "destructive",
      });
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">Search Sets</h1>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search by set name or number..."
      />

      {/* API key notice */}
      {!hasApiKey && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Key className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-700 dark:text-yellow-400">
                No Rebrickable API Key
              </p>
              <p className="mt-1 text-muted-foreground">
                Add a Rebrickable API key in{" "}
                <a href="/profile" className="font-medium text-primary hover:underline">
                  Profile
                </a>{" "}
                for auto-search. Use manual add below for now.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search results from Rebrickable */}
      {hasApiKey && query && (
        <div className="space-y-2">
          {searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results?.results && results.results.length > 0 ? (
            results.results.map((set) => (
              <Card key={set.set_num} className="overflow-hidden">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {set.set_img_url ? (
                      <Image
                        src={set.set_img_url}
                        alt={set.name}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {set.set_num}
                    </span>
                    <p className="truncate text-sm font-semibold">{set.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {set.theme && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {set.theme}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {set.year}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {set.num_parts} pcs
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={addedSets.has(set.set_num) ? "secondary" : "default"}
                    disabled={addingSet === set.set_num || addedSets.has(set.set_num)}
                    onClick={() => addToCollection(set)}
                    className="flex-shrink-0"
                  >
                    {addingSet === set.set_num ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : addedSets.has(set.set_num) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : query ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Manual Add Form */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          {hasApiKey ? "Or Add Manually" : "Manual Add"}
        </h2>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleManualAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="setNum" className="text-xs">
                    Set Number *
                  </Label>
                  <Input
                    id="setNum"
                    placeholder="75192-1"
                    value={manualForm.setNum}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, setNum: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="year" className="text-xs">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2024"
                    value={manualForm.year}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, year: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  Set Name *
                </Label>
                <Input
                  id="name"
                  placeholder="Millennium Falcon"
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="theme" className="text-xs">
                    Theme
                  </Label>
                  <Input
                    id="theme"
                    placeholder="Star Wars"
                    value={manualForm.theme}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, theme: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="numParts" className="text-xs">
                    Piece Count
                  </Label>
                  <Input
                    id="numParts"
                    type="number"
                    placeholder="7541"
                    value={manualForm.numParts}
                    onChange={(e) =>
                      setManualForm((f) => ({ ...f, numParts: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="imgUrl" className="text-xs">
                  Image URL
                </Label>
                <Input
                  id="imgUrl"
                  type="url"
                  placeholder="https://..."
                  value={manualForm.imgUrl}
                  onChange={(e) =>
                    setManualForm((f) => ({ ...f, imgUrl: e.target.value }))
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={manualLoading}
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Collection
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
