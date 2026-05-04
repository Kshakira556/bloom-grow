import { Resend } from "npm:resend";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

const DEFAULT_FROM = "onboarding@resend.dev";

const getFrontendBaseUrl = (): string => {
  const configured =
    Deno.env.get("FRONTEND_URL") ||
    Deno.env.get("APP_BASE_URL") ||
    Deno.env.get("WEB_APP_URL");

  if (configured && configured.trim().length > 0) {
    return configured.trim().replace(/\/$/, "");
  }

  return "https://www.cubapp.co.za";
};

const sendEmail = async ({ to, subject, html }: EmailPayload): Promise<void> => {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
  });

  if (result.error) {
    throw new Error("Resend email failed");
  }
};

export const sendWelcomeEmail = async (fullName: string, email: string): Promise<void> => {
  await sendEmail({
    to: email,
    subject: "Welcome to CUB",
    html: `
      <h2>Welcome to CUB, ${fullName}!</h2>
      <p>Your account has been successfully created.</p>
      <p>You can now log in and start using the platform.</p>
    `,
  });
};

export const sendPlanInviteEmail = async (
  recipientEmail: string,
  inviteId: string,
  inviterName?: string,
  suggestedAccountType?: "trial" | "paid",
): Promise<void> => {
  const baseUrl = getFrontendBaseUrl();

  // Include the invited email and suggested plan type in the link so the frontend
  // can prefill + lock these fields during sign-in / registration.
  const params = new URLSearchParams({
    invite_id: inviteId,
    email: recipientEmail,
  });
  if (suggestedAccountType) {
    params.set("account_type", suggestedAccountType);
  }

  const inviteUrl = `${baseUrl}/accept-invite?${params.toString()}`;
  const inviterLine = inviterName
    ? `<p><strong>${inviterName}</strong> invited you to join a parenting plan on CUB.</p>`
    : "<p>You were invited to join a parenting plan on CUB.</p>";

  await sendEmail({
    to: recipientEmail,
    subject: "You're invited to a CUB Parenting Plan",
    html: `
      <h2>You have a CUB invite</h2>
      ${inviterLine}
      <p>Use the button below to continue:</p>
      <p>
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#1f2937;color:#ffffff;text-decoration:none;border-radius:6px;">
          Accept invite
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${inviteUrl}</p>
    `,
  });
};

