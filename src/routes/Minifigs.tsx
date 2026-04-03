import { useCallback, useMemo, useState } from "react";
import { useAppStore } from "@/data/store";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Users, PackageOpen } from "lucide-react";

export default function Minifigs() {
  const minifigs = useAppStore((s) => s.minifigs);
  const addMinifig = useAppStore((s) => s.addMinifig);
  const deleteMinifig = useAppStore((s) => s.deleteMinifig);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add form state
  const [figNum, setFigNum] = useState("");
  const [figName, setFigName] = useState("");
  const [figQty, setFigQty] = useState("1");
  const [figImg, setFigImg] = useState("");
  const [figSource, setFigSource] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return minifigs;
    const q = query.toLowerCase();
    return minifigs.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.figNum.toLowerCase().includes(q)
    );
  }, [minifigs, query]);

  const resetForm = useCallback(() => {
    setFigNum("");
    setFigName("");
    setFigQty("1");
    setFigImg("");
    setFigSource("");
  }, []);

  const handleAdd = useCallback(async () => {
    if (!figNum.trim() || !figName.trim()) {
      toast({ title: "Fig Number and Name are required", variant: "destructive" });
      return;
    }
    await addMinifig({
      figNum: figNum.trim(),
      name: figName.trim(),
      quantity: Math.max(1, parseInt(figQty) || 1),
      imgUrl: figImg.trim() || null,
      sourceSetNum: figSource.trim() || null,
      numParts: null,
      notes: null,
    });
    toast({ title: "Minifig added" });
    resetForm();
    setDialogOpen(false);
  }, [figNum, figName, figQty, figImg, figSource, addMinifig, toast, resetForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMinifig(id);
      setConfirmDeleteId(null);
      toast({ title: "Minifig deleted" });
    },
    [deleteMinifig, toast]
  );

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Minifigs</h1>
          {minifigs.length > 0 && (
            <Badge variant="secondary">{minifigs.length}</Badge>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Minifig</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="figNum">Fig Number *</Label>
                <Input
                  id="figNum"
                  placeholder="e.g. fig-001234"
                  value={figNum}
                  onChange={(e) => setFigNum(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="figName">Name *</Label>
                <Input
                  id="figName"
                  placeholder="e.g. Harry Potter"
                  value={figName}
                  onChange={(e) => setFigName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="figQty">Quantity</Label>
                <Input
                  id="figQty"
                  type="number"
                  min={1}
                  value={figQty}
                  onChange={(e) => setFigQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="figImg">Image URL</Label>
                <Input
                  id="figImg"
                  placeholder="https://..."
                  value={figImg}
                  onChange={(e) => setFigImg(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="figSource">Source Set Number</Label>
                <Input
                  id="figSource"
                  placeholder="e.g. 75978-1"
                  value={figSource}
                  onChange={(e) => setFigSource(e.target.value)}
                />
              </div>
              <Button onClick={handleAdd} className="mt-2">
                Add Minifig
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {minifigs.length > 0 && (
        <SearchBar
          onSearch={setQuery}
          placeholder="Search by name or fig number..."
        />
      )}

      {/* Empty state */}
      {minifigs.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <PackageOpen className="h-16 w-16 opacity-40" />
          <p className="text-lg font-medium">No minifigs yet</p>
          <p className="text-sm">Tap the Add button to start tracking your collection.</p>
        </div>
      )}

      {/* Filtered empty */}
      {minifigs.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          No minifigs match your search.
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filtered.map((fig) => (
          <Card key={fig.id} className="relative overflow-hidden">
            {/* Quantity badge */}
            {fig.quantity > 1 && (
              <Badge className="absolute right-2 top-2 z-10">
                x{fig.quantity}
              </Badge>
            )}

            {/* Image */}
            <div className="aspect-square w-full overflow-hidden bg-muted">
              {fig.imgUrl ? (
                <img
                  src={fig.imgUrl}
                  alt={fig.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Users className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <CardContent className="p-2.5">
              <p className="truncate text-xs text-muted-foreground">
                {fig.figNum}
              </p>
              <p className="mt-0.5 truncate text-sm font-medium">{fig.name}</p>
              {fig.sourceSetNum && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Set {fig.sourceSetNum}
                </p>
              )}

              {/* Delete */}
              {confirmDeleteId === fig.id ? (
                <div className="mt-2 flex gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => handleDelete(fig.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-xs"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 w-full text-xs text-destructive hover:text-destructive"
                  onClick={() => setConfirmDeleteId(fig.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
