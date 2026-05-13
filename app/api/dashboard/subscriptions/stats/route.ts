import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, userSubscriptions, subscriptionPlans, creditLedger } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Get user credits and subscription
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { credits: true },
      with: {
        subscriptions: {
          where: eq(userSubscriptions.status, "active"),
          with: {
            plan: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent credit transactions
    const transactions = await db.query.creditLedger.findMany({
      where: eq(creditLedger.userId, userId),
      orderBy: [desc(creditLedger.createdAt)],
      limit: 5,
    });

    const activeSubscription = user.subscriptions?.[0];

    return NextResponse.json({
      balance: user.credits,
      planName: activeSubscription?.plan?.displayName ?? "Free Plan",
      planId: activeSubscription?.plan?.id ?? null,
      status: activeSubscription?.status ?? "none",
      nextRefresh: activeSubscription?.currentPeriodEnd ?? null,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error("Get subscription stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
