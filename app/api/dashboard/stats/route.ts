import { NextResponse } from "next/server";
import { and, count, eq, SQL } from "drizzle-orm";
import { db } from "@/db";
import { shipments, shipmentLogs } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const isAdmin = session.user.role === "admin";

    const baseWhere = (condition: SQL) => isAdmin ? condition : and(condition, eq(shipments.userId, userId));
    const allWhere = isAdmin ? undefined : eq(shipments.userId, userId);

    const [
      totalShipmentsResult,
      deliveredShipmentsResult,
      inTransitShipmentsResult,
      failedShipmentsResult,
      totalLogsResult,
      clientTrackingViewsResult,
      resendEmailsSentResult,
      resendEmailFailuresResult,
    ] = await Promise.all([
      db.select({ value: count() }).from(shipments).where(allWhere),
      db
        .select({ value: count() })
        .from(shipments)
        .where(baseWhere(eq(shipments.status, "delivered"))),
      db
        .select({ value: count() })
        .from(shipments)
        .where(baseWhere(eq(shipments.status, "in_transit"))),
      db
        .select({ value: count() })
        .from(shipments)
        .where(baseWhere(eq(shipments.status, "failed"))),
      
      // Logs join
      db.select({ value: count() })
        .from(shipmentLogs)
        .innerJoin(shipments, eq(shipmentLogs.shipmentId, shipments.id))
        .where(allWhere),
      
      db.select({ value: count() })
        .from(shipmentLogs)
        .innerJoin(shipments, eq(shipmentLogs.shipmentId, shipments.id))
        .where(baseWhere(eq(shipmentLogs.status, "tracking_viewed"))),
      
      db.select({ value: count() })
        .from(shipmentLogs)
        .innerJoin(shipments, eq(shipmentLogs.shipmentId, shipments.id))
        .where(baseWhere(eq(shipmentLogs.status, "email_sent"))),
      
      db.select({ value: count() })
        .from(shipmentLogs)
        .innerJoin(shipments, eq(shipmentLogs.shipmentId, shipments.id))
        .where(baseWhere(eq(shipmentLogs.status, "email_failed"))),
    ]);

    const totalShipments = Number(totalShipmentsResult[0]?.value ?? 0);
    const deliveredShipments = Number(deliveredShipmentsResult[0]?.value ?? 0);
    const inTransitShipments = Number(inTransitShipmentsResult[0]?.value ?? 0);
    const failedShipments = Number(failedShipmentsResult[0]?.value ?? 0);
    const totalLogs = Number(totalLogsResult[0]?.value ?? 0);
    const clientTrackingViews = Number(clientTrackingViewsResult[0]?.value ?? 0);
    const resendEmailsSent = Number(resendEmailsSentResult[0]?.value ?? 0);
    const resendEmailFailures = Number(resendEmailFailuresResult[0]?.value ?? 0);
    const deliverySuccessRate =
      totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

    return NextResponse.json({
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      failedShipments,
      totalLogs,
      clientTrackingViews,
      resendEmailsSent,
      resendEmailFailures,
      deliverySuccessRate: Number(deliverySuccessRate.toFixed(1)),
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
