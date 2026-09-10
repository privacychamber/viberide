import nodemailer from "nodemailer";

interface SendOtpParams {
  to: string;
  name: string;
  otp: string;
}

export async function sendVerificationEmail({ to, name, otp }: SendOtpParams): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Viberide" <${user || "noreply@viberide.in"}>`;

  // If SMTP is not yet configured, log to console for development / local testing
  if (!host || !user || !pass) {
    console.log("\n=======================================================");
    console.log(`📨 [VIBERIDE DEV EMAIL OTP SIMULATION]`);
    console.log(`To: ${to} (${name})`);
    console.log(`Your 6-Digit Email Verification Code: [ ${otp} ]`);
    console.log(`Valid for 10 minutes.`);
    console.log("=======================================================\n");
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Viberide Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #334155;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #10b981;">
                VIBERIDE
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">Your Journey. Your Ride. Your Vibe.</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #ffffff; font-weight: 700;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hi <strong style="color: #ffffff;">${name}</strong>,<br/>
                Welcome to Viberide! Please use the 6-digit verification code below to confirm your email address and activate your account.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #0f172a; border: 1px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #10b981; font-family: monospace;">
                  ${otp}
                </span>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
                  This code expires in 10 minutes.
                </p>
              </div>
              
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #94a3b8;">
                If you did not request this registration, you can safely disregard this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Viberide Rental Technologies. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `${otp} is your Viberide verification code`,
      text: `Welcome to Viberide! Your 6-digit verification code is: ${otp}. It expires in 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[SMTP] Verification email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[SMTP ERROR] Failed to send email:", error);
    // Even if sending fails, don't crash entirely; return error
    throw error;
  }
}
