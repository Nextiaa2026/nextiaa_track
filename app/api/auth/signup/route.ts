import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";
import { sendOtpEmail } from "@/lib/mail";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP in verificationTokens
    await db.insert(verificationTokens).values({
      identifier: `signup:${email}`,
      token: otp,
      expires,
    });

    // Create user (unverified)
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return NextResponse.json(
      { message: "Signup successful. Please verify your email with the OTP sent." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}
