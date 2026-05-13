import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { customers, shipmentLogs, shipments, users, vessels } from "@/db/schema";
import { ne } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.transaction(async (tx) => {
      await tx.delete(shipmentLogs);
      await tx.delete(shipments);
      await tx.delete(customers);
      await tx.delete(vessels);
      await tx.delete(users).where(ne(users.role, "admin"));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("System cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
