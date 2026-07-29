import QRCode from "qrcode";

/**
 * Generates a QR code as a base64 PNG data URL.
 * Used for embedding in emails or HTML.
 */
export async function generateQRCodeDataUrl(data: string): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}

/**
 * Generates a QR code as a Buffer (PNG binary).
 * Useful if you need to attach it as a file.
 */
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return await QRCode.toBuffer(data, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}
