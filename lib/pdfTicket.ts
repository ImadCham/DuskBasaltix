import { jsPDF } from "jspdf";

export async function generateTicketPDF(params: {
  buyerName: string;
  buyerEmail: string;
  tierName: string;
  ticketId: string;
  qrCodeDataUrl: string;
  eventDate?: string;
  eventVenue?: string;
}): Promise<Uint8Array> {
  const {
    buyerName,
    tierName,
    ticketId,
    qrCodeDataUrl,
  } = params;

  // Create A5 size PDF document (portrait) - 148mm x 210mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Full black background (Screen 2)
  doc.setFillColor(10, 10, 12);
  doc.rect(0, 0, width, height, "F");

  // 1. Top Header Bar (Screen 2 style)
  doc.setFillColor(5, 5, 5);
  doc.rect(0, 0, width, 12, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("D U S K  E V E  x  B A S A L T E", 8, 8);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 200, 200);
  doc.text("10:00 PM", width - 8, 8, { align: "right" });

  // 2. Date Banner on top of poster
  doc.setFillColor(25, 25, 30);
  doc.rect(8, 14, width - 16, 7, "F");
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(
    "14/08/2026   CHI Restaurant Bar - 3977 St-Laurent   22:00-03:00",
    width / 2,
    18.5,
    { align: "center" }
  );

  // 3. Central Poster Card Placeholder / Frame (Screen 2)
  const posterY = 22;
  const posterHeight = 90;
  const posterWidth = width - 16;

  doc.setFillColor(15, 15, 20);
  doc.rect(8, posterY, posterWidth, posterHeight, "F");
  doc.setDrawColor(60, 60, 70);
  doc.rect(8, posterY, posterWidth, posterHeight, "S");

  // Try to load base64 poster or placeholder text
  try {
    const imgData = await fetchPosterAsBase64();
    if (imgData) {
      doc.addImage(imgData, "JPEG", 8, posterY, posterWidth, posterHeight);
    }
  } catch (e) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DUSK EVE x BASALTE", width / 2, posterY + 40, { align: "center" });
  }

  // 4. Two-Column Event Details (Screen 2)
  const detailsY = posterY + posterHeight + 6;

  // Left: ÉVÈNEMENT
  doc.setTextColor(140, 140, 150);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("ÉVÈNEMENT", 12, detailsY);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(tierName || "Admission", 12, detailsY + 6);

  // Right: NAME / NOM
  doc.setTextColor(140, 140, 150);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("NAME / NOM", width / 2 + 10, detailsY);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(buyerName || "Acheteur", width / 2 + 10, detailsY + 6);

  // Divider line
  doc.setDrawColor(40, 40, 50);
  doc.setLineWidth(0.3);
  doc.line(8, detailsY + 12, width - 8, detailsY + 12);

  // 5. Large Centered White QR Code Box (Screen 2)
  const qrSize = 65;
  const qrX = (width - qrSize) / 2;
  const qrY = detailsY + 16;

  doc.setFillColor(255, 255, 255);
  doc.rect(qrX, qrY, qrSize, qrSize, "F");

  if (qrCodeDataUrl) {
    try {
      doc.addImage(qrCodeDataUrl, "PNG", qrX + 3, qrY + 3, qrSize - 6, qrSize - 6);
    } catch (e) {
      console.error("Failed to render QR Code image in PDF:", e);
    }
  }

  // Ticket ID label
  doc.setTextColor(120, 120, 130);
  doc.setFontSize(6.5);
  doc.setFont("courier", "bold");
  doc.text(`ID: ${ticketId}`, width / 2, qrY + qrSize + 5, { align: "center" });

  const pdfArrayBuffer = doc.output("arraybuffer");

  if (typeof window !== "undefined") {
    const filename = `Billet_DuskEve_Basalte_${ticketId.substring(0, 8)}.pdf`;
    doc.save(filename);
  }

  return new Uint8Array(pdfArrayBuffer);
}

async function fetchPosterAsBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/assets/poster.jpeg");
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return null;
  }
}
