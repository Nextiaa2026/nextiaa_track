import { NextRequest, NextResponse } from "next/server";
import { trackingSchema } from "@/lib/validations";
import { db } from "@/db";
import { shipmentLogs, shipments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trackingSchema.parse(body);

    // Find shipment by tracking number
    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.trackingNumber, validatedData.trackingNumber),
      with: {
        sender: true,
        receiver: true,
        trip: {
          with: {
            vessel: true
          }
        },
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

    // Log each successful client tracking lookup for audit + analytics.
    await db.insert(shipmentLogs).values({
      shipmentId: shipment.id,
      status: "tracking_viewed",
      location: shipment.logs.at(-1)?.location ?? "Client Portal",
      message: `Client viewed tracking for ${shipment.trackingNumber}`,
    });

    return NextResponse.json({
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      itemName: shipment.itemName,
      itemDescription: shipment.itemDescription,
      itemImage: shipment.itemImage,
      vesselName: shipment.trip?.vessel?.name,
      vesselImo: shipment.trip?.vessel?.imo,
      sender: {
        name: shipment.sender.name,
        email: shipment.sender.email,
        phone: shipment.sender.phone,
      },
      receiver: {
        name: shipment.receiver.name,
        email: shipment.receiver.email,
        phone: shipment.receiver.phone,
      },
      logs: shipment.logs.map((log) => ({
        id: log.id,
        status: log.status,
        location: log.location,
        message: log.message,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
