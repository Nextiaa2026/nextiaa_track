import { NextRequest, NextResponse } from "next/server";
import { customerSchema } from "@/lib/validations";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { count, desc, gte, lte, and, or, ilike, eq, SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      parseInt(searchParams.get("pageSize") || "10"),
    );

    const offset = (page - 1) * pageSize;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const search = searchParams.get("search")?.trim();

    const parseSafeDate = (raw: string | null): Date | null => {
      if (!raw || !raw.trim()) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const isAdmin = session.user.role === "admin";
    const conditions: SQL[] = isAdmin ? [] : [eq(customers.userId, userId)];
    const startDate = parseSafeDate(startDateParam);
    const endDate = parseSafeDate(endDateParam);
    if (startDate) conditions.push(gte(customers.createdAt, startDate));
    if (endDate) conditions.push(lte(customers.createdAt, endDate));
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(customers.name, pattern),
          ilike(customers.email, pattern),
          ilike(customers.phone, pattern),
          ilike(customers.city, pattern),
          ilike(customers.country, pattern),
          ilike(customers.address, pattern),
        ) as SQL,
      );
    }

    const whereClause = and(...conditions);

    const allCustomers = await db.query.customers.findMany({
      where: whereClause,
      orderBy: [desc(customers.createdAt)],
      limit: pageSize,
      offset,
    });

    const [countResult] = await db.select({ value: count() }).from(customers).where(whereClause);
    const total = Number(countResult.value);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: allCustomers,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    const newCustomer = await db
      .insert(customers)
      .values({
        ...validatedData,
        userId,
      })
      .returning();

    return NextResponse.json({ customer: newCustomer[0] }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
