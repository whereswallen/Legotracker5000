import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { missingParts, userSets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userSetId = url.searchParams.get("userSetId");

  if (userSetId) {
    // Get missing parts for a specific set (verify ownership)
    const set = await db
      .select()
      .from(userSets)
      .where(
        and(eq(userSets.id, userSetId), eq(userSets.userId, session.user.id))
      )
      .limit(1);

    if (set.length === 0) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const parts = await db
      .select()
      .from(missingParts)
      .where(eq(missingParts.userSetId, userSetId));

    return NextResponse.json(parts);
  }

  // Get all missing parts across all sets
  const parts = await db
    .select({
      part: missingParts,
      setName: userSets.name,
      setNum: userSets.setNum,
    })
    .from(missingParts)
    .innerJoin(userSets, eq(missingParts.userSetId, userSets.id))
    .where(eq(userSets.userId, session.user.id));

  return NextResponse.json(parts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userSetId, partNum, partName, colorName, colorId, quantity = 1, imgUrl } = body;

  // Verify set ownership
  const set = await db
    .select()
    .from(userSets)
    .where(
      and(eq(userSets.id, userSetId), eq(userSets.userId, session.user.id))
    )
    .limit(1);

  if (set.length === 0) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const id = crypto.randomUUID();
  await db.insert(missingParts).values({
    id,
    userSetId,
    partNum,
    partName,
    colorName,
    colorId,
    quantity,
    imgUrl,
    resolved: 0,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, resolved } = body;

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  // Verify ownership through join
  const part = await db
    .select()
    .from(missingParts)
    .innerJoin(userSets, eq(missingParts.userSetId, userSets.id))
    .where(
      and(eq(missingParts.id, id), eq(userSets.userId, session.user.id))
    )
    .limit(1);

  if (part.length === 0) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  await db
    .update(missingParts)
    .set({ resolved: resolved ? 1 : 0 })
    .where(eq(missingParts.id, id));

  return NextResponse.json({ success: true });
}
