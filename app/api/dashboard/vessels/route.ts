import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vessels } from "@/db/schema";
import { z } from "zod";

const vesselInputSchema = z.object({
  name: z.string().min(2),
  imo: z.string().min(3),
  type: z.string().min(2),
  lastKnownLat: z.number().min(-90).max(90).optional(),
  lastKnownLon: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional(),
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
    const activeOnly = searchParams.get("activeOnly") === "true";
    const offset = (page - 1) * pageSize;

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === "admin";
    const conditions: SQL[] = isAdmin ? [] : [eq(vessels.userId, userId)];

    if (search) {
      conditions.push(
        or(
          ilike(vessels.name, `%${search}%`),
          ilike(vessels.imo, `%${search}%`),
          ilike(vessels.type, `%${search}%`),
        ) as SQL,
      );
    }
    if (activeOnly) {
      conditions.push(eq(vessels.isActive, true));
    }
    const whereClause = and(...conditions);

    const data = await db.query.vessels.findMany({
      where: whereClause,
      orderBy: [desc(vessels.updatedAt)],
      limit: pageSize,
      offset,
    });
    const [countResult] = await db
      .select({ value: count() })
      .from(vessels)
      .where(whereClause);
    const total = Number(countResult.value);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Get vessels error:", error);
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
    const validatedData = vesselInputSchema.parse(body);
    
    // Auto-link to creator if customer
    const userId = parseInt(session.user.id);
    
    const [vessel] = await db.insert(vessels).values({
      ...validatedData,
      userId,
    }).returning();

    return NextResponse.json({ vessel }, { status: 201 });
  } catch (error) {
    console.error("Create vessel error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid vessel payload" },
        { status: 400 },
      );
    }

    const dbError = error as { code?: string } | undefined;
    if (dbError?.code === "23505") {
      return NextResponse.json(
        { error: "A vessel with this IMO already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Failed to create vessel" }, { status: 400 });
  }
}
