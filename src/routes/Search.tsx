import { useState, useCallback } from "react";
import { useAppStore } from "@/data/store";
import { searchSets } from "@/data/rebrickable";
import type { RebrickableSet } from "@/types";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Search as SearchIcon, AlertTriangle, Package } from "lucide-react";

export default function Search() {
  const { sets, addSet, rebrickableApiKey } = useAppStore();
  const { toast } = useToast();

  const [results, setResults] = useState<RebrickableSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addedSetNums, setAddedSetNums] = useState<Set<string>>(() => {
    return new Set(sets.map((s) => s.setNum));
  });

  // Manual form state
  const [manualSetNum, setManualSetNum] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualTheme, setManualTheme] = useState("");
  const [manualPieces, setManualPieces] = useState("");
  const [manualImgUrl, setManualImgUrl] = useState("");

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const data = await searchSets(rebrickableApiKey, query);
        setResults(data.results);
      } catch {
        toast({
          title: "Search failed",
          description: "Could not search Rebrickable. Check your API key and try again.",
          variant: "destructive",
        });
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [rebrickableApiKey, toast]
  );

  const handleAddFromSearch = async (rbSet: RebrickableSet) => {
    try {
      await addSet({
        setNum: rbSet.set_num,
        name: rbSet.name,
        theme: null,
        year: rbSet.year,
        numParts: rbSet.num_parts,
        setImgUrl: rbSet.set_img_url,
        status: "owned",
        buildStatus: "unbuilt",
        condition: null,
        quantity: 1,
        purchasePrice: null,
        notes: null,
        rating: null,
      });
      setAddedSetNums((prev) => new Set(prev).add(rbSet.set_num));
      toast({ title: "Set added", description: `${rbSet.set_num} ${rbSet.name} added to your collection.` });
    } catch {
      toast({ title: "Failed to add set", description: "Something went wrong.", variant: "destructive" });
    }
  };

  const handleManualAdd = async () => {
    if (!manualSetNum.trim() || !manualName.trim()) {
      toast({ title: "Missing fields", description: "Set Number and Name are required.", variant: "destructive" });
      return;
    }
    try {
      await addSet({
        setNum: manualSetNum.trim(),
        name: manualName.trim(),
        theme: manualTheme.trim() || null,
        year: manualYear ? parseInt(manualYear, 10) : null,
        numParts: manualPieces ? parseInt(manualPieces, 10) : null,
        setImgUrl: manualImgUrl.trim() || null,
        status: "owned",
        buildStatus: "unbuilt",
        condition: null,
        quantity: 1,
        purchasePrice: null,
        notes: null,
        rating: null,
      });
      setAddedSetNums((prev) => new Set(prev).add(manualSetNum.trim()));
      toast({ title: "Set added", description: `${manualSetNum.trim()} added to your collection.` });
      setManualSetNum("");
      setManualName("");
      setManualYear("");
      setManualTheme("");
      setManualPieces("");
      setManualImgUrl("");
    } catch {
      toast({ title: "Failed to add set", description: "Something went wrong.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Search Sets</h1>

      {rebrickableApiKey ? (
        <>
          <SearchBar onSearch={handleSearch} placeholder="Search Rebrickable sets..." />

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <SearchIcon className="h-8 w-8" />
              <p>No sets found. Try a different search term.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid gap-3">
              {results.map((rbSet) => {
                const alreadyAdded = addedSetNums.has(rbSet.set_num);
                return (
                  <Card key={rbSet.set_num}>
                    <CardContent className="flex items-center gap-3 p-3">
                      {rbSet.set_img_url ? (
                        <img
                          src={rbSet.set_img_url}
                          alt={rbSet.name}
                          className="h-16 w-16 rounded object-contain"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">{rbSet.set_num}</p>
                        <p className="font-medium truncate">{rbSet.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="secondary">{rbSet.year}</Badge>
                          <Badge variant="outline">Theme {rbSet.theme_id}</Badge>
                          <Badge variant="outline">{rbSet.num_parts} pcs</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={alreadyAdded ? "secondary" : "default"}
                        disabled={alreadyAdded}
                        onClick={() => handleAddFromSearch(rbSet)}
                      >
                        {alreadyAdded ? "Added" : (
                          <>
                            <Plus className="mr-1 h-4 w-4" />
                            Add
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                No Rebrickable API Key
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Add your Rebrickable API key in Settings to search for sets online. You can still add sets manually below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Add Form */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Add Set Manually</h2>
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual-set-num">Set Number *</Label>
                <Input
                  id="manual-set-num"
                  placeholder="e.g. 75192-1"
                  value={manualSetNum}
                  onChange={(e) => setManualSetNum(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-name">Name *</Label>
                <Input
                  id="manual-name"
                  placeholder="e.g. Millennium Falcon"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual-year">Year</Label>
                <Input
                  id="manual-year"
                  type="number"
                  placeholder="2024"
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-theme">Theme</Label>
                <Input
                  id="manual-theme"
                  placeholder="Star Wars"
                  value={manualTheme}
                  onChange={(e) => setManualTheme(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manual-pieces">Pieces</Label>
                <Input
                  id="manual-pieces"
                  type="number"
                  placeholder="7541"
                  value={manualPieces}
                  onChange={(e) => setManualPieces(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-img">Image URL</Label>
              <Input
                id="manual-img"
                type="url"
                placeholder="https://..."
                value={manualImgUrl}
                onChange={(e) => setManualImgUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleManualAdd} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add to Collection
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
