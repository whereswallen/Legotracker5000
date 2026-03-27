import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets } from "@/lib/db/schema";
import { eq, and, like, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";

  let query = db
    .select()
    .from(userSets)
    .where(eq(userSets.userId, session.user.id));

  const conditions = [eq(userSets.userId, session.user.id)];

  if (status && status !== "all") {
    conditions.push(eq(userSets.status, status));
  }

  if (search) {
    conditions.push(like(userSets.name, `%${search}%`));
  }

  const sortColumn =
    sort === "name"
      ? userSets.name
      : sort === "year"
        ? userSets.year
        : sort === "numParts"
          ? userSets.numParts
          : userSets.createdAt;

  const orderFn = order === "asc" ? asc : desc;

  const sets = await db
    .select()
    .from(userSets)
    .where(and(...conditions))
    .orderBy(orderFn(sortColumn));

  return NextResponse.json(sets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    setNum,
    name,
    theme,
    year,
    numParts,
    setImgUrl,
    status = "owned",
    buildStatus = "unbuilt",
    condition,
    quantity = 1,
    purchasePrice,
    notes,
  } = body;

  if (!setNum || !name) {
    return NextResponse.json(
      { error: "Set number and name are required" },
      { status: 400 }
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(userSets).values({
    id,
    userId: session.user.id,
    setNum,
    name,
    theme,
    year,
    numParts,
    setImgUrl,
    status,
    buildStatus,
    condition,
    quantity,
    purchasePrice,
    notes,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id, setNum, name }, { status: 201 });
}
