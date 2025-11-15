import PDFDocument from "pdfkit";
import type { Coupon, Campaign } from "../generated/prisma";

interface CouponWithCampaign extends Coupon {
  campaign: Campaign;
}

export async function generateCouponPDF(coupons: CouponWithCampaign[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    coupons.forEach((coupon, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Header
      doc.fontSize(24).font("Helvetica-Bold").text("COUPON", { align: "center" });
      doc.moveDown();

      // Campaign info
      doc.fontSize(16).font("Helvetica").text(coupon.campaign.name, { align: "center" });
      if (coupon.campaign.description) {
        doc.fontSize(12).text(coupon.campaign.description, { align: "center" });
      }
      doc.moveDown(2);

      // Coupon code
      doc.fontSize(14).font("Helvetica-Bold").text("Coupon Code:", { align: "center" });
      doc.fontSize(18).font("Courier-Bold").text(coupon.code, { align: "center" });
      doc.moveDown(2);

      // QR Code
      if (coupon.qrCode) {
        try {
          const qrX = (doc.page.width - 200) / 2;
          const qrY = doc.y;
          doc.image(coupon.qrCode, qrX, qrY, { width: 200, height: 200 });
          doc.moveDown(12);
        } catch (error) {
          console.error("Error adding QR code to PDF:", error);
        }
      }

      // Footer
      doc.fontSize(10).font("Helvetica").text(
        `Valid from ${new Date(coupon.campaign.startDate).toLocaleDateString()} to ${new Date(
          coupon.campaign.endDate
        ).toLocaleDateString()}`,
        { align: "center" }
      );
      doc.moveDown();
      doc.fontSize(8).text(`ID: ${coupon.id}`, { align: "center" });
    });

    doc.end();
  });
}
