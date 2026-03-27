"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { LayoutGrid, List, Loader2, PackageOpen } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { SetCard } from "@/components/set-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectUserSet } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FilterStatus = "all" | "owned" | "wishlist" | "wanted";
type SortOption = "name" | "year" | "recent" | "pieces";

export default function CollectionPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: sets, isLoading } = useSWR<SelectUserSet[]>(
    "/api/sets",
    fetcher
  );

  const handleSearch = useCallback((query: string) => {
    setSearch(query);
  }, []);

  // Client-side filtering and sorting
  const filtered = (sets ?? [])
    .filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.setNum.toLowerCase().includes(q) ||
          (s.theme && s.theme.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "year":
          return (b.year ?? 0) - (a.year ?? 0);
        case "pieces":
          return (b.numParts ?? 0) - (a.numParts ?? 0);
        case "recent":
        default:
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      }
    });

  const filterOptions: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Owned", value: "owned" },
    { label: "Wishlist", value: "wishlist" },
    { label: "Wanted", value: "wanted" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-2xl font-bold">My Collection</h1>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search sets by name, number, or theme..."
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(opt.value)}
            className="h-8 text-xs"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Sort + View Toggle */}
      <div className="flex items-center gap-2">
        <Select
          value={sort}
          onValueChange={(val) => setSort(val as SortOption)}
        >
          <SelectTrigger className="h-9 w-40 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="pieces">Piece Count</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">No sets yet</p>
            <p className="text-sm text-muted-foreground">
              Start by searching and adding sets!
            </p>
          </div>
          <Button asChild size="sm">
            <a href="/search">Search for Sets</a>
          </Button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3"
              : "flex flex-col gap-2"
          }
        >
          {filtered.map((set) => (
            <SetCard
              key={set.id}
              set={set}
              variant={viewMode}
              onClick={() => router.push(`/collection/${set.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
