import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets } from "@/lib/db/schema";
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

  return NextResponse.json(set[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
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

  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
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

  await db
    .delete(userSets)
    .where(
      and(eq(userSets.id, params.id), eq(userSets.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}
