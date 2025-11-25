import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";

export const topupRoutes = new Elysia({ prefix: "/topup" })
  // Get all topup logs
  .get("/", async ({ headers, query, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { error: "Forbidden: Admin access required" };
      }

      const where: any = {};
      if (query.walletId) {
        where.walletId = query.walletId;
      }
      if (query.adminId) {
        where.adminId = query.adminId;
      }

      const topupLogs = await prisma.topupLog.findMany({
        where,
        include: {
          wallet: {
            include: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return topupLogs;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch topup logs", message: error.message };
    }
  })

  // Create new topup (เติมยอด)
  .post(
    "/",
    async ({ headers, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user || user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Forbidden: Admin access required" };
        }

        if (body.amount <= 0) {
          set.status = 400;
          return { error: "Amount must be greater than 0" };
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
          // Get current wallet
          const wallet = await tx.wallet.findUnique({
            where: { id: body.walletId },
          });

          if (!wallet) {
            throw new Error("Wallet not found");
          }

          // Update wallet balance
          const updatedWallet = await tx.wallet.update({
            where: { id: body.walletId },
            data: {
              balance: wallet.balance + body.amount,
            },
          });

          // Create topup log
          const topupLog = await tx.topupLog.create({
            data: {
              amountAdded: body.amount,
              wallet: {
                connect: { id: body.walletId },
              },
              admin: {
                connect: { id: user.userId },
              },
            },
            include: {
              wallet: {
                include: {
                  company: true,
                },
              },
              admin: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          return { topupLog, updatedWallet };
        });

        return {
          message: "Top-up successful",
          topupLog: result.topupLog,
          newBalance: result.updatedWallet.balance,
        };
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to process top-up", message: error.message };
      }
    },
    {
      body: t.Object({
        walletId: t.String(),
        amount: t.Number({ minimum: 0.01 }),
      }),
    }
  )

  // Get topup history for a wallet
  .get("/wallet/:walletId", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const topupLogs = await prisma.topupLog.findMany({
        where: {
          walletId: params.walletId,
        },
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return topupLogs;
    } catch (error: any) {
      set.status = 500;
      return {
        error: "Failed to fetch topup history",
        message: error.message,
      };
    }
  });
