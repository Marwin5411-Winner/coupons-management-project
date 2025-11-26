import QRCode from "qrcode";
import { createCanvas, loadImage } from 'canvas';
import { join } from 'path';

/**
 * Generate QR code with embedded logo in the center
 * @param data - Data to encode in QR code
 * @param options - QR code generation options
 * @returns Base64 data URL of QR code with logo
 */
export async function generateQRCodeWithLogo(
  data: string,
  options: {
    width?: number;
    margin?: number;
    logoSize?: number;
    logoPath?: string;
  } = {}
): Promise<string> {
  const {
    width = 512,
    margin = 2,
    logoSize = 100,
    logoPath = 'public/logo.jpg',
  } = options;

  try {
    // Generate base QR code with high error correction
    const qrDataURL = await QRCode.toDataURL(data, {
      width,
      margin,
      errorCorrectionLevel: 'H', // High error correction allows logo overlay
    });

    // Create canvas
    const canvas = createCanvas(width, width);
    const ctx = canvas.getContext('2d');

    // Draw QR code
    const qrImage = await loadImage(qrDataURL);
    ctx.drawImage(qrImage, 0, 0, width, width);

    // Try to load and draw logo in center
    try {
      // Resolve path from current working directory (which is the API package when server runs)
      const logoFullPath = join(process.cwd(), logoPath);
      const logo = await loadImage(logoFullPath);

      // Calculate logo position (center)
      const logoX = (width - logoSize) / 2;
      const logoY = (width - logoSize) / 2;

      // Draw white background for logo
      ctx.fillStyle = '#FFFFFF';
      const padding = 8;
      ctx.fillRect(
        logoX - padding,
        logoY - padding,
        logoSize + padding * 2,
        logoSize + padding * 2
      );

      // Draw logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    } catch (logoError) {
      console.warn('Logo not found at', logoPath, '- generating QR without logo');
      console.error('Logo error details:', logoError);
      // If logo fails to load, return QR code without logo
    }

    // Return as data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code with logo:', error);
    // Fallback to basic QR code without logo
    return await QRCode.toDataURL(data, { width, margin });
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function generateQRCode(data: string): Promise<string> {
  return generateQRCodeWithLogo(data, { width: 300, margin: 1 });
}

export function generateCouponCode(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CP-${timestamp}-${randomStr}`.toUpperCase();
}
