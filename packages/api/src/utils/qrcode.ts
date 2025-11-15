import QRCode from "qrcode";

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
}

export function generateCouponCode(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CP-${timestamp}-${randomStr}`.toUpperCase();
}
