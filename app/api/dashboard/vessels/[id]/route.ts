import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vessels, trips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const vesselPatchSchema = z.object({
  name: z.string().min(2).optional(),
  imo: z.string().min(3).optional(),
  type: z.string().min(2).optional(),
  lastKnownLat: z.number().min(-90).max(90).nullable().optional(),
  lastKnownLon: z.number().min(-180).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
});

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
    const vesselId = parseInt(id);
    if (Number.isNaN(vesselId)) {
      return NextResponse.json({ error: "Invalid vessel id" }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = vesselPatchSchema.parse(body);

    const previousVessel = await db.query.vessels.findFirst({
      where: eq(vessels.id, vesselId),
    });
    if (!previousVessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    const updated = await db
      .update(vessels)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(vessels.id, vesselId))
      .returning();

    if (!updated[0]) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ vessel: updated[0] });
  } catch (error) {
    console.error("Update vessel error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid update payload" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Failed to update vessel" }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const vesselId = parseInt(id);
    if (Number.isNaN(vesselId)) {
      return NextResponse.json({ error: "Invalid vessel id" }, { status: 400 });
    }

    // Set vesselId to null in trips that use this vessel
    await db
      .update(trips)
      .set({ vesselId: null, updatedAt: new Date() })
      .where(eq(trips.vesselId, vesselId));

    const deleted = await db
      .delete(vessels)
      .where(eq(vessels.id, vesselId))
      .returning();

    if (!deleted[0]) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vessel error:", error);
    return NextResponse.json({ error: "Failed to delete vessel" }, { status: 400 });
  }
}
