"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import type { SelectUserSet } from "@/lib/db/schema";

const buildStatusColors: Record<string, string> = {
  sealed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  unbuilt: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30",
  built: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  partial:
    "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
};

const collectionStatusColors: Record<string, string> = {
  owned:
    "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  wishlist:
    "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  wanted:
    "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
};

interface SetCardProps {
  set: SelectUserSet;
  variant: "grid" | "list";
  onClick?: () => void;
}

function SetImage({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-contain p-2"
      sizes="(max-width: 768px) 50vw, 200px"
    />
  );
}

export function SetCard({ set, variant, onClick }: SetCardProps) {
  const buildStatus = set.buildStatus ?? "unbuilt";
  const collectionStatus = set.status ?? "owned";

  if (variant === "list") {
    return (
      <Card
        className={cn(
          "flex cursor-pointer flex-row items-center gap-3 p-3 transition-colors hover:bg-accent/50",
          onClick && "active:scale-[0.99]"
        )}
        onClick={onClick}
      >
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
          <SetImage src={set.setImgUrl} alt={set.name} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {set.setNum}
            </span>
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0",
                collectionStatusColors[collectionStatus]
              )}
            >
              {collectionStatus}
            </Badge>
          </div>
          <h3 className="truncate text-sm font-semibold">{set.name}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            {set.theme && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {set.theme}
              </Badge>
            )}
            {set.year && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {set.year}
              </Badge>
            )}
            {set.numParts != null && (
              <span className="text-[10px] text-muted-foreground">
                {set.numParts} pcs
              </span>
            )}
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0",
                buildStatusColors[buildStatus]
              )}
            >
              {buildStatus}
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  // Grid variant
  return (
    <Card
      className={cn(
        "flex cursor-pointer flex-col overflow-hidden transition-all hover:shadow-md",
        onClick && "active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <SetImage src={set.setImgUrl} alt={set.name} />
        <div className="absolute left-1.5 top-1.5">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              collectionStatusColors[collectionStatus]
            )}
          >
            {collectionStatus}
          </Badge>
        </div>
        <div className="absolute right-1.5 top-1.5">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              buildStatusColors[buildStatus]
            )}
          >
            {buildStatus}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <span className="text-xs text-muted-foreground">{set.setNum}</span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
          {set.name}
        </h3>
        <div className="flex flex-wrap items-center gap-1">
          {set.theme && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {set.theme}
            </Badge>
          )}
          {set.year && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {set.year}
            </Badge>
          )}
        </div>
        {set.numParts != null && (
          <span className="text-xs text-muted-foreground">
            {set.numParts} pieces
          </span>
        )}
      </div>
    </Card>
  );
}
