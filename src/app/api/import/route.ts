import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have a header row and at least one data row" },
      { status: 400 }
    );
  }

  // Parse header to find column indices
  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const colIndex = {
    setNum: findCol(header, ["set number", "set_num", "setnum", "set no", "item no", "itemid"]),
    name: findCol(header, ["name", "set name"]),
    theme: findCol(header, ["theme", "category"]),
    year: findCol(header, ["year"]),
    numParts: findCol(header, ["pieces", "num_parts", "numparts", "parts", "piece count"]),
    status: findCol(header, ["status"]),
    buildStatus: findCol(header, ["build status", "buildstatus", "build_status"]),
    condition: findCol(header, ["condition"]),
    quantity: findCol(header, ["quantity", "qty"]),
    purchasePrice: findCol(header, ["purchase price", "price", "purchaseprice"]),
    notes: findCol(header, ["notes", "remarks", "comments"]),
  };

  if (colIndex.setNum === -1) {
    return NextResponse.json(
      { error: "CSV must have a 'Set Number' column" },
      { status: 400 }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const setNum = cols[colIndex.setNum]?.trim();

    if (!setNum) {
      skipped++;
      continue;
    }

    const name =
      colIndex.name >= 0 ? cols[colIndex.name]?.trim() : setNum;

    try {
      await db.insert(userSets).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        setNum,
        name: name || setNum,
        theme: colIndex.theme >= 0 ? cols[colIndex.theme]?.trim() || null : null,
        year:
          colIndex.year >= 0 ? parseInt(cols[colIndex.year]) || null : null,
        numParts:
          colIndex.numParts >= 0
            ? parseInt(cols[colIndex.numParts]) || null
            : null,
        status:
          colIndex.status >= 0
            ? cols[colIndex.status]?.trim().toLowerCase() || "owned"
            : "owned",
        buildStatus:
          colIndex.buildStatus >= 0
            ? cols[colIndex.buildStatus]?.trim().toLowerCase() || "unbuilt"
            : "unbuilt",
        condition:
          colIndex.condition >= 0
            ? cols[colIndex.condition]?.trim() || null
            : null,
        quantity:
          colIndex.quantity >= 0
            ? parseInt(cols[colIndex.quantity]) || 1
            : 1,
        purchasePrice:
          colIndex.purchasePrice >= 0
            ? cols[colIndex.purchasePrice]?.trim() || null
            : null,
        notes:
          colIndex.notes >= 0 ? cols[colIndex.notes]?.trim() || null : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ imported, skipped });
}

function findCol(headers: string[], names: string[]): number {
  for (const name of names) {
    const idx = headers.indexOf(name);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
