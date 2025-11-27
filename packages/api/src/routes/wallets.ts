import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { generateQRCodeWithLogo } from "../utils/qrcode";

function generateQRToken(): string {
  return randomBytes(16).toString("hex");
}

export const walletRoutes = new Elysia({ prefix: "/wallets" })
  // Get all wallets
  .get("/", async ({ headers, query, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const where: any = {};
      if (query.companyId) {
        where.companyId = query.companyId;
      }
      if (query.type) {
        where.type = query.type;
      }

      const wallets = await prisma.wallet.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              contactInfo: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return wallets;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch wallets", message: error.message };
    }
  })

  // Get wallet by ID
  .get("/:id", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const wallet = await prisma.wallet.findUnique({
        where: { id: params.id },
        include: {
          company: true,
          topupLogs: {
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
              admin: {
                select: { name: true, email: true },
              },
            },
          },
          usageLogs: {
            take: 50,
            orderBy: { createdAt: "desc" },
            include: {
              staff: {
                select: { name: true, email: true },
              },
            },
          },
        },
      });

      if (!wallet) {
        set.status = 404;
        return { error: "Wallet not found" };
      }

      return wallet;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch wallet", message: error.message };
    }
  })

  // Get wallet by QR token (for scanning) - supports both qrDisplayToken and permanent qrToken
  .get("/qr/:qrToken", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      // Try to find by qrDisplayToken first (public QR)
      let wallet = await prisma.wallet.findUnique({
        where: { qrDisplayToken: params.qrToken },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // If not found, try permanent qrToken
      if (!wallet) {
        wallet = await prisma.wallet.findUnique({
          where: { qrToken: params.qrToken },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }

      if (!wallet) {
        set.status = 404;
        return { error: "Wallet not found" };
      }

      return wallet;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch wallet", message: error.message };
    }
  })

  // Create new wallet for a company
  .post(
    "/",
    async ({ headers, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user || user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Forbidden: Admin access required" };
        }

        // Check if wallet already exists for this company and type
        const existingWallet = await prisma.wallet.findFirst({
          where: {
            companyId: body.companyId,
            type: body.type,
          },
        });

        if (existingWallet) {
          set.status = 400;
          return { error: "Wallet already exists for this company and type" };
        }

        const wallet = await prisma.wallet.create({
          data: {
            companyId: body.companyId,
            type: body.type,
            balance: body.initialBalance || 0,
            qrToken: generateQRToken(),
          },
          include: {
            company: true,
          },
        });

        // If initial balance is provided, create a topup log
        if (body.initialBalance && body.initialBalance > 0) {
          await prisma.topupLog.create({
            data: {
              walletId: wallet.id,
              amountAdded: body.initialBalance,
              adminId: user.id,
            },
          });
        }

        return wallet;
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to create wallet", message: error.message };
      }
    },
    {
      body: t.Object({
        companyId: t.String(),
        type: t.Union([t.Literal("FUEL"), t.Literal("BOAT")]),
        initialBalance: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // Generate QR Code for wallet (as data URL)
  .get("/:id/qrcode", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const wallet = await prisma.wallet.findUnique({
        where: { id: params.id },
        include: {
          company: true,
        },
      });

      if (!wallet) {
        set.status = 404;
        return { error: "Wallet not found" };
      }


      // Generate QR Code with embedded logo
      const qrCodeDataURL = await generateQRCodeWithLogo(wallet.qrToken, {
        width: 512,
        margin: 2,
        logoSize: 100,
      });

      return {
        walletId: wallet.id,
        companyName: wallet.company.name,
        type: wallet.type,
        qrToken: wallet.qrToken,
        qrCodeDataURL,
      };
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to generate QR code", message: error.message };
    }
  })

  // Update wallet
  .put(
    "/:id",
    async ({ headers, params, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user || user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Forbidden: Admin access required" };
        }

        // Check if wallet exists
        const existingWallet = await prisma.wallet.findUnique({
          where: { id: params.id },
        });

        if (!existingWallet) {
          set.status = 404;
          return { error: "Wallet not found" };
        }

        // If changing company, check for duplicate
        if (body.companyId && body.companyId !== existingWallet.companyId) {
          const duplicateWallet = await prisma.wallet.findFirst({
            where: {
              companyId: body.companyId,
              type: existingWallet.type,
            },
          });

          if (duplicateWallet) {
            set.status = 400;
            return {
              error: "A wallet of this type already exists for the selected company",
            };
          }
        }

        // Prepare update data
        const updateData: any = {};
        if (body.companyId) {
          updateData.companyId = body.companyId;
        }
        if (body.balance !== undefined) {
          updateData.balance = body.balance;
        }

        // Update wallet
        const wallet = await prisma.wallet.update({
          where: { id: params.id },
          data: updateData,
          include: {
            company: true,
          },
        });

        return wallet;
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to update wallet", message: error.message };
      }
    },
    {
      body: t.Object({
        companyId: t.Optional(t.String()),
        balance: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // Delete wallet
  .delete("/:id", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { error: "Forbidden: Admin access required" };
      }

      await prisma.wallet.delete({
        where: { id: params.id },
      });

      return { message: "Wallet deleted successfully" };
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to delete wallet", message: error.message };
    }
  });
