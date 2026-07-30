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
  orderId?: string;
  subtotalCents?: number;
  serviceFeeCents?: number;
  tpsCents?: number;
  tvqCents?: number;
  totalCents?: number;
  tierItems?: { name?: string; qty: number; price?: number }[];
  orderDate?: string;
  posterUrl?: string;
  lang?: "fr" | "en";
}): string {
  const {
    buyerName,
    eventName,
    eventDate,
    eventVenue,
    qrImageDataUrl,
    ticketId,
    orderId,
    subtotalCents = 0,
    serviceFeeCents = 0,
    tpsCents = 0,
    tvqCents = 0,
    totalCents = 0,
    tierItems = [],
    orderDate,
    posterUrl,
    lang = "fr",
  } = params;

  const isEn = lang === "en";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const posterSrc = posterUrl || `${appUrl}/assets/poster.jpeg?v=2`;
  const shortOrderId = (orderId || ticketId || "ORDER").substring(0, 8).toUpperCase();
  const dateStr = orderDate || new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });

  const formatPrice = (cents: number) => (cents / 100).toFixed(2);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEn ? \`Your Ticket — \${eventName}\` : \`Vos billets pour \${eventName}\`}</title>
</head>
<body style="margin:0;padding:0;background:#060608;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:30px 15px;background:#060608;">
    <tr>
      <td style="text-align:center;">

        <!-- Poster Banner Top -->
        <div style="background:#000000;border-radius:16px;overflow:hidden;padding:0;margin-bottom:24px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 15px 35px rgba(0,0,0,0.8);">
          <img src="\${posterSrc}" alt="\${eventName}" width="570" style="width:100%;max-width:570px;height:auto;display:block;margin:0 auto;" />
          <div style="padding:20px 15px;background:#000000;">
            <h1 style="margin:0;font-size:26px;font-weight:900;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">\${eventName}</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#aaaaaa;font-weight:600;">\${eventDate}</p>
          </div>
        </div>

        <!-- Greeting Text -->
        <h2 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#ffffff;text-align:left;">
          \${isEn ? \`Thank you \${buyerName} ! 🎉\` : \`Merci \${buyerName} ! 🎉\`}
        </h2>
        <p style="margin:0 0 24px;font-size:13px;color:#bbbbbb;line-height:1.6;text-align:left;">
          \${
            isEn
              ? "Your payment has been successfully confirmed and your place is officially reserved.<br/>Your tickets (PDF with QR code) are attached to this email."
              : "Votre paiement a été traité avec succès. Votre place est officiellement réservée.<br/>Vos billets (PDF avec QR codes) sont en pièce jointe de ce courriel."
          }
        </p>

        <!-- Billets Info Title -->
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#ffffff;text-align:left;font-style:italic;">
          \${isEn ? "Ticket Information" : "Informations sur les billets"}
        </h3>

        <!-- Summary Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#111115;border-radius:14px;border:1px solid rgba(255,255,255,0.12);text-align:left;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                \${tierItems.map(item => \`
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    <strong style="color:#ffffff;">\${item.qty}x \${item.name || "Billet"}</strong> — \${formatPrice((item.price || 0) * item.qty)} $ CA<br/>
                    <span style="font-size:10px;color:#888888;background:#1a1a24;padding:2px 6px;border-radius:4px;border:1px solid #333;margin-top:4px;display:inline-block;">Billet électronique</span>
                  </td>
                </tr>
                \`).join('')}
                <tr>
                  <td style="padding:16px 0 6px;font-size:13px;color:#999999;border-top:1px solid rgba(255,255,255,0.1);">
                    \${isEn ? "Service fee" : "Frais de service"} : \${formatPrice(serviceFeeCents)} $ CA
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0 6px;font-size:13px;color:#999999;">
                    TPS (5%) : \${formatPrice(tpsCents)} $ CA
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0 16px;font-size:13px;color:#999999;border-bottom:1px solid rgba(255,255,255,0.1);">
                    TVQ (9.975%) : \${formatPrice(tvqCents)} $ CA
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0;font-size:15px;color:#ffffff;font-weight:bold;">
                    \${isEn ? "Total, including fees" : "Total, frais inclus"} : \${formatPrice(totalCents)} $ CA
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Commande Info Title -->
        <h3 style="margin:0 0 12px;font-size:16px;font-weight:800;color:#ffffff;text-align:left;font-style:italic;">
          \${isEn ? "Order Information" : "Informations sur la commande"}
        </h3>

        <!-- Order Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#111115;border-radius:14px;border:1px solid rgba(255,255,255,0.12);text-align:left;">
          <tr>
            <td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Order number :" : "Numéro de commande :"} <strong style="color:#ffffff;">#\${shortOrderId}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Order date :" : "Date de commande :"} <strong style="color:#ffffff;">\${dateStr}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Transaction amount :" : "Montant de la transaction :"} <strong style="color:#ffffff;">\${formatPrice(totalCents)} $ CA</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Event :" : "Événement :"} <strong style="color:#ffffff;">\${eventName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Venue :" : "Lieu :"} <strong style="color:#ffffff;">\${eventVenue}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#dddddd;">
                    \${isEn ? "Date :" : "Date :"} <strong style="color:#ffffff;">\${eventDate}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Warning Notice Red -->
        <div style="padding:16px 20px;background:rgba(122,31,43,0.18);border-radius:12px;border:1px solid rgba(122,31,43,0.5);text-align:left;margin-bottom:28px;">
          <p style="margin:0;font-size:12px;color:#ffaeae;line-height:1.6;font-weight:600;">
            ⚠️ <strong>Important :</strong> \${isEn ? "Please have the PDF attached ready on your phone with maximum brightness when you arrive. Each ticket contains a unique QR code." : "Présentez le PDF en pièce jointe sur votre téléphone avec la luminosité au maximum lors de votre arrivée. Chaque billet contient un QR code unique."}
          </p>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>\`;
}
