import { NextRequest, NextResponse } from "next/server";

/**
 * ShipsGo Webhook Endpoint
 *
 * Receives real-time tracking updates from ShipsGo
 * Currently disabled - logs are manually entered by admins
 *
 * To enable:
 * 1. Add ShipsGo API key to environment
 * 2. Configure webhook URL in ShipsGo dashboard
 * 3. Uncomment processing logic below
 */

export async function POST(request: NextRequest) {
  try {
    const webhook = await request.json();

    // TODO: Verify webhook signature from ShipsGo
    // const isValid = verifyShipsGoSignature(request, webhook);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    // For now, just acknowledge receipt
    // In production, this would:
    // 1. Find shipment by tracking number
    // 2. Create shipment log entry
    // 3. Update shipment status
    // 4. Send notifications to sender/receiver

    console.log("ShipsGo webhook received:", webhook);

    return NextResponse.json(
      { success: true, message: "Webhook received" },
      { status: 200 },
    );
  } catch (error) {
    console.error("ShipsGo webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
