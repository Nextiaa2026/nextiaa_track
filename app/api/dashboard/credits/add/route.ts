import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyCredit } from "@/services/credit.service";
import { z } from "zod";

const addCreditsSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().optional().default("Credits purchase (Demo)"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { amount, reason } = addCreditsSchema.parse(body);

    const result = await applyCredit({
      userId,
      reason: "admin_adjustment", // Using admin_adjustment for manual/purchase simulation
      customAmount: amount,
      description: reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      message: `Successfully added ${amount} credits.`,
    });
  } catch (error) {
    console.error("Add credits error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
