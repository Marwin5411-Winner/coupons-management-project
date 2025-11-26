import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { randomBytes } from "crypto";
import QRCode from "qrcode";

function generateQRDisplayToken(): string {
  return randomBytes(16).toString("hex");
}

export const publicRoutes = new Elysia({ prefix: "/public" })
  // Get wallet by ID (permanent public URL)
  .get("/wallet/:walletId", async ({ params, set }) => {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { id: params.walletId },
        include: {
          company: {
            select: {
              name: true,
              contactInfo: true,
            },
          },
        },
      });

      if (!wallet) {
        set.status = 404;
        return { error: "Wallet not found" };
      }

      // Check if QR display token needs refresh (expired or doesn't exist)
      let qrDisplayToken = wallet.qrDisplayToken;
      let qrDisplayTokenExpiry = wallet.qrDisplayTokenExpiry;
      
      const now = new Date();
      const needsRefresh = !qrDisplayToken || !qrDisplayTokenExpiry || qrDisplayTokenExpiry < now;

      if (needsRefresh) {
        // Generate new display token
        qrDisplayToken = generateQRDisplayToken();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 3); // 3 days from now
        qrDisplayTokenExpiry = expiryDate;

        // Update wallet with new QR display token
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            qrDisplayToken,
            qrDisplayTokenExpiry,
          },
        });
      }

      // Import the helper function
      const { generateQRCodeWithLogo } = await import('../utils/qrcode');

      // Generate QR code with embedded logo - it contains URL to /public/qr/:qrDisplayToken
      const baseUrl = process.env.PUBLIC_URL || "http://localhost:5175";
      const qrUrl = `${baseUrl}/public/qr/${qrDisplayToken}`;
      const qrCodeDataURL = await generateQRCodeWithLogo(qrUrl, {
        width: 512,
        margin: 2,
        logoSize: 100,
      });

      return {
        wallet: {
          id: wallet.id,
          type: wallet.type,
          balance: wallet.balance,
          company: wallet.company,
          qrCodeDataURL,
          qrDisplayTokenExpiry,
        },
      };
    } catch (error: any) {
      console.error("Error fetching wallet:", error);
      set.status = 500;
      return { error: "Failed to fetch wallet", message: error.message };
    }
  })

  // Get topup history for a wallet (10-20 records)
  .get("/wallet/:walletId/topup-history", async ({ params, query, set }) => {
    try {
      const limit = Math.min(Math.max(Number(query.limit) || 20, 10), 20);

      const topupLogs = await prisma.topupLog.findMany({
        where: {
          walletId: params.walletId,
        },
        select: {
          id: true,
          amountAdded: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return {
        history: topupLogs,
        count: topupLogs.length,
      };
    } catch (error: any) {
      console.error("Error fetching topup history:", error);
      set.status = 500;
      return {
        error: "Failed to fetch topup history",
        message: error.message,
      };
    }
  })

  // QR scan endpoint - redirects to permanent wallet URL
  .get("/qr/:qrDisplayToken", async ({ params, set }) => {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { qrDisplayToken: params.qrDisplayToken },
        select: {
          id: true,
        },
      });

      if (!wallet) {
        set.status = 404;
        return { error: "Invalid QR code" };
      }

      // Redirect to permanent wallet URL
      const baseUrl = process.env.PUBLIC_URL || "http://localhost:5175";
      set.redirect = `${baseUrl}/wallet/${wallet.id}`;
      set.status = 302;
      
      return;
    } catch (error: any) {
      console.error("Error processing QR scan:", error);
      set.status = 500;
      return { error: "Failed to process QR code", message: error.message };
    }
  });
