"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import Image from "next/image";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, User, Users } from "lucide-react";
import type { SelectUserMinifig } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MinifigsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    figNum: "",
    name: "",
    quantity: "1",
    imgUrl: "",
    sourceSetNum: "",
  });

  const {
    data: minifigs,
    isLoading,
    mutate,
  } = useSWR<SelectUserMinifig[]>("/api/minifigs", fetcher);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  const filtered = (minifigs ?? []).filter((fig) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      fig.name.toLowerCase().includes(q) ||
      fig.figNum.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const res = await fetch("/api/minifigs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figNum: form.figNum,
          name: form.name,
          quantity: parseInt(form.quantity) || 1,
          imgUrl: form.imgUrl || null,
          sourceSetNum: form.sourceSetNum || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add minifig");
      }

      toast({ title: "Minifig added!", description: `${form.name} added.` });
      setForm({ figNum: "", name: "", quantity: "1", imgUrl: "", sourceSetNum: "" });
      setDialogOpen(false);
      await mutate();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minifigs</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Minifig</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Fig Number *</Label>
                  <Input
                    value={form.figNum}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, figNum: e.target.value }))
                    }
                    placeholder="fig-001234"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Luke Skywalker"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Image URL</Label>
                <Input
                  type="url"
                  value={form.imgUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, imgUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Source Set Number</Label>
                <Input
                  value={form.sourceSetNum}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sourceSetNum: e.target.value }))
                  }
                  placeholder="75192-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={adding}>
                {adding ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Minifig
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search minifigs by name or number..."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">No minifigs yet</p>
            <p className="text-sm text-muted-foreground">
              Add minifigs to your collection to see them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((fig) => (
            <Card key={fig.id} className="overflow-hidden">
              <div className="relative aspect-square w-full bg-muted">
                {fig.imgUrl ? (
                  <Image
                    src={fig.imgUrl}
                    alt={fig.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 50vw, 150px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {(fig.quantity ?? 1) > 1 && (
                  <div className="absolute right-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    x{fig.quantity}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{fig.figNum}</p>
                <p className="line-clamp-2 text-sm font-semibold leading-tight">
                  {fig.name}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
