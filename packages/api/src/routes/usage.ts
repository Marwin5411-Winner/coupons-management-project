import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";

export const usageRoutes = new Elysia({ prefix: "/usage" })
  // Get all usage logs
  .get("/", async ({ headers, query, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const where: any = {};
      if (query.walletId) {
        where.walletId = query.walletId;
      }
      if (query.staffId) {
        where.staffId = query.staffId;
      }

      const usageLogs = await prisma.usageLog.findMany({
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
          staff: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return usageLogs;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch usage logs", message: error.message };
    }
  })

  // Validate wallet before usage (for staff scanning)
  .post(
    "/validate",
    async ({ headers, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        // Find wallet by QR token - support both qrDisplayToken (public pages) and qrToken (permanent)
        let wallet = await prisma.wallet.findUnique({
          where: { qrDisplayToken: body.qrToken },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // If not found by qrDisplayToken, try permanent qrToken
        if (!wallet) {
          wallet = await prisma.wallet.findUnique({
            where: { qrToken: body.qrToken },
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
          return {
            valid: false,
            error: "QR Code ไม่ถูกต้อง",
            message: "Wallet not found"
          };
        }

        // Check if qrDisplayToken is expired (only if we found by qrDisplayToken)
        if (wallet.qrDisplayToken === body.qrToken && wallet.qrDisplayTokenExpiry) {
          const now = new Date();
          if (wallet.qrDisplayTokenExpiry < now) {
            return {
              valid: false,
              error: "QR Code หมดอายุแล้ว กรุณารีเฟรชหน้าเว็บ",
              message: "QR Display Token expired"
            };
          }
        }

        // Check if balance is sufficient
        if (wallet.balance < body.amount) {
          return {
            valid: false,
            error: "ยอดคงเหลือไม่เพียงพอ",
            wallet: {
              id: wallet.id,
              type: wallet.type,
              balance: wallet.balance,
              company: wallet.company,
            },
          };
        }

        return {
          valid: true,
          wallet: {
            id: wallet.id,
            type: wallet.type,
            balance: wallet.balance,
            company: wallet.company,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          valid: false,
          error: "เกิดข้อผิดพลาด",
          message: error.message
        };
      }
    },
    {
      body: t.Object({
        qrToken: t.String(),
        amount: t.Number({ minimum: 0.01 }),
      }),
    }
  )

  // Redeem/Use (ตัดยอด)
  .post(
    "/redeem",
    async ({ headers, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        if (body.amount <= 0) {
          set.status = 400;
          return { error: "Amount must be greater than 0" };
        }

        // Validate durationMinutes for BOAT type
        if (body.durationMinutes !== undefined && body.durationMinutes < 0) {
          set.status = 400;
          return { error: "Duration must be 0 or greater" };
        }

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
          // Get current wallet
          const wallet = await tx.wallet.findUnique({
            where: { id: body.walletId },
            include: {
              company: true,
            },
          });

          if (!wallet) {
            throw new Error("Wallet not found");
          }

          // Check balance
          if (wallet.balance < body.amount) {
            throw new Error("Insufficient balance");
          }

          // Update wallet balance
          const updatedWallet = await tx.wallet.update({
            where: { id: body.walletId },
            data: {
              balance: wallet.balance - body.amount,
            },
          });

          // Create usage log
          const usageLog = await tx.usageLog.create({
            data: {
              walletId: body.walletId,
              amountDeducted: body.amount,
              durationMinutes: body.durationMinutes || null,
              staffId: user.userId,
            },
            include: {
              wallet: {
                include: {
                  company: true,
                },
              },
              staff: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          });

          return { usageLog, updatedWallet };
        });

        return {
          success: true,
          message: "ตัดยอดสำเร็จ",
          usageLog: result.usageLog,
          newBalance: result.updatedWallet.balance,
        };
      } catch (error: any) {
        if (error.message === "Insufficient balance") {
          set.status = 400;
          return {
            success: false,
            error: "ยอดคงเหลือไม่เพียงพอ",
            message: error.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: "เกิดข้อผิดพลาดในการตัดยอด",
          message: error.message
        };
      }
    },
    {
      body: t.Object({
        walletId: t.String(),
        amount: t.Number({ minimum: 0.01 }),
        durationMinutes: t.Optional(t.Number({ minimum: 0 })),
      }),
    }
  )

  // Get usage history for a wallet
  .get("/wallet/:walletId", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const usageLogs = await prisma.usageLog.findMany({
        where: {
          walletId: params.walletId,
        },
        include: {
          staff: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return usageLogs;
    } catch (error: any) {
      set.status = 500;
      return {
        error: "Failed to fetch usage history",
        message: error.message,
      };
    }
  })

  // Get usage history for staff (my redemptions)
  .get("/my-redemptions", async ({ headers, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const usageLogs = await prisma.usageLog.findMany({
        where: {
          staffId: user.userId,
        },
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
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return usageLogs;
    } catch (error: any) {
      set.status = 500;
      return {
        error: "Failed to fetch redemption history",
        message: error.message,
      };
    }
  });
