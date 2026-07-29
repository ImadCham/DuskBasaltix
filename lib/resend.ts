import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER || "duskbasaltix@gmail.com";
const defaultGmailPass = Buffer.from(
  "ZmVhYiBybG9yIHFubHkgcHp4bg==",
  "base64"
).toString("utf-8");
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD || defaultGmailPass;

export const FROM_EMAIL = `DUSK EVE × BASALTE <${gmailUser}>`;

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

export const resend = {
  emails: {
    send: async (options: {
      from?: string;
      to: string | string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    }) => {
      const recipient = Array.isArray(options.to)
        ? options.to.join(", ")
        : options.to;
      try {
        const info = await transporter.sendMail({
          from: options.from || FROM_EMAIL,
          to: recipient,
          subject: options.subject,
          html: options.html,
          attachments: options.attachments,
        });
        return { data: { id: info.messageId }, error: null };
      } catch (err) {
        console.error("[Nodemailer Gmail] Email send error:", err);
        return {
          data: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  },
};

export function buildTicketEmailHtml(params: {
  buyerName: string;
  tier: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  qrImageDataUrl: string;
  ticketId: string;
  quantity: number;
  posterUrl?: string;
  lang?: "fr" | "en";
}): string {
  const {
    buyerName,
    tier,
    eventName,
    eventDate,
    eventVenue,
    qrImageDataUrl,
    ticketId,
    quantity,
    posterUrl,
    lang = "fr",
  } = params;

  const isEn = lang === "en";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const posterSrc = posterUrl || `${appUrl}/assets/poster.jpeg`;
  const shortOrderId = (ticketId || "ORDER").substring(0, 8).toUpperCase();

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEn ? `Your Ticket — ${eventName}` : `Vos billets pour ${eventName}`}</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:30px 15px;background:#060608;">
    <tr>
      <td style="text-align:center;">

        <!-- Poster Banner Top -->
        <div style="background:#000000;border-radius:16px;overflow:hidden;padding:0;margin-bottom:24px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 15px 35px rgba(0,0,0,0.8);">
          <img src="${posterSrc}" alt="${eventName}" width="570" style="width:100%;max-width:570px;height:auto;display:block;margin:0 auto;" />
          <div style="padding:20px 15px;background:#000000;">
            <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">${eventName}</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#aaaaaa;font-weight:600;">${eventDate}</p>
          </div>
        </div>

        <!-- Greeting Text -->
        <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;">
          ${isEn ? "Thank you for your purchase!" : "Merci pour votre achat !"}
        </h2>
        <p style="margin:0 0 24px;font-size:13px;color:#bbbbbb;line-height:1.6;max-width:520px;display:inline-block;">
          ${
            isEn
              ? "Your payment has been successfully confirmed and your place is officially reserved. Please find your ticket (QR Code) attached to this email."
              : "Votre paiement a été confirmé avec succès et votre place est officiellement réservée. Veuillez trouver votre billet (QR Code) en <strong>pièce jointe</strong> de cet email."
          }
        </p>

        <!-- Summary Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#14141c;border-radius:14px;border:1px solid rgba(255,255,255,0.12);text-align:left;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    <strong style="color:#ffffff;">Lieu :</strong> ${eventVenue}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    <strong style="color:#ffffff;">Billet :</strong> ${tier} ${quantity > 1 ? `(×${quantity})` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    <strong style="color:#ffffff;">Numéro de commande :</strong> <span style="font-family:monospace;color:#ffaeae;">#${shortOrderId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    <strong style="color:#ffffff;">Acheteur :</strong> ${buyerName}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Inline QR Code Display -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#111118;border-radius:14px;border:1px solid #7A1F2B;text-align:center;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8B1528;font-weight:800;">
                ${isEn ? "ENTRY QR CODE" : "QR CODE D'ENTRÉE"}
              </p>
              <div style="background:#ffffff;padding:12px;border-radius:12px;display:inline-block;">
                <img src="${qrImageDataUrl}" alt="QR Code" width="180" height="180" style="display:block;margin:0 auto;border:0;" />
              </div>
              <p style="margin:12px 0 0;font-size:10px;font-family:monospace;color:#6b7280;">ID: ${ticketId}</p>
            </td>
          </tr>
        </table>

        <!-- Warning Notice Red -->
        <div style="padding:16px 20px;background:rgba(122,31,43,0.18);border-radius:12px;border:1px solid rgba(122,31,43,0.5);text-align:left;margin-bottom:28px;">
          <p style="margin:0;font-size:12px;color:#ffaeae;line-height:1.6;font-weight:600;">
            ⚠️ <strong>Important :</strong> Veuillez préparer le PDF en pièce jointe sur votre téléphone avec la luminosité au maximum lors de votre arrivée à la porte.
          </p>
        </div>

        <!-- Footer -->
        <p style="margin:0 0 4px;font-size:12px;color:#888888;">À bientôt sur la piste 🕺</p>
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#555555;font-weight:700;">
          DUSK EVE SOUNDS × BASALTE
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
}
