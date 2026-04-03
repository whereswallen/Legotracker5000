import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SetCard } from "@/components/SetCard";
import { SearchBar } from "@/components/SearchBar";
import { LayoutGrid, List, Plus, PackageOpen } from "lucide-react";
import type { LegoSet } from "@/types";

type StatusFilter = "all" | "owned" | "wishlist" | "wanted";
type SortOption = "recent" | "name" | "year" | "pieces";

export default function Collection() {
  const navigate = useNavigate();
  const sets = useAppStore((s) => s.sets);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  const filtered = useMemo(() => {
    let result: LegoSet[] = [...sets];

    // Status filter
    if (filter !== "all") {
      result = result.filter((s) => s.status === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.setNum.toLowerCase().includes(q) ||
          (s.theme && s.theme.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "year":
        result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case "pieces":
        result.sort((a, b) => (b.numParts ?? 0) - (a.numParts ?? 0));
        break;
      case "recent":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [sets, search, filter, sort]);

  const filterChips: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Owned", value: "owned" },
    { label: "Wishlist", value: "wishlist" },
    { label: "Wanted", value: "wanted" },
  ];

  if (sets.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <PackageOpen className="h-20 w-20 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-bold">No Sets Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start building your collection by adding your first LEGO set.
          </p>
        </div>
        <Button onClick={() => navigate("/search")}>
          <Plus className="mr-2 h-4 w-4" />
          Add a Set
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold">Collection</h1>

      {/* Search */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search sets by name, number, or theme..."
      />

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto">
        {filterChips.map((chip) => (
          <Badge
            key={chip.value}
            variant={filter === chip.value ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap px-3 py-1 text-sm"
            onClick={() => setFilter(chip.value)}
          >
            {chip.label}
          </Badge>
        ))}
      </div>

      {/* Sort + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortOption)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="pieces">Piece Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon"
          variant={viewMode === "grid" ? "default" : "outline"}
          className="h-9 w-9"
          onClick={() => setViewMode("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={viewMode === "list" ? "default" : "outline"}
          className="h-9 w-9"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-muted-foreground">
            No sets match your search or filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((set) => (
            <SetCard
              key={set.id}
              set={set}
              variant="grid"
              onClick={() => navigate(`/collection/${set.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((set) => (
            <SetCard
              key={set.id}
              set={set}
              variant="list"
              onClick={() => navigate(`/collection/${set.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
