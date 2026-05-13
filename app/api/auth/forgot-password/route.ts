import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendOtpEmail } from "@/lib/mail";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: "If an account with this email exists, an OTP has been sent." },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in verificationTokens
    await db.insert(verificationTokens).values({
      identifier: `forgot-password:${email}`,
      token: otp,
      expires,
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return NextResponse.json(
      { message: "If an account with this email exists, an OTP has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to send reset instructions" },
      { status: 500 }
    );
  }
}
