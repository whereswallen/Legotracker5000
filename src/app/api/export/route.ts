import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";

  const sets = await db
    .select()
    .from(userSets)
    .where(eq(userSets.userId, session.user.id));

  if (format === "bricklink") {
    // BrickLink XML format
    const xmlItems = sets
      .map(
        (s) =>
          `  <ITEM>
    <ITEMTYPE>S</ITEMTYPE>
    <ITEMID>${escapeXml(s.setNum.replace(/-1$/, ""))}</ITEMID>
    <QTY>${s.quantity || 1}</QTY>
    <CONDITION>${s.condition === "new" ? "N" : "U"}</CONDITION>
    <REMARKS>${escapeXml(s.notes || "")}</REMARKS>
  </ITEM>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<INVENTORY>\n${xmlItems}\n</INVENTORY>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition":
          'attachment; filename="legotracker-bricklink.xml"',
      },
    });
  }

  // CSV format
  const headers = [
    "Set Number",
    "Name",
    "Theme",
    "Year",
    "Pieces",
    "Status",
    "Build Status",
    "Condition",
    "Quantity",
    "Purchase Price",
    "Rating",
    "Notes",
  ];

  const rows = sets.map((s) =>
    [
      s.setNum,
      csvEscape(s.name),
      csvEscape(s.theme || ""),
      s.year || "",
      s.numParts || "",
      s.status,
      s.buildStatus,
      s.condition || "",
      s.quantity || 1,
      s.purchasePrice || "",
      s.rating || "",
      csvEscape(s.notes || ""),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="legotracker-export.csv"',
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
