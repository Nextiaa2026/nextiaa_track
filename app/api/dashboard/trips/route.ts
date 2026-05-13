import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips } from "@/db/schema";
import { z } from "zod";
import { applyCredit } from "@/services/credit.service";

const tripInputSchema = z.object({
  tripNumber: z.string().min(3),
  vesselId: z.number().int(),
  origin: z.string().min(2),
  destination: z.string().min(2),
  departureDate: z.string().datetime().optional(),
  arrivalDate: z.string().datetime().optional(),
  status: z.enum(["pending", "in_transit", "arrived", "completed"]).optional(),
});

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
      parseInt(searchParams.get("pageSize") || "20"),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const offset = (page - 1) * pageSize;

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === "admin";
    const conditions: SQL[] = isAdmin ? [] : [eq(trips.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(trips.tripNumber, `%${search}%`),
          ilike(trips.origin, `%${search}%`),
          ilike(trips.destination, `%${search}%`),
        ) as SQL,
      );
    }

    const whereClause = and(...conditions);

    const data = await db.query.trips.findMany({
      with: {
        vessel: true,
        user: true,
      },
      where: whereClause as SQL,
      orderBy: [desc(trips.createdAt)],
      limit: pageSize,
      offset,
    });
    
    const [countResult] = await db
      .select({ value: count() })
      .from(trips)
      .where(whereClause as SQL);
    const total = Number(countResult.value);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get trips error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tripInputSchema.parse(body);
    
    const userId = parseInt(session.user.id);
    
    const [trip] = await db.insert(trips).values({
      tripNumber: validatedData.tripNumber,
      vesselId: validatedData.vesselId,
      origin: validatedData.origin,
      destination: validatedData.destination,
      departureDate: validatedData.departureDate ? new Date(validatedData.departureDate) : null,
      arrivalDate: validatedData.arrivalDate ? new Date(validatedData.arrivalDate) : null,
      status: validatedData.status ?? "pending",
      userId,
    }).returning();

    if (userId) {
      await applyCredit({
        userId,
        reason: "trip_scheduled",
        referenceType: "trip",
        referenceId: trip.id,
      });
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error("Create trip error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid trip payload" },
        { status: 400 },
      );
    }

    const dbError = error as { code?: string } | undefined;
    if (dbError?.code === "23505") {
      return NextResponse.json(
        { error: "A trip with this number already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Failed to create trip" }, { status: 400 });
  }
}
