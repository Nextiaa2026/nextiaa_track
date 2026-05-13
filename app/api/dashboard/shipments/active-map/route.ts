import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shipments } from "@/db/schema";
import { inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeShipments = await db.query.shipments.findMany({
      where: (s, { and, eq, inArray }) => 
        and(
          eq(s.userId, Number(session.user.id)),
          inArray(s.status, ["pending", "in_transit"])
        ),
      with: {
        sender: true,
        receiver: true,
        trip: {
          with: {
            vessel: true,
          }
        },
      },
      orderBy: (s, { desc }) => [desc(s.updatedAt)],
    });

    const markers = activeShipments
      .map((shipment) => {
        const vessel = shipment.trip?.vessel;
        const lat =
          vessel?.lastKnownLat ??
          shipment.receiver.latitude ??
          shipment.sender.latitude;
        const lon =
          vessel?.lastKnownLon ??
          shipment.receiver.longitude ??
          shipment.sender.longitude;
        if (lat == null || lon == null) return null;
        return {
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          itemName: shipment.itemName,
          vesselName: vessel?.name ?? "N/A",
          latitude: lat,
          longitude: lon,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ data: markers });
  } catch (error) {
    console.error("Get active shipments map error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
