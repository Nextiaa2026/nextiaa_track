import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { count, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "10"));
    const offset = (page - 1) * pageSize;

    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: pageSize,
      offset,
      with: {
        subscriptions: {
          with: {
            plan: true
          }
        }
      }
    });

    const [countResult] = await db.select({ value: count() }).from(users);
    const total = Number(countResult.value);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data: allUsers,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
