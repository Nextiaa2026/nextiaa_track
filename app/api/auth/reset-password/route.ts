import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { resetPasswordSchema } from "@/lib/validations";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, otp } = resetPasswordSchema.parse(body);

    const identifier = `forgot-password:${email}`;

    // Verify OTP again
    const tokenRecord = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, otp),
        gt(verificationTokens.expires, new Date())
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date() 
      })
      .where(eq(users.email, email));

    // Delete token after use
    await db.delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 }
    );
  }
}
