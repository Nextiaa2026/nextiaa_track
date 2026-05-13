import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Get ShipsGo Tracking Status
 *
 * Fetches current tracking status from ShipsGo API
 * Currently a placeholder - implement when ShipsGo API credentials are available
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await params;

    // TODO: Implement ShipsGo API call

    return NextResponse.json(
      { message: "ShipsGo integration not yet configured" },
      { status: 200 },
    );
  } catch (error) {
    console.error("ShipsGo tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tracking status" },
      { status: 500 },
    );
  }
}
