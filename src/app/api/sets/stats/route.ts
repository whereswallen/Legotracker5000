import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets, userMinifigs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const setStats = await db
    .select({
      totalSets: sql<number>`count(*)`,
      totalPieces: sql<number>`coalesce(sum(${userSets.numParts}), 0)`,
      ownedSets: sql<number>`sum(case when ${userSets.status} = 'owned' then 1 else 0 end)`,
      wishlistSets: sql<number>`sum(case when ${userSets.status} = 'wishlist' then 1 else 0 end)`,
      wantedSets: sql<number>`sum(case when ${userSets.status} = 'wanted' then 1 else 0 end)`,
      estimatedValue: sql<number>`coalesce(sum(case when ${userSets.purchasePrice} is not null and ${userSets.purchasePrice} != '' then cast(${userSets.purchasePrice} as real) else 0 end), 0)`,
      builtSets: sql<number>`sum(case when ${userSets.buildStatus} = 'built' then 1 else 0 end)`,
      sealedSets: sql<number>`sum(case when ${userSets.buildStatus} = 'sealed' then 1 else 0 end)`,
    })
    .from(userSets)
    .where(eq(userSets.userId, userId));

  const minifigStats = await db
    .select({
      totalMinifigs: sql<number>`coalesce(sum(${userMinifigs.quantity}), 0)`,
    })
    .from(userMinifigs)
    .where(eq(userMinifigs.userId, userId));

  const themeBreakdown = await db
    .select({
      theme: userSets.theme,
      count: sql<number>`count(*)`,
      pieces: sql<number>`coalesce(sum(${userSets.numParts}), 0)`,
    })
    .from(userSets)
    .where(eq(userSets.userId, userId))
    .groupBy(userSets.theme)
    .orderBy(sql`count(*) desc`);

  // Year breakdown for timeline chart
  const yearBreakdown = await db
    .select({
      year: userSets.year,
      count: sql<number>`count(*)`,
    })
    .from(userSets)
    .where(eq(userSets.userId, userId))
    .groupBy(userSets.year)
    .orderBy(userSets.year);

  return NextResponse.json({
    ...setStats[0],
    ...minifigStats[0],
    themeBreakdown,
    yearBreakdown: yearBreakdown.filter((y) => y.year != null),
  });
}
