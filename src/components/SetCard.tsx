import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import type { LegoSet } from "@/types";

interface Props {
  set: LegoSet;
  variant?: "grid" | "list";
  onClick?: () => void;
}

const buildStatusColors: Record<string, string> = {
  sealed: "bg-blue-500",
  unbuilt: "bg-gray-500",
  built: "bg-green-500",
  partial: "bg-yellow-500",
};

export function SetCard({ set, variant = "grid", onClick }: Props) {
  if (variant === "list") {
    return (
      <Card
        className="cursor-pointer overflow-hidden transition-colors hover:bg-accent/50 active:bg-accent"
        onClick={onClick}
      >
        <CardContent className="flex items-center gap-3 p-3">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {set.setImgUrl ? (
              <img
                src={set.setImgUrl}
                alt={set.name}
                className="h-full w-full object-contain p-1"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{set.setNum}</span>
            <p className="truncate text-sm font-semibold">{set.name}</p>
            <div className="flex flex-wrap gap-1">
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
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                {set.buildStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full bg-muted">
        {set.setImgUrl ? (
          <img
            src={set.setImgUrl}
            alt={set.name}
            className="h-full w-full object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute left-1.5 top-1.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {set.status}
          </Badge>
        </div>
        {set.buildStatus !== "unbuilt" && (
          <div className="absolute right-1.5 top-1.5">
            <Badge
              className={`text-[10px] px-1.5 py-0 text-white capitalize ${
                buildStatusColors[set.buildStatus] ?? ""
              }`}
            >
              {set.buildStatus}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{set.setNum}</p>
        <p className="line-clamp-2 text-sm font-semibold leading-tight">
          {set.name}
        </p>
        {set.numParts != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {set.numParts} pieces
          </p>
        )}
      </CardContent>
    </Card>
  );
}
