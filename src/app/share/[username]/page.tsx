import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, userSets, userMinifigs } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Blocks, Lock, Package, Puzzle, Star, Users } from "lucide-react";
import { sql } from "drizzle-orm";

interface Props {
  params: { username: string };
}

export default async function SharePage({ params }: Props) {
  const { username } = params;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user.length === 0) {
    notFound();
  }

  const profile = user[0];

  if (!profile.isPublic) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">This collection is private</h1>
        <p className="text-muted-foreground">
          The user has chosen to keep their collection private.
        </p>
      </div>
    );
  }

  const sets = await db
    .select()
    .from(userSets)
    .where(eq(userSets.userId, profile.id));

  const minifigCount = await db
    .select({ total: sql<number>`coalesce(sum(${userMinifigs.quantity}), 0)` })
    .from(userMinifigs)
    .where(eq(userMinifigs.userId, profile.id));

  const totalPieces = sets.reduce((sum, s) => sum + (s.numParts ?? 0), 0);
  const ownedSets = sets.filter((s) => s.status === "owned");
  const builtSets = sets.filter((s) => s.buildStatus === "built");

  // Theme breakdown
  const themes = new Map<string, number>();
  sets.forEach((s) => {
    const t = s.theme || "Other";
    themes.set(t, (themes.get(t) ?? 0) + 1);
  });
  const topThemes = Array.from(themes.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <Blocks className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">
          {profile.displayName || profile.username}&apos;s Collection
        </h1>
        <p className="text-sm text-muted-foreground">
          Shared via LegoTracker5000
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Package className="mb-1 h-5 w-5 text-blue-500" />
            <p className="text-2xl font-bold">{ownedSets.length}</p>
            <p className="text-xs text-muted-foreground">Sets Owned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Puzzle className="mb-1 h-5 w-5 text-green-500" />
            <p className="text-2xl font-bold">
              {totalPieces.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Pieces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Users className="mb-1 h-5 w-5 text-purple-500" />
            <p className="text-2xl font-bold">
              {minifigCount[0]?.total ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Minifigs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center p-4">
            <Star className="mb-1 h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-bold">{builtSets.length}</p>
            <p className="text-xs text-muted-foreground">Built</p>
          </CardContent>
        </Card>
      </div>

      {/* Theme badges */}
      {topThemes.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {topThemes.map(([theme, count]) => (
            <Badge key={theme} variant="secondary">
              {theme} ({count})
            </Badge>
          ))}
        </div>
      )}

      {/* Collection grid */}
      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">This collection is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sets.map((set) => (
            <Card key={set.id} className="overflow-hidden">
              <div className="relative aspect-square w-full bg-muted">
                {set.setImgUrl ? (
                  <Image
                    src={set.setImgUrl}
                    alt={set.name}
                    fill
                    className="object-contain p-2"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute left-1.5 top-1.5">
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {set.status}
                  </Badge>
                </div>
                {set.buildStatus && set.buildStatus !== "unbuilt" && (
                  <div className="absolute right-1.5 top-1.5">
                    <Badge
                      variant="outline"
                      className="bg-background/80 px-1.5 py-0 text-[10px] capitalize"
                    >
                      {set.buildStatus}
                    </Badge>
                  </div>
                )}
                {set.rating && set.rating > 0 && (
                  <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-bold text-white">
                      {set.rating}
                    </span>
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{set.setNum}</p>
                <p className="line-clamp-2 text-sm font-semibold leading-tight">
                  {set.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {set.theme && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {set.theme}
                    </Badge>
                  )}
                  {set.year && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {set.year}
                    </Badge>
                  )}
                </div>
                {set.numParts != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {set.numParts} pieces
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by LegoTracker5000
        </p>
      </div>
    </div>
  );
}
