import { eq } from "drizzle-orm";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { users, userSets } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Blocks, Lock, Package } from "lucide-react";

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

  const totalPieces = sets.reduce((sum, s) => sum + (s.numParts ?? 0), 0);
  const ownedSets = sets.filter((s) => s.status === "owned");

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
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{sets.length}</p>
            <p className="text-xs text-muted-foreground">Total Sets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{ownedSets.length}</p>
            <p className="text-xs text-muted-foreground">Owned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {totalPieces.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Pieces</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection grid */}
      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            This collection is empty.
          </p>
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
                    className="text-[10px] px-1.5 py-0"
                  >
                    {set.status}
                  </Badge>
                </div>
                {set.buildStatus && set.buildStatus !== "unbuilt" && (
                  <div className="absolute right-1.5 top-1.5">
                    <Badge
                      variant="outline"
                      className="bg-background/80 text-[10px] px-1.5 py-0 capitalize"
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
                <div className="mt-1 flex flex-wrap gap-1">
                  {set.theme && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {set.theme}
                    </Badge>
                  )}
                  {set.year && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
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
