/**
 * Credit Service
 *
 * Manages the credit ledger for all users.
 *
 * Credit costs:
 *   + 100  welcome_bonus         — on account creation
 *   +  N   subscription_refresh  — monthly plan top-up
 *   -  5   shipment_created      — per shipment dispatched
 *   -  1   email_sent            — per recipient notified
 *   -  2   status_update         — per bulk status push
 *   - 10   vessel_added          — per new vessel registered
 *   -  3   trip_scheduled        — per trip created
 *   +/-N   admin_adjustment      — manual admin override
 */

import { db } from "@/db";
import { users, creditLedger } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreditReason =
  | "welcome_bonus"
  | "subscription_refresh"
  | "shipment_created"
  | "email_sent"
  | "status_update"
  | "vessel_added"
  | "trip_scheduled"
  | "admin_adjustment";

export type CreditReferenceType =
  | "shipment"
  | "vessel"
  | "trip"
  | "invoice"
  | "subscription"
  | null;

export const CREDIT_COSTS: Record<CreditReason, number> = {
  welcome_bonus: 100,
  subscription_refresh: 0, // set dynamically from plan
  shipment_created: -5,
  email_sent: -1,
  status_update: -2,
  vessel_added: -10,
  trip_scheduled: -3,
  admin_adjustment: 0, // set dynamically
};

interface DeductCreditOptions {
  userId: number;
  reason: CreditReason;
  referenceType?: CreditReferenceType;
  referenceId?: number;
  description?: string;
  customAmount?: number; // override for dynamic costs (e.g. multiple emails)
}

/**
 * Deduct or award credits atomically.
 * Returns { success, newBalance, error } — never throws.
 */
export async function applyCredit(
  opts: DeductCreditOptions,
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const amount = opts.customAmount ?? CREDIT_COSTS[opts.reason];

    // Fetch current balance
    const user = await db.query.users.findFirst({
      where: eq(users.id, opts.userId),
      columns: { credits: true },
    });

    if (!user) {
      return { success: false, newBalance: 0, error: "User not found" };
    }

    const newBalance = user.credits + amount;

    /* 
    // Prevent going below 0 for deductions (Commented out to not block view for now)
    if (amount < 0 && newBalance < 0) {
      return {
        success: false,
        newBalance: user.credits,
        error: "Insufficient credits",
      };
    }
    */

    // Update balance
    await db
      .update(users)
      .set({ credits: newBalance, updatedAt: new Date() })
      .where(eq(users.id, opts.userId));

    // Record in ledger
    await db.insert(creditLedger).values({
      userId: opts.userId,
      amount,
      balanceAfter: newBalance,
      reason: opts.reason,
      referenceType: opts.referenceType ?? null,
      referenceId: opts.referenceId ?? null,
      description:
        opts.description ??
        `${amount > 0 ? "+" : ""}${amount} credits — ${opts.reason.replace(/_/g, " ")}`,
    });

    return { success: true, newBalance };
  } catch (err) {
    console.error("[creditService] applyCredit error:", err);
    return { success: false, newBalance: 0, error: "Credit operation failed" };
  }
}

/**
 * Award the 100-credit welcome bonus on first account creation.
 * Safe to call multiple times — only applies once via the welcome_bonus ledger check.
 */
export async function awardWelcomeBonus(userId: number): Promise<void> {
  const existing = await db.query.creditLedger.findFirst({
    where: (cl, { and, eq }) =>
      and(eq(cl.userId, userId), eq(cl.reason, "welcome_bonus")),
  });

  if (existing) return; // already awarded

  await applyCredit({
    userId,
    reason: "welcome_bonus",
    customAmount: 100,
    description: "Welcome to Nextiaa track! 100 credits to get you started.",
  });
}

/**
 * Check if a user has enough credits for an operation.
 */
export async function hasEnoughCredits(
  userId: number,
  cost: number,
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { credits: true },
  });
  return (user?.credits ?? 0) >= Math.abs(cost);
}

/**
 * Get the current credit balance for a user.
 */
export async function getCreditBalance(userId: number): Promise<number> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { credits: true },
  });
  return user?.credits ?? 0;
}
