import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppStore } from "@/data/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Star,
  Trash2,
  Camera,
  Plus,
  Check,
  Package,
  X,
} from "lucide-react";
import type { LegoSet } from "@/types";

const BUILD_STATUSES: {
  value: LegoSet["buildStatus"];
  label: string;
  color: string;
  activeColor: string;
}[] = [
  { value: "sealed", label: "Sealed", color: "bg-blue-500/10 text-blue-600 border-blue-200", activeColor: "bg-blue-500 text-white border-blue-500" },
  { value: "unbuilt", label: "Unbuilt", color: "bg-amber-500/10 text-amber-600 border-amber-200", activeColor: "bg-amber-500 text-white border-amber-500" },
  { value: "built", label: "Built", color: "bg-green-500/10 text-green-600 border-green-200", activeColor: "bg-green-500 text-white border-green-500" },
  { value: "partial", label: "Partial", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", activeColor: "bg-yellow-500 text-white border-yellow-500" },
];

const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const sets = useAppStore((s) => s.sets);
  const missingParts = useAppStore((s) => s.missingParts);
  const photos = useAppStore((s) => s.photos);
  const updateSet = useAppStore((s) => s.updateSet);
  const deleteSet = useAppStore((s) => s.deleteSet);
  const addMissingPart = useAppStore((s) => s.addMissingPart);
  const resolveMissingPart = useAppStore((s) => s.resolveMissingPart);
  const addPhoto = useAppStore((s) => s.addPhoto);
  const deletePhoto = useAppStore((s) => s.deletePhoto);

  const set = useMemo(() => sets.find((s) => s.id === id), [sets, id]);

  const setMissingParts = useMemo(
    () => missingParts.filter((p) => p.userSetId === id),
    [missingParts, id]
  );

  const setPhotos = useMemo(
    () => photos.filter((p) => p.userSetId === id),
    [photos, id]
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newPartNum, setNewPartNum] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!set) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
        <Package className="h-16 w-16 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Set not found.</p>
        <Button variant="outline" onClick={() => navigate("/collection")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Collection
        </Button>
      </div>
    );
  }

  const handleBuildStatus = (status: LegoSet["buildStatus"]) => {
    updateSet(set.id, { buildStatus: status });
  };

  const handleCondition = (condition: string) => {
    updateSet(set.id, { condition });
  };

  const handleRating = (rating: number) => {
    updateSet(set.id, { rating: set.rating === rating ? null : rating });
  };

  const handleNotesBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const notes = e.target.value.trim() || null;
    if (notes !== set.notes) {
      updateSet(set.id, { notes });
    }
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const purchasePrice = e.target.value.trim() || null;
    if (purchasePrice !== set.purchasePrice) {
      updateSet(set.id, { purchasePrice });
    }
  };

  const handleAddMissingPart = () => {
    if (!newPartNum.trim()) return;
    addMissingPart({
      userSetId: set.id,
      partNum: newPartNum.trim(),
      partName: newPartName.trim() || null,
      colorName: null,
      colorId: null,
      quantity: parseInt(newPartQty, 10) || 1,
      imgUrl: null,
    });
    setNewPartNum("");
    setNewPartName("");
    setNewPartQty("1");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      addPhoto({
        userSetId: set.id,
        dataUrl,
        caption: null,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDelete = async () => {
    await deleteSet(set.id);
    navigate("/collection");
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2"
        onClick={() => navigate("/collection")}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      {/* Set Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {set.setImgUrl ? (
          <img
            src={set.setImgUrl}
            alt={set.name}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Set Info */}
      <div>
        <p className="text-sm text-muted-foreground">{set.setNum}</p>
        <h1 className="text-xl font-bold">{set.name}</h1>
      </div>

      {/* Info Badges */}
      <div className="flex flex-wrap gap-2">
        {set.theme && (
          <Badge variant="secondary">{set.theme}</Badge>
        )}
        {set.year && (
          <Badge variant="secondary">{set.year}</Badge>
        )}
        {set.numParts != null && (
          <Badge variant="secondary">{set.numParts} pcs</Badge>
        )}
        <Badge variant="outline" className="capitalize">
          {set.status}
        </Badge>
      </div>

      {/* Build Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Build Status</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-4 gap-2">
            {BUILD_STATUSES.map((bs) => (
              <button
                key={bs.value}
                onClick={() => handleBuildStatus(bs.value)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  set.buildStatus === bs.value ? bs.activeColor : bs.color
                }`}
              >
                {bs.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Condition</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Badge
                key={c}
                variant={set.condition === c ? "default" : "outline"}
                className="cursor-pointer px-3 py-1 text-sm"
                onClick={() => handleCondition(c)}
              >
                {CONDITION_LABELS[c]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Rating</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRating(star)}
                className="p-0.5"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    set.rating != null && star <= set.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Notes</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <Textarea
            defaultValue={set.notes ?? ""}
            onBlur={handleNotesBlur}
            placeholder="Add notes about this set..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Purchase Price */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Purchase Price</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              defaultValue={set.purchasePrice ?? ""}
              onBlur={handlePriceBlur}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </CardContent>
      </Card>

      {/* Missing Parts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Missing Parts{" "}
            {setMissingParts.length > 0 && (
              <span className="text-muted-foreground">
                ({setMissingParts.filter((p) => !p.resolved).length} unresolved)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-4">
          {/* Existing missing parts */}
          {setMissingParts.length > 0 && (
            <div className="flex flex-col gap-2">
              {setMissingParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    part.resolved ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {part.partName || part.partNum}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{part.partNum} &middot; Qty: {part.quantity}
                      {part.colorName && ` \u00B7 ${part.colorName}`}
                    </span>
                  </div>
                  {part.resolved ? (
                    <Badge variant="secondary" className="text-xs">
                      <Check className="mr-1 h-3 w-3" />
                      Resolved
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMissingPart(part.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add missing part form */}
          <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Add Missing Part
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Part Number *</Label>
                <Input
                  value={newPartNum}
                  onChange={(e) => setNewPartNum(e.target.value)}
                  placeholder="e.g. 3001"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Part Name (optional)</Label>
              <Input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="e.g. Brick 2x4"
                className="h-9 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleAddMissingPart}
              disabled={!newPartNum.trim()}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Part
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Photos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pb-4">
          {setPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {setPhotos.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img
                    src={photo.dataUrl}
                    alt={photo.caption ?? "Set photo"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Add Photo
          </Button>
        </CardContent>
      </Card>

      {/* Delete Set */}
      <Card className="border-destructive/50">
        <CardContent className="p-4">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Set
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{set.name}"? This will also remove
              all associated missing parts and photos. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
