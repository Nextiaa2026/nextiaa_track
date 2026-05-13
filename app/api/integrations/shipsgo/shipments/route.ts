import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Create Shipment in ShipsGo
 *
 * Optionally push shipment data to ShipsGo when creating a shipment
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
      {
        success: true,
        message: "Shipment created (ShipsGo integration pending)",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("ShipsGo shipment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create shipment in ShipsGo" },
      { status: 500 },
    );
  }
}
