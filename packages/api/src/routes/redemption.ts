import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";

export const redemptionRoutes = new Elysia({ prefix: "/redemption" })
  .post(
    "/validate",
    async ({ body, set }) => {
      try {
        const { code } = body;

        // Find coupon by code
        const coupon = await prisma.coupon.findUnique({
          where: { code },
          include: {
            campaign: true,
            redemptions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!coupon) {
          set.status = 404;
          return {
            valid: false,
            error: "Coupon not found",
            message: "คูปองนี้ไม่มีในระบบ",
          };
        }

        // Check if already used
        if (coupon.status === "USED") {
          set.status = 400;
          return {
            valid: false,
            error: "Coupon already used",
            message: "คูปองนี้ถูกใช้ไปแล้ว",
            coupon,
          };
        }

        // Check if expired (by status)
        if (coupon.status === "EXPIRED") {
          set.status = 400;
          return {
            valid: false,
            error: "Coupon expired",
            message: "คูปองนี้หมดอายุแล้ว",
            coupon,
          };
        }

        // Check campaign dates
        const now = new Date();
        const startDate = new Date(coupon.campaign.startDate);
        const endDate = new Date(coupon.campaign.endDate);

        if (now < startDate) {
          set.status = 400;
          return {
            valid: false,
            error: "Campaign not started",
            message: "แคมเปญยังไม่เริ่ม",
            coupon,
          };
        }

        if (now > endDate) {
          // Auto-expire the coupon
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { status: "EXPIRED" },
          });

          set.status = 400;
          return {
            valid: false,
            error: "Campaign ended",
            message: "แคมเปญสิ้นสุดแล้ว",
            coupon,
          };
        }

        // Coupon is valid
        return {
          valid: true,
          message: "คูปองนี้สามารถใช้ได้",
          coupon,
        };
      } catch (error) {
        console.error("Error validating coupon:", error);
        set.status = 500;
        return {
          valid: false,
          error: "Failed to validate coupon",
          message: "เกิดข้อผิดพลาดในการตรวจสอบคูปอง",
        };
      }
    },
    {
      body: t.Object({
        code: t.String(),
      }),
    }
  )
  .post(
    "/redeem",
    async ({ body, headers, set }) => {
      try {
        const { code } = body;

        // Get user from token
        const decoded = await authenticateRequest(headers.authorization);

        if (!decoded) {
          set.status = 401;
          return { error: "Invalid token" };
        }

        // Find coupon
        const coupon = await prisma.coupon.findUnique({
          where: { code },
          include: {
            campaign: true,
          },
        });

        if (!coupon) {
          set.status = 404;
          return {
            success: false,
            error: "Coupon not found",
            message: "คูปองนี้ไม่มีในระบบ",
          };
        }

        // Check if already used
        if (coupon.status === "USED") {
          set.status = 400;
          return {
            success: false,
            error: "Coupon already used",
            message: "คูปองนี้ถูกใช้ไปแล้ว",
          };
        }

        // Check if expired
        if (coupon.status === "EXPIRED") {
          set.status = 400;
          return {
            success: false,
            error: "Coupon expired",
            message: "คูปองนี้หมดอายุแล้ว",
          };
        }

        // Check campaign dates
        const now = new Date();
        const startDate = new Date(coupon.campaign.startDate);
        const endDate = new Date(coupon.campaign.endDate);

        if (now < startDate || now > endDate) {
          set.status = 400;
          return {
            success: false,
            error: "Campaign not active",
            message: "แคมเปญไม่อยู่ในช่วงเวลาที่กำหนด",
          };
        }

        // Redeem coupon (transactional)
        const result = await prisma.$transaction(async (tx) => {
          // Update coupon status
          const updatedCoupon = await tx.coupon.update({
            where: { id: coupon.id },
            data: { status: "USED" },
          });

          // Create redemption log
          const redemption = await tx.redemptionLog.create({
            data: {
              couponId: coupon.id,
              userId: decoded.userId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          return { coupon: updatedCoupon, redemption };
        });

        return {
          success: true,
          message: "ใช้คูปองสำเร็จ",
          coupon: result.coupon,
          redemption: result.redemption,
        };
      } catch (error) {
        console.error("Error redeeming coupon:", error);
        set.status = 500;
        return {
          success: false,
          error: "Failed to redeem coupon",
          message: "เกิดข้อผิดพลาดในการใช้คูปอง",
        };
      }
    },
    {
      body: t.Object({
        code: t.String(),
      }),
    }
  )
  .get("/history", async ({ headers, query, set }) => {
    try {
      // Get user from token (optional for admins)
      const decoded = await authenticateRequest(headers.authorization);

      if (!decoded) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      const { userId } = query;

      // If admin, can see all history or filter by user
      // If staff, can only see their own history
      const redemptions = await prisma.redemptionLog.findMany({
        where: {
          ...(decoded.role === "STAFF" || userId
            ? { userId: userId || decoded.userId }
            : {}),
        },
        include: {
          coupon: {
            include: {
              campaign: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { redeemedAt: "desc" },
      });

      return { redemptions };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to fetch redemption history" };
    }
  });
