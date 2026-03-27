import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { setPhotos, userSets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const userSetId = url.searchParams.get("userSetId");

  if (!userSetId) {
    return NextResponse.json({ error: "userSetId required" }, { status: 400 });
  }

  // Verify ownership
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

  const photos = await db
    .select()
    .from(setPhotos)
    .where(eq(setPhotos.userSetId, userSetId));

  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const userSetId = formData.get("userSetId") as string | null;
  const caption = formData.get("caption") as string | null;

  if (!file || !userSetId) {
    return NextResponse.json(
      { error: "File and userSetId required" },
      { status: 400 }
    );
  }

  // Verify ownership
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

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
      { status: 400 }
    );
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File size must be under 10MB" },
      { status: 400 }
    );
  }

  // Create upload directory
  const userDir = join(UPLOAD_DIR, session.user.id);
  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }

  // Save file
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filePath = join(userDir, filename);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const relativePath = `/uploads/${session.user.id}/${filename}`;

  const id = crypto.randomUUID();
  await db.insert(setPhotos).values({
    id,
    userSetId,
    filePath: relativePath,
    caption,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ id, filePath: relativePath }, { status: 201 });
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

  // Verify ownership via join
  const photo = await db
    .select({ photo: setPhotos })
    .from(setPhotos)
    .innerJoin(userSets, eq(setPhotos.userSetId, userSets.id))
    .where(and(eq(setPhotos.id, id), eq(userSets.userId, session.user.id)))
    .limit(1);

  if (photo.length === 0) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Delete file from disk
  const fullPath = join(process.cwd(), "public", photo[0].photo.filePath);
  try {
    await unlink(fullPath);
  } catch {
    // File may already be deleted
  }

  await db.delete(setPhotos).where(eq(setPhotos.id, id));

  return NextResponse.json({ success: true });
}
