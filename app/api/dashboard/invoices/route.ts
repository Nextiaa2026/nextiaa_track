import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { customers, invoices, shipments } from "@/db/schema";
import { and, count, desc, eq, gte, ilike, lte, or, sql, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      parseInt(searchParams.get("pageSize") || "10"),
    );
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const offset = (page - 1) * pageSize;

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === "admin";
    const conditions: SQL[] = isAdmin ? [] : [eq(invoices.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, `%${search}%`),
          ilike(invoices.status, `%${search}%`),
          sql`EXISTS (SELECT 1 FROM ${shipments} s WHERE s.id = ${invoices.shipmentId} AND (s.tracking_number ILIKE ${`%${search}%`} OR s.item_name ILIKE ${`%${search}%`}))`,
          sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${invoices.senderId} AND c.name ILIKE ${`%${search}%`})`,
          sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${invoices.receiverId} AND c.name ILIKE ${`%${search}%`})`,
        ) as SQL,
      );
    }
    if (status) {
      conditions.push(eq(invoices.status, status));
    }
    if (startDate) conditions.push(gte(invoices.issuedAt, new Date(startDate)));
    if (endDate) conditions.push(lte(invoices.issuedAt, new Date(endDate)));

    const whereClause = and(...conditions);

    const data = await db.query.invoices.findMany({
      with: {
        shipment: true,
        sender: true,
        receiver: true,
      },
      where: whereClause,
      orderBy: [desc(invoices.issuedAt)],
      limit: pageSize,
      offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(invoices)
      .where(whereClause);
    const total = Number(countResult.value);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
