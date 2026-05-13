import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Manual Sync Endpoint
 *
 * Allows admins to manually sync tracking data from ShipsGo
 * Currently a placeholder - implement when ShipsGo API credentials are available
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await request.json();

    // TODO: Implement ShipsGo API call

    return NextResponse.json(
      { success: true, message: "Sync completed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("ShipsGo sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
