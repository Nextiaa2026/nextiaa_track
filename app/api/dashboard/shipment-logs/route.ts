import { NextRequest, NextResponse } from "next/server";
import { shipmentLogSchema } from "@/lib/validations";
import { db } from "@/db";
import { shipmentLogs, shipments } from "@/db/schema";
import { eq, count, gte, lte, and, inArray, sql, SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      parseInt(searchParams.get("pageSize") || "10"),
    );
    const search = searchParams.get("search")?.trim();
    const shipmentId = searchParams.get("shipmentId");
    const statusParam = searchParams.get("status");

    const offset = (page - 1) * pageSize;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const parseSafeDate = (raw: string | null): Date | null => {
      if (!raw || !raw.trim()) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";
    
    const conditions: SQL[] = isAdmin ? [] : [
      sql`EXISTS (
        SELECT 1
        FROM ${shipments} s
        WHERE s.id = ${shipmentLogs.shipmentId}
          AND s.user_id = ${userId}
      )`
    ];
    if (search) {
      conditions.push(
        sql`EXISTS (
          SELECT 1
          FROM ${shipments} s
          WHERE s.id = ${shipmentLogs.shipmentId}
            AND s.tracking_number ILIKE ${`%${search}%`}
        )`,
      );
    }
    if (shipmentId) conditions.push(eq(shipmentLogs.shipmentId, parseInt(shipmentId)));
    if (statusParam) {
      const statuses = statusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length > 0) {
        conditions.push(inArray(shipmentLogs.status, statuses));
      }
    }
    const startDate = parseSafeDate(startDateParam);
    const endDate = parseSafeDate(endDateParam);
    if (startDate) conditions.push(gte(shipmentLogs.timestamp, startDate));
    if (endDate) conditions.push(lte(shipmentLogs.timestamp, endDate));

    const whereClause = conditions.length > 0 ? (conditions.length > 1 ? and(...conditions) : conditions[0]) : undefined;

    const logs = await db.query.shipmentLogs.findMany({
      where: whereClause,
      with: {
        shipment: {
          columns: {
            trackingNumber: true,
            itemName: true,
          }
        }
      },
      orderBy: (shipmentLogs, { desc }) => [desc(shipmentLogs.timestamp)],
      limit: pageSize,
      offset: offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(shipmentLogs)
      .where(whereClause);
    const total = Number(countResult.value);

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: logs,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Get shipment logs error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = shipmentLogSchema.parse(body);

    const shipment = await db.query.shipments.findFirst({
      where: and(eq(shipments.id, validatedData.shipmentId), eq(shipments.userId, Number(session.user.id)))
    });

    if (!shipment) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create log entry
    const newLog = await db
      .insert(shipmentLogs)
      .values({
        shipmentId: validatedData.shipmentId,
        status: validatedData.status,
        location: validatedData.location,
        address: validatedData.address,
        message: validatedData.message,
      })
      .returning();

    // Update shipment status
    await db
      .update(shipments)
      .set({ status: validatedData.status })
      .where(eq(shipments.id, validatedData.shipmentId));

    return NextResponse.json({ log: newLog[0] }, { status: 201 });
  } catch (error) {
    console.error("Create shipment log error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
