import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trips, shipments, shipmentLogs } from "@/db/schema";
import { z } from "zod";
import { emailService } from "@/services/email.service";

const tripUpdateSchema = z.object({
  status: z.enum(["pending", "in_transit", "arrived", "completed"]),
  notifyRecipients: z.boolean().default(false),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tripId = parseInt(id);
    const body = await request.json();
    const { status, notifyRecipients } = tripUpdateSchema.parse(body);
    
    const userId = parseInt(session.user.id);

    // 1. Update the trip status
    const [updatedTrip] = await db
      .update(trips)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
      .returning();

    if (!updatedTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // 2. Propagate status change to all shipments linked to this trip
    let shipmentStatus: string = status;
    if (status === "arrived") shipmentStatus = "delivered";
    if (status === "completed") shipmentStatus = "delivered";
    
    // Fetch shipments with customer info for notifications
    const shipmentsToUpdate = await db.query.shipments.findMany({
      where: eq(shipments.tripId, tripId),
      with: {
        sender: true,
        receiver: true,
      }
    });

    if (shipmentsToUpdate.length > 0) {
      // Update shipment statuses
      await db
        .update(shipments)
        .set({ 
          status: shipmentStatus,
          updatedAt: new Date(),
        })
        .where(eq(shipments.tripId, tripId));

      // 3. Create logs for each shipment
      const logEntries = shipmentsToUpdate.map(s => ({
        shipmentId: s.id,
        status: shipmentStatus,
        location: updatedTrip.destination,
        message: `Statut mis à jour via le voyage ${updatedTrip.tripNumber} : ${status}`,
      }));

      await db.insert(shipmentLogs).values(logEntries);
      
      // 4. Send notifications if requested
      if (notifyRecipients) {
        for (const shipment of shipmentsToUpdate) {
          const recipients = [
            { name: shipment.sender.name, email: shipment.sender.email },
            { name: shipment.receiver.name, email: shipment.receiver.email },
          ];

          await Promise.all(
            recipients.map(recipient => 
              emailService.sendShipmentStatusUpdateEmail({
                recipient,
                trackingNumber: shipment.trackingNumber,
                status: shipmentStatus,
                location: updatedTrip.destination,
                message: `Le voyage ${updatedTrip.tripNumber} transportant votre colis est maintenant : ${status}.`
              })
            )
          ).catch(err => console.error(`Failed to notify for shipment ${shipment.id}:`, err));
        }
      }
    }

    return NextResponse.json({ 
      trip: updatedTrip, 
      shipmentsUpdated: shipmentsToUpdate.length 
    });
  } catch (error) {
    console.error("Update trip status error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}
