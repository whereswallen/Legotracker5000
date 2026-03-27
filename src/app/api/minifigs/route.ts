import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userMinifigs } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  const conditions = [eq(userMinifigs.userId, session.user.id)];
  if (search) {
    conditions.push(like(userMinifigs.name, `%${search}%`));
  }

  const figs = await db
    .select()
    .from(userMinifigs)
    .where(and(...conditions));

  return NextResponse.json(figs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { figNum, name, numParts, imgUrl, quantity = 1, sourceSetNum, notes } = body;

  if (!figNum || !name) {
    return NextResponse.json(
      { error: "Figure number and name are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  await db.insert(userMinifigs).values({
    id,
    userId: session.user.id,
    figNum,
    name,
    numParts,
    imgUrl,
    quantity,
    sourceSetNum,
    notes,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id, figNum, name }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await db
    .delete(userMinifigs)
    .where(
      and(eq(userMinifigs.id, id), eq(userMinifigs.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}
