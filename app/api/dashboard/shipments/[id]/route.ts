import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const shipmentId = parseInt(id);

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
      with: {
        sender: true,
        receiver: true,
        trip: { with: { vessel: true } },
        logs: {
          orderBy: (logs) => logs.timestamp,
        },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error("Get shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const shipmentId = parseInt(id);
    const body = await request.json();

    const { shipmentPatchSchema } = await import("@/lib/validations");
    const validatedData = shipmentPatchSchema.parse(body);

    const patchEntries = Object.entries(validatedData).filter(
      ([, value]) => value !== undefined,
    );

    const updatedShipment = await db
      .update(shipments)
      .set({
        ...(Object.fromEntries(patchEntries) as Record<string, unknown>),
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    if (updatedShipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, shipmentId),
      with: {
        sender: true,
        receiver: true,
        trip: { with: { vessel: true } },
        logs: {
          orderBy: (logs) => logs.timestamp,
        },
      },
    });

    return NextResponse.json({ shipment });
  } catch (error) {
    console.error("Update shipment error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const shipmentId = parseInt(id);

    const deletedShipment = await db
      .delete(shipments)
      .where(eq(shipments.id, shipmentId))
      .returning();

    if (deletedShipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: "Shipment deleted successfully" });
  } catch (error) {
    console.error("Delete shipment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

