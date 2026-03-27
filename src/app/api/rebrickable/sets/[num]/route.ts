import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRebrickableClient } from "@/lib/rebrickable";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { num: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db
    .select({ rebrickableApiKey: users.rebrickableApiKey })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const apiKey =
    user[0]?.rebrickableApiKey || process.env.REBRICKABLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "No Rebrickable API key configured" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const include = url.searchParams.get("include"); // "parts" or "minifigs"

  const client = getRebrickableClient(apiKey);

  const set = await client.getSet(params.num);

  let parts, minifigs;
  if (include === "parts") {
    parts = await client.getSetParts(params.num);
  } else if (include === "minifigs") {
    minifigs = await client.getSetMinifigs(params.num);
  }

  return NextResponse.json({ set, parts, minifigs });
}
