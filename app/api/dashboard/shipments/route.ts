import { NextRequest, NextResponse } from "next/server";
import { shipmentSchema } from "@/lib/validations";
import { db } from "@/db";
import {
  shipments,
  shipmentLogs,
  customers,
  invoices,
  trips,
  vessels,
  users,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { count, or, ilike, sql, and, gte, lte, eq, SQL } from "drizzle-orm";
import { emailService } from "@/services/email.service";
import { buildReceiptHtml } from "@/lib/print-shipment-documents";
import { buildInvoiceHtml } from "@/lib/invoice";
import { getStatusDisplay } from "@/lib/utils/shipment";
import { applyCredit } from "@/services/credit.service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      parseInt(searchParams.get("pageSize") || "10"),
    );
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const offset = (page - 1) * pageSize;

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === "admin";
    const conditions: SQL[] = isAdmin ? [] : [eq(shipments.userId, userId)];

    if (search) {
      conditions.push(or(
        ilike(shipments.trackingNumber, `%${search}%`),
        ilike(shipments.itemName, `%${search}%`),
        sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${shipments.senderId} AND c.name ILIKE ${`%${search}%`})`,
        sql`EXISTS (SELECT 1 FROM ${customers} c WHERE c.id = ${shipments.receiverId} AND c.name ILIKE ${`%${search}%`})`
      ) as SQL);
    }
    
    if (startDate) conditions.push(gte(shipments.createdAt, new Date(startDate)));
    if (endDate) conditions.push(lte(shipments.createdAt, new Date(endDate)));

    const whereClause = and(...conditions);

    // Use explicit joins to avoid Drizzle query builder relation resolution issues
    const rows = await db
      .select({
        shipment: shipments,
        sender: customers,
        receiver: customers,
        trip: trips,
        vessel: vessels,
        user: {
          id: users.id,
          name: users.name,
          email: users.email
        },
      })
      .from(shipments)
      .leftJoin(customers, eq(shipments.senderId, customers.id))
      .leftJoin(sql`${customers} as receiver`, eq(shipments.receiverId, sql`receiver.id`))
      .leftJoin(trips, eq(shipments.tripId, trips.id))
      .leftJoin(vessels, eq(trips.vesselId, vessels.id))
      .leftJoin(users, eq(shipments.userId, users.id))
      .where(whereClause)
      .orderBy(sql`${shipments.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    // Reformat rows to match the expected structure
    const data = rows.map(row => ({
      ...row.shipment,
      sender: row.sender,
      receiver: row.receiver,
      user: row.user,
      trip: row.trip ? {
        ...row.trip,
        vessel: row.vessel
      } : null
    }));

    const [countResult] = await db.select({ value: count() }).from(shipments).where(whereClause);
    const total = Number(countResult.value);
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = shipmentSchema.parse(body);
    const notifyPartiesByEmail = body?.notifyPartiesByEmail === true;

    let senderId = validatedData.senderId;
    let receiverId = validatedData.receiverId;

    // Upsert Sender
    if (validatedData.sender) {
      const result = await db
        .insert(customers)
        .values(validatedData.sender)
        .onConflictDoUpdate({
          target: customers.email,
          set: validatedData.sender,
        })
        .returning();
      senderId = result[0].id;
    }

    // Upsert Receiver
    if (validatedData.receiver) {
      const result = await db
        .insert(customers)
        .values(validatedData.receiver)
        .onConflictDoUpdate({
          target: customers.email,
          set: validatedData.receiver,
        })
        .returning();
      receiverId = result[0].id;
    }

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: "Sender and receiver are required" },
        { status: 400 },
      );
    }

    const currentUserId = parseInt(session.user.id);

    const newShipmentResult = await db
      .insert(shipments)
      .values({
        trackingNumber: validatedData.trackingNumber,
        senderId,
        receiverId,
        userId: currentUserId,
        shipmentType: validatedData.shipmentType,
        itemName: validatedData.itemName,
        itemDescription: validatedData.itemDescription,
        itemWeight: validatedData.itemWeight,
        itemDimensions: validatedData.itemDimensions,
        tripId: validatedData.vesselId, // Mapping vesselId from form to tripId in schema
        itemImage: validatedData.itemImage,
        shippingCost: validatedData.shippingCost,
        estimatedDelivery: validatedData.estimatedDelivery,
        status: "pending",
      })
      .returning();

    const newShipment = newShipmentResult[0];
    const shipmentId = newShipment.id;

    // Deduct credits for shipment creation
    if (currentUserId) {
      await applyCredit({
        userId: currentUserId,
        reason: "shipment_created",
        referenceType: "shipment",
        referenceId: shipmentId,
      });
    }

    // Create initial log entry when shipment is created
    await db.insert(shipmentLogs).values({
      shipmentId,
      status: "pending",
      location: "En attente",
      message: "Expédition créée et en attente d'enlèvement",
    });

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 14);
    await db.insert(invoices).values({
      invoiceNumber: `INV-${shipmentId}-${Date.now()}`,
      shipmentId,
      senderId,
      receiverId,
      userId: currentUserId,
      subtotal: newShipment.shippingCost,
      taxAmount: 0,
      totalAmount: newShipment.shippingCost,
      status: "issued",
      issuedAt: issueDate,
      dueDate,
      notes: "Facture générée automatiquement lors de la création de l'expédition.",
    });

    if (notifyPartiesByEmail) {
      try {
        const [sender, receiver] = await Promise.all([
          db.query.customers.findFirst({
            where: eq(customers.id, senderId),
          }),
          db.query.customers.findFirst({
            where: eq(customers.id, receiverId),
          }),
        ]);

        if (sender && receiver) {
          const receipt = {
            receiptNumber: `RCPT-${shipmentId}`,
            issuedAt: new Date().toISOString(),
              shipment: {
                id: shipmentId,
                trackingNumber: newShipment.trackingNumber,
                itemName: newShipment.itemName,
                itemWeight: newShipment.itemWeight || "N/A",
                status: newShipment.status,
                createdAt: newShipment.createdAt.toISOString(),
                shippingCost: newShipment.shippingCost,
              },
            sender,
            receiver,
          };

          const receiptHtml = buildReceiptHtml(receipt);
          const invoiceHtml = buildInvoiceHtml(receipt);
          const statusSummary = `L'expédition ${newShipment.trackingNumber} est actuellement ${getStatusDisplay(newShipment.status)}.`;
          const recipients = [
            { name: sender.name, email: sender.email },
            { name: receiver.name, email: receiver.email },
          ];

          await Promise.all(
            recipients.map((recipient) =>
              emailService.sendShipmentPacketEmail({
                recipient,
                trackingNumber: newShipment.trackingNumber,
                itemName: newShipment.itemName,
                senderName: sender.name,
                receiverName: receiver.name,
                estimatedDelivery: newShipment.estimatedDelivery
                  ? newShipment.estimatedDelivery.toISOString()
                  : undefined,
                status: newShipment.status,
                statusSummary,
                receiptHtml,
                invoiceHtml,
              }),
            ),
          );

          if (currentUserId) {
            // Deduct credits for emails sent (1 credit per recipient)
            await applyCredit({
              userId: currentUserId,
              reason: "email_sent",
              customAmount: -recipients.length,
              referenceType: "shipment",
              referenceId: shipmentId,
              description: `Email notifications sent to ${recipients.length} recipients`,
            });
          }
        }
      } catch (emailError) {
        console.error("Shipment created but email packet failed:", emailError);
      }
    }

    return NextResponse.json({ shipment: newShipment }, { status: 201 });
  } catch (error) {
    console.error("Create shipment error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
