import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets, missingParts, setPhotos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const set = await db
    .select()
    .from(userSets)
    .where(
      and(eq(userSets.id, params.id), eq(userSets.userId, session.user.id))
    )
    .limit(1);

  if (set.length === 0) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  // Fetch missing parts and photos for this set
  const [parts, photos] = await Promise.all([
    db
      .select()
      .from(missingParts)
      .where(eq(missingParts.userSetId, params.id)),
    db
      .select()
      .from(setPhotos)
      .where(eq(setPhotos.userSetId, params.id)),
  ]);

  return NextResponse.json({
    ...set[0],
    missingParts: parts,
    photos,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const set = await db
    .select()
    .from(userSets)
    .where(
      and(eq(userSets.id, params.id), eq(userSets.userId, session.user.id))
    )
    .limit(1);

  if (set.length === 0) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const body = await req.json();

  // Handle adding a missing part
  if (body.addMissingPart) {
    const { partNum, partName, colorName, colorId, quantity = 1, imgUrl } =
      body.addMissingPart;

    const id = crypto.randomUUID();
    await db.insert(missingParts).values({
      id,
      userSetId: params.id,
      partNum,
      partName: partName || null,
      colorName: colorName || null,
      colorId: colorId || null,
      quantity,
      imgUrl: imgUrl || null,
      resolved: 0,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, partId: id });
  }

  // Handle resolving a missing part
  if (body.resolveMissingPart) {
    await db
      .update(missingParts)
      .set({ resolved: 1 })
      .where(
        and(
          eq(missingParts.id, body.resolveMissingPart),
          eq(missingParts.userSetId, params.id)
        )
      );

    return NextResponse.json({ success: true });
  }

  // Handle standard field updates
  const allowedFields = [
    "name",
    "theme",
    "year",
    "numParts",
    "setImgUrl",
    "status",
    "buildStatus",
    "condition",
    "quantity",
    "purchasePrice",
    "notes",
    "rating",
  ];

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  await db
    .update(userSets)
    .set(updates)
    .where(
      and(eq(userSets.id, params.id), eq(userSets.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete related records first
  await db.delete(missingParts).where(eq(missingParts.userSetId, params.id));
  await db.delete(setPhotos).where(eq(setPhotos.userSetId, params.id));

  await db
    .delete(userSets)
    .where(
      and(eq(userSets.id, params.id), eq(userSets.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}
