import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db
    .select({
      displayName: users.displayName,
      username: users.username,
      email: users.email,
      isPublic: users.isPublic,
      rebrickableApiKey: users.rebrickableApiKey,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    displayName: user[0].displayName,
    username: user[0].username,
    email: user[0].email,
    isPublic: user[0].isPublic,
    hasApiKey: !!user[0].rebrickableApiKey,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    updates.displayName = body.displayName || null;
  }
  if (body.rebrickableApiKey !== undefined) {
    updates.rebrickableApiKey = body.rebrickableApiKey || null;
  }
  if (body.isPublic !== undefined) {
    updates.isPublic = body.isPublic ? 1 : 0;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
