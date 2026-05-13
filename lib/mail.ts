export async function sendOtpEmail(email: string, otp: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not defined");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Nexiaa Track <onboarding@resend.dev>",
        to: email,
        subject: "Your OTP Verification Code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 24px;">Verification Code</h1>
            <p style="color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              Hello, <br /><br />
              Use the following One-Time Password (OTP) to verify your identity. This code is valid for 10 minutes.
            </p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
              <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px; text-align: center;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend API error:", error);
    }
  } catch (error) {
    console.error("Failed to send OTP email:", error);
  }
}
