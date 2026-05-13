import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/services/email.service";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { shipments, shipmentLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  let shipmentIdForLog: number | undefined;

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;
    const payload = data as { shipmentId?: number; trackingNumber?: string };

    if (typeof payload?.shipmentId === "number") {
      shipmentIdForLog = payload.shipmentId;
    } else if (payload?.trackingNumber) {
      const shipment = await db.query.shipments.findFirst({
        where: eq(shipments.trackingNumber, payload.trackingNumber),
        columns: { id: true },
      });
      shipmentIdForLog = shipment?.id;
    }

    switch (type) {
      case "shipment_created":
        await emailService.sendShipmentCreatedEmail(data);
        break;
      case "shipment_packet":
        await emailService.sendShipmentPacketEmail(data);
        break;
      case "status_update":
        await emailService.sendShipmentStatusUpdateEmail(data);
        break;
      case "delivery_confirmed":
        await emailService.sendDeliveryConfirmationEmail(data);
        break;
      case "delivery_failed":
        await emailService.sendFailedDeliveryEmail(data);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown email type" },
          { status: 400 },
        );
    }

    if (shipmentIdForLog) {
      await db.insert(shipmentLogs).values({
        shipmentId: shipmentIdForLog,
        status: "email_sent",
        location: "Resend",
        message: `Resend email sent: ${type}`,
      });
    }

    return NextResponse.json(
      { success: true, message: "Email sent successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Email sending error:", error);

    if (shipmentIdForLog) {
      await db.insert(shipmentLogs).values({
        shipmentId: shipmentIdForLog,
        status: "email_failed",
        location: "Resend",
        message: "Resend email failed to send",
      });
    }

    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
