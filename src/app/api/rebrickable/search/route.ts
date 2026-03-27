import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRebrickableClient } from "@/lib/rebrickable";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("q");
  const page = parseInt(url.searchParams.get("page") || "1");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // Get user's API key
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

  const client = getRebrickableClient(apiKey);
  const results = await client.searchSets(query, page);

  return NextResponse.json(results);
}
