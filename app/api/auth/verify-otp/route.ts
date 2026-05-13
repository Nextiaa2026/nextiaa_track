import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { verifyOtpSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, type } = verifyOtpSchema.parse(body);

    const identifier = `${type}:${email}`;

    // Find valid token
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, otp),
        gt(verificationTokens.expires, new Date())
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Success!
    if (type === "signup") {
      // Mark user as verified
      await db.update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.email, email));
    }

    // Delete token after use
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    return NextResponse.json(
      { message: "OTP verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
