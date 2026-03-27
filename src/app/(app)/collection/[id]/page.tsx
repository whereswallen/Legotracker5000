"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Camera,
  Check,
  Loader2,
  Package,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { SelectUserSet, SelectMissingPart, SelectSetPhoto } from "@/lib/db/schema";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const buildStatuses = ["sealed", "unbuilt", "built", "partial"] as const;
const conditions = ["new", "like_new", "good", "fair", "poor"] as const;

const buildStatusColors: Record<string, string> = {
  sealed: "bg-blue-500 hover:bg-blue-600",
  unbuilt: "bg-gray-500 hover:bg-gray-600",
  built: "bg-green-500 hover:bg-green-600",
  partial: "bg-yellow-500 hover:bg-yellow-600",
};

interface SetDetail extends SelectUserSet {
  missingParts?: SelectMissingPart[];
  photos?: SelectSetPhoto[];
}

export default function SetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const { data: set, isLoading, mutate: mutateSet } = useSWR<SetDetail>(
    `/api/sets/${id}`,
    fetcher
  );

  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Missing parts form
  const [newPartNum, setNewPartNum] = useState("");
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState("1");
  const [addingPart, setAddingPart] = useState(false);

  // Photo upload
  const [uploading, setUploading] = useState(false);

  const updateSet = useCallback(
    async (updates: Partial<SelectUserSet>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/sets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) throw new Error("Failed to update");

        await mutateSet();
        toast({ title: "Updated", description: "Set updated successfully." });
      } catch {
        toast({
          title: "Error",
          description: "Failed to update set.",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [id, mutateSet, toast]
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      toast({ title: "Deleted", description: "Set removed from collection." });
      mutate("/api/sets");
      router.push("/collection");
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete set.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const addMissingPart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPart(true);

    try {
      const res = await fetch(`/api/sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addMissingPart: {
            partNum: newPartNum,
            partName: newPartName || null,
            quantity: parseInt(newPartQty) || 1,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to add part");

      setNewPartNum("");
      setNewPartName("");
      setNewPartQty("1");
      await mutateSet();
      toast({ title: "Part added to missing list." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add missing part.",
        variant: "destructive",
      });
    } finally {
      setAddingPart(false);
    }
  };

  const resolvePart = async (partId: string) => {
    try {
      const res = await fetch(`/api/sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolveMissingPart: partId }),
      });
      if (!res.ok) throw new Error("Failed");
      await mutateSet();
    } catch {
      toast({
        title: "Error",
        description: "Failed to resolve part.",
        variant: "destructive",
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userSetId", id);

      const res = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      await mutateSet();
      toast({ title: "Photo uploaded!" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload photo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Package className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Set not found</p>
        <Button variant="outline" onClick={() => router.push("/collection")}>
          Back to Collection
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/collection")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{set.name}</h1>
          <p className="text-sm text-muted-foreground">{set.setNum}</p>
        </div>
      </div>

      {/* Set image */}
      <Card className="overflow-hidden">
        <div className="relative aspect-square w-full bg-muted">
          {set.setImgUrl ? (
            <Image
              src={set.setImgUrl}
              alt={set.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground" />
            </div>
          )}
        </div>
      </Card>

      {/* Info badges */}
      <div className="flex flex-wrap gap-2">
        {set.theme && <Badge variant="secondary">{set.theme}</Badge>}
        {set.year && <Badge variant="secondary">{set.year}</Badge>}
        {set.numParts != null && (
          <Badge variant="secondary">{set.numParts} pieces</Badge>
        )}
        <Badge variant="outline">{set.status}</Badge>
      </div>

      {/* Build Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Build Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {buildStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={set.buildStatus === status ? "default" : "outline"}
                className={
                  set.buildStatus === status
                    ? `text-white ${buildStatusColors[status]}`
                    : ""
                }
                onClick={() => updateSet({ buildStatus: status })}
                disabled={saving}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Condition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {conditions.map((cond) => (
              <Button
                key={cond}
                size="sm"
                variant={set.condition === cond ? "default" : "outline"}
                onClick={() => updateSet({ condition: cond })}
                disabled={saving}
              >
                {cond.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => updateSet({ rating: star })}
                disabled={saving}
                className="rounded p-1 transition-colors hover:bg-accent"
              >
                <Star
                  className={`h-7 w-7 ${
                    (set.rating ?? 0) >= star
                      ? "fill-yellow-400 text-yellow-400"
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add notes about this set..."
            defaultValue={set.notes ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (set.notes ?? "")) {
                updateSet({ notes: e.target.value });
              }
            }}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Purchase Price */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={set.purchasePrice ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (set.purchasePrice ?? "")) {
                  updateSet({ purchasePrice: e.target.value || null });
                }
              }}
              className="max-w-[150px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Missing Parts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Missing Parts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {set.missingParts && set.missingParts.length > 0 ? (
            <div className="space-y-2">
              {set.missingParts.map((part) => (
                <div
                  key={part.id}
                  className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                    part.resolved ? "bg-muted opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs">{part.partNum}</span>
                    {part.partName && (
                      <span className="ml-1">{part.partName}</span>
                    )}
                    {part.colorName && (
                      <span className="ml-1 text-muted-foreground">
                        ({part.colorName})
                      </span>
                    )}
                    <span className="ml-1 text-muted-foreground">
                      x{part.quantity}
                    </span>
                  </div>
                  {!part.resolved ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => resolvePart(part.id)}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Resolved
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No missing parts recorded.</p>
          )}

          <form onSubmit={addMissingPart} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Part #</Label>
              <Input
                value={newPartNum}
                onChange={(e) => setNewPartNum(e.target.value)}
                placeholder="3001"
                required
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                placeholder="2x4 Brick"
                className="h-9"
              />
            </div>
            <div className="w-16 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input
                type="number"
                value={newPartQty}
                onChange={(e) => setNewPartQty(e.target.value)}
                min="1"
                className="h-9"
              />
            </div>
            <Button type="submit" size="icon" className="h-9 w-9" disabled={addingPart}>
              {addingPart ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {set.photos && set.photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {set.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-muted"
                >
                  <Image
                    src={photo.filePath}
                    alt={photo.caption || "Set photo"}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No photos yet.</p>
          )}

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:bg-accent">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload Photo"}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </CardContent>
      </Card>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Set
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{set.name}&quot; from your
              collection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
